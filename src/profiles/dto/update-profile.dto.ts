import {
    IsDateString,
    IsOptional,
    IsString,
    IsUrl,
    Length,
} from 'class-validator';

/**
 * Every field is optional and nullable: PATCH /profiles/me is the only way a
 * profile is ever written, so sending one field must not blank the rest, and
 * sending null is how a field gets cleared. @IsOptional() skips validation for
 * both undefined and null, which is what makes clearing work.
 */
export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(1, 50)
    displayName?: string | null;

    @IsOptional()
    @IsString()
    @Length(1, 280)
    bio?: string | null;

    @IsOptional()
    @IsUrl()
    @Length(1, 255)
    avatarUrl?: string | null;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    location?: string | null;

    @IsOptional()
    @IsUrl()
    @Length(1, 255)
    website?: string | null;

    @IsOptional()
    @IsDateString()
    birthDate?: string | null;
}
