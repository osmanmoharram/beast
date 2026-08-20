import { ConflictException, Injectable } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

const BCRYPT_ROUNDS = 10;
const MYSQL_DUPLICATE_ENTRY = 'ER_DUP_ENTRY';

// export interface RegisteredUser {
//     user: Omit<User, 'password'>;
//     accessToken: string;
// }

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly jwtService: JwtService,
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

    async existsByEmail(email: CreateUserDto['email']) {
        return await this.usersRepository.findOneBy({ email });
    }

    private isDuplicateEntry(error: unknown): boolean {
        return (
            error instanceof QueryFailedError &&
            (error.driverError as { code?: string })?.code ===
                MYSQL_DUPLICATE_ENTRY
        );
    }
}
