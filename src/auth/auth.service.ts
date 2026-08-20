import { JwtModule } from '@nestjs/jwt';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisteredUser, UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtModule: JwtModule,
    ) {}

    async register(createUserDto: CreateUserDto): Promise<RegisteredUser> {
        if (await this.usersService.existsByEmail(createUserDto.email)) {
            throw new ConflictException('Email is already registered');
        }

        const user = await this.usersService.create(createUserDto);

        return new AuthResponseDto(user);
    }
}
