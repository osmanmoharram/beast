import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async findAll(): Promise<User[]> {
        return await this.usersRepository.find();
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = this.usersRepository.create({
            ...createUserDto,
            password: await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS),
        });

        try {
            return await this.usersRepository.save(user);
        } catch (error) {
            if (this.isDuplicateEntry(error)) {
                throw new ConflictException('Email is already registered');
            }

            throw error;
        }
    }

    async findOneOrFail(id: User['id']): Promise<User> {
        const user = await this.findOne(id);

        if (user === null) {
            throw new NotFoundException(`User ${id} not found`);
        }

        return user;
    }

    async update(id: User['id'], updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOneOrFail(id);

        // `password` has to be hashed and `confirm` is not a column, so both
        // are kept out of the assignment rather than written to the entity raw.
        const { confirm, password, ...rest } = updateUserDto;
        void confirm;

        // Mutating the loaded entity rather than spreading into a new object
        // literal: save() hands back whatever shape it was given, and
        // ClassSerializerInterceptor only applies @Exclude() to real User
        // instances, so a literal would leak the password hash in the response.
        Object.assign(user, rest);

        if (password !== undefined) {
            user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
        }

        try {
            return await this.usersRepository.save(user);
        } catch (error) {
            if (this.isDuplicateEntry(error)) {
                throw new ConflictException('Email is already registered');
            }

            throw error;
        }
    }

    async remove(id: User['id']): Promise<void> {
        const { affected } = await this.usersRepository.delete({ id });

        if (!affected) {
            throw new NotFoundException(`User ${id} not found`);
        }
    }

    async findByEmail(email: CreateUserDto['email']): Promise<User | null> {
        return this.usersRepository.findOneBy({ email });
    }

    async existsByEmail(email: CreateUserDto['email']): Promise<boolean> {
        return await this.usersRepository.existsBy({ email });
    }

    private async findOne(id: User['id']): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id },
            relations: {
                posts: true,
            },
        });
    }

    private isDuplicateEntry(error: unknown): boolean {
        return (
            error instanceof QueryFailedError &&
            (error.driverError as { code?: string })?.code ===
                POSTGRES_UNIQUE_VIOLATION
        );
    }

    // add comments

    // add views

    // add policies

    // add profiles

    // upload images

    // make user names start with @
}
