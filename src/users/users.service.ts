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

    async findOne(id: User['id']): Promise<User | null> {
        return this.usersRepository.findOneBy({ id });
    }

    async update(id: User['id'], updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOneOrFail(id);

        const updated = { ...user, ...updateUserDto };

        // Assigned field by field rather than with Object.assign so `confirm`,
        // which is not a column, never reaches the entity.
        if (updateUserDto.username !== undefined) {
            user.username = updateUserDto.username;
        }

        if (updateUserDto.email !== undefined) {
            user.email = updateUserDto.email;
        }

        if (updateUserDto.password !== undefined) {
            user.password = await bcrypt.hash(
                updateUserDto.password,
                BCRYPT_ROUNDS,
            );
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

    async findOneOrFail(id: User['id']): Promise<User> {
        const user = await this.findOne(id);

        if (user === null) {
            throw new NotFoundException(`User ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: CreateUserDto['email']): Promise<User | null> {
        return this.usersRepository.findOneBy({ email });
    }

    async existsByEmail(email: CreateUserDto['email']): Promise<boolean> {
        return await this.usersRepository.existsBy({ email });
    }

    private isDuplicateEntry(error: unknown): boolean {
        return (
            error instanceof QueryFailedError &&
            (error.driverError as { code?: string })?.code ===
                POSTGRES_UNIQUE_VIOLATION
        );
    }
}
