import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsUrl,
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

    /**
     * Public origin of this API. Uploaded files are served by the app itself,
     * so it is the only way to hand a client an absolute URL for one — the
     * request that stores an avatar is not necessarily the one that reads it.
     *
     * `require_tld` is off because the local origin is http://localhost:3000.
     */
    @IsUrl({ require_tld: false })
    APP_URL: string;
}
