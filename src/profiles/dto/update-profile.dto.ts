import { Type } from 'class-transformer';
import {
    IsDate,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    MaxDate,
} from 'class-validator';

/**
 * The only JSON write path a profile has. There is no create DTO because
 * profiles are inserted alongside their user at registration, never through a
 * route, and no `avatar` field because the picture is set by uploading it to
 * /profiles/me/avatar — accepting a filename here would let a client point its
 * profile at any file in the uploads directory.
 */
export class UpdateProfileDto {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    displayName?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    @MaxDate(() => new Date(), { message: 'birthDate must be in the past' })
    birthDate?: Date;
}
