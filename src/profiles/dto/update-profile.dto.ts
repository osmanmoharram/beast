import { Type } from 'class-transformer';
import {
    IsDate,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Length,
    MaxDate,
} from 'class-validator';

/**
 * The only write path a profile has. There is no create DTO because profiles
 * are inserted alongside their user at registration, never through a route.
 */
export class UpdateProfileDto {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    displayName?: string;

    @IsOptional()
    @IsUrl()
    avatar?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    @MaxDate(() => new Date(), { message: 'birthDate must be in the past' })
    birthDate?: Date;
}
