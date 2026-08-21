import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
        return this.authService.register(createUserDto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
        return this.authService.login(loginUserDto);
    }
}
