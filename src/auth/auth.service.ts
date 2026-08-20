import { JwtService } from '@nestjs/jwt';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

export type JwtPayload = {
    sub: number;
    email: string;
};

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
}
