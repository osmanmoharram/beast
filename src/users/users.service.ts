import { ConflictException, Injectable } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;
// SQLSTATE 23505: unique_violation. Postgres reports it on the email index.
const POSTGRES_UNIQUE_VIOLATION = '23505';

// export interface RegisteredUser {
//     user: Omit<User, 'password'>;
//     accessToken: string;
// }

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

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
