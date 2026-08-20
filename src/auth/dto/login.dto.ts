import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

const normaliseEmail = ({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
    @IsEmail()
    @Transform(normaliseEmail)
    email!: string;

    // Deliberately no length rules: credentials that predate a policy change
    // must still be able to log in, and the check is the hash comparison.
    @IsString()
    @IsNotEmpty()
    password!: string;
}
