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

    // async findAll(): Promise<User[]> {
    //     return await this.usersRepository.find();
    // }

    async create(createUserDto: CreateUserDto): Promise<User> {
        // displayName belongs to the profile and confirm is not a column, so
        // neither is spread onto the user.
        const { displayName, confirm, ...rest } = createUserDto;
        void confirm;

        const user = this.usersRepository.create({
            ...rest,
            password: await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS),
            // Rides along on the same save() so the account and its profile
            // land together, in a single transaction.
            profile: { displayName },
        });

        try {
            return await this.usersRepository.save(user);
        } catch (error) {
            const column = this.duplicateColumn(error);

            if (column !== null) {
                throw this.conflictFor(column);
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
            const column = this.duplicateColumn(error);

            if (column !== null) {
                throw this.conflictFor(column);
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

    /**
     * Backstop for the race the IsEmailUnique / IsUsernameUnique validators
     * cannot close: both check-then-insert, so two concurrent registrations can
     * both pass validation. Postgres names the offending column in `detail`
     * ("Key (email)=(a@b.c) already exists"), which is what tells the two
     * unique columns apart — the constraint names themselves are generated
     * hashes and not worth matching on.
     */
    private duplicateColumn(error: unknown): 'email' | 'username' | null {
        if (!(error instanceof QueryFailedError)) {
            return null;
        }

        const driverError = error.driverError as {
            code?: string;
            detail?: string;
        };

        if (driverError?.code !== POSTGRES_UNIQUE_VIOLATION) {
            return null;
        }

        if (driverError.detail?.includes('(username)')) {
            return 'username';
        }

        if (driverError.detail?.includes('(email)')) {
            return 'email';
        }

        return null;
    }

    private conflictFor(column: 'email' | 'username'): ConflictException {
        return new ConflictException(
            column === 'username'
                ? 'Username is already taken'
                : 'Email is already registered',
        );
    }

    // add comments

    // add views

    // add policies

    // upload images
}
