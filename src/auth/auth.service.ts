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
import { AvatarsService } from '../profiles/avatars.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly avatarsService: AvatarsService,
    ) {}

    async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
        if (await this.usersService.existsByEmail(createUserDto.email)) {
            throw new ConflictException('Email is already registered');
        }

        const user = await this.usersService.create(createUserDto);

        const payload: JwtPayload = { sub: user.id, email: user.email };

        const token = await this.jwtService.signAsync(payload);

        return this.respondWith(user, token);
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

        return this.respondWith(user, await this.jwtService.signAsync(payload));
    }

    /**
     * Both replies go through here so they cannot drift apart. The avatar is
     * filled in on the way out for the same reason /profiles does it: the
     * column holds a filename, and an account that has never uploaded one
     * still has a Gravatar to show. Every user owns a profile from the moment
     * create() inserts it, so there is nothing to guard against here.
     */
    private respondWith(user: User, accessToken: string): AuthResponseDto {
        this.avatarsService.resolve(user.profile, user.email);

        return new AuthResponseDto(user, accessToken);
    }
}
