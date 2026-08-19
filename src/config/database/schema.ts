import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsString,
    Max,
    Min,
} from 'class-validator';

export enum DatabaseType {
    mysql = 'mysql',
    postgres = 'postgres',
    mariadb = 'mariadb',
    sqlite = 'sqlite',
}

/**
 * Every value arrives from `process.env` as a string, so numeric and boolean
 * variables are converted before validation rather than after.
 */
export class DatabaseVariables {
    @IsEnum(DatabaseType)
    TYPEORM_TYPE: DatabaseType;

    @IsString()
    @IsNotEmpty()
    TYPEORM_HOST: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(65535)
    TYPEORM_PORT: number;

    @IsString()
    @IsNotEmpty()
    TYPEORM_USERNAME: string;

    @IsString()
    @IsNotEmpty()
    TYPEORM_NAME: string;

    // Required, but may legitimately be empty.
    @IsString()
    TYPEORM_PASSWORD: string;

    @Transform(({ value }: TransformFnParams): unknown => {
        const raw: unknown = value;
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        return raw;
    })
    @IsBoolean()
    TYPEORM_AUTOLOAD_ENTITIES: boolean;

    // Anything other than 'true'/'false' passes through untouched so that
    // @IsBoolean rejects it instead of it silently becoming false.
    @Transform(({ value }: TransformFnParams): unknown => {
        const raw: unknown = value;
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        return raw;
    })
    @IsBoolean()
    TYPEORM_SYNCHRONIZE: boolean;
}
