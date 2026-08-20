import { Type } from 'class-transformer';
import {
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
}
