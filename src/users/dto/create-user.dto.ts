import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    username!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    password!: string;

    @IsNotEmpty()
    @IsString()
    @Match('password')
    confirm!: string;
}
