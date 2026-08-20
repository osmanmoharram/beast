import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

const SALT_ROUNDS = 10;

export interface RegisteredUser {
    user: Omit<User, 'password'>;
    accessToken: string;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<RegisteredUser> {
        const password = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);

        const saved = await this.usersRepository.save(
            this.usersRepository.create({ ...createUserDto, password }),
        );

        const accessToken = await this.jwtService.signAsync({
            sub: saved.id,
            username: saved.username,
        });

        // The hash never leaves the service.
        const { password: hashed, ...user } = saved;
        void hashed;

        return { user, accessToken };
    }
}
