import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { ConfirmPassword } from '../validators/confirm-password.validator';
import { IsEmailUnique } from '../validators/is-email-unique.validator';
import { IsUsernameUnique } from '../validators/is-username-unique.validator';

export class CreateUserDto {
    // Seeds Profile.displayName. Collected here rather than defaulted from
    // `username` so the handle and the display name never start out identical.
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    displayName!: string;

    // Stored bare, the way Twitter/X and Instagram store handles: the leading
    // @ is presentation, so a value containing one is rejected outright rather
    // than silently stripped.
    @IsNotEmpty()
    @IsString()
    @Length(3, 30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message:
            'username may only contain letters, numbers and underscores, without a leading @',
    })
    @IsUsernameUnique()
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
