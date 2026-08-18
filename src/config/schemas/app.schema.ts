import { Type } from 'class-transformer';
import {
    // IsAlphanumeric,
    IsEnum,
    IsInt,
    IsNotEmpty,
    Length,
    IsString,
    Max,
    Min,
} from 'class-validator';

export enum EnvType {
    local = 'local',
    stagging = 'stagging',
    testing = 'testing',
    production = 'production',
}

// export enum JWTExpiresInType {
//     ONE_HOUR = '1h',
//     FIVE_HOURS = '5h',
//     FIFTEEN_HOURS = '15h',
//     TWENTY_HOURS = '20h',
//     ONE_DAY = '1d',
//     TWO_DAYS = '2d',
//     FIVE_DAYS = '5d',
//     TEN_DAYS = '10d',
// }

/**
 * Every value arrives from `process.env` as a string, so numeric and boolean
 * variables are converted before validation rather than after.
 */
export class EnvironmentVariables {
    @IsString()
    @Length(3, 20)
    APP_NAME: string;

    @IsNotEmpty()
    @IsEnum(EnvType)
    NODE_ENV: string;

    @IsInt()
    @Min(1)
    @Max(8888)
    @Type(() => Number)
    PORT: number;

    // @Type(() => String)
    // @IsAlphanumeric()
    // @Min(10)
    // @Max(100)
    // JWT_SECRET_KEY: string;

    // @IsString()
    // @IsNotEmpty()
    // @IsEnum(JWTExpiresInType)
    // JWT_EXPIRES_IN: string;
}
