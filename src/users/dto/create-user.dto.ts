import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ConfirmPassword } from '../validators/confirm-password.validator';
import { IsEmailUnique } from '../validators/is-email-unique.validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    username!: string;

    @IsNotEmpty()
    @IsEmail()
    @IsEmailUnique()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Length(3, 50)
    password!: string;

    @IsString()
    @IsNotEmpty()
    @ConfirmPassword()
    confirm!: string;
}
