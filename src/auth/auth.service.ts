import { JwtService } from '@nestjs/jwt';
import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import bcrypt from 'bcrypt';
import { JwtPayload } from './types/jwt.type';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
        if (await this.usersService.existsByEmail(createUserDto.email)) {
            throw new ConflictException('Email is already registered');
        }

        const user = await this.usersService.create(createUserDto);

        const payload: JwtPayload = { sub: user.id, email: user.email };

        const token = await this.jwtService.signAsync(payload);

        return new AuthResponseDto(user, token);
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.usersService.findByEmail(loginDto.email);

        if (
            !user ||
            !(await bcrypt.compare(loginDto.password, user.password))
        ) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload: JwtPayload = { sub: user.id, email: user.email };

        return new AuthResponseDto(
            user,
            await this.jwtService.signAsync(payload),
        );
    }
}
