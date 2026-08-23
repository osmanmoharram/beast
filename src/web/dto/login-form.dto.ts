import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Looser than the API's LoginDto on purpose: a bad email typed into a form
 * should come back as "Invalid email or password" on the login page, not as a
 * 400 listing validation rules. The credential check does the rejecting.
 */
export class LoginFormDto {
    @IsString()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}
