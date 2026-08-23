import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    /**
     * No pre-flight uniqueness check: @IsEmailUnique on the DTO has already
     * run by the time this is entered, and the unique constraint behind
     * create() catches the race the validator cannot. A third query asking
     * the same question only added a round trip to every registration.
     */
    async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
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
