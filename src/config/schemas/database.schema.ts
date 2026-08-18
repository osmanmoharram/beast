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
    DATABASE_TYPE: DatabaseType;

    @IsString()
    @IsNotEmpty()
    DATABASE_HOST: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(65535)
    DATABASE_PORT: number;

    @IsString()
    @IsNotEmpty()
    DATABASE_USERNAME: string;

    // Required, but may legitimately be empty.
    @IsString()
    DATABASE_PASSWORD: string;

    @IsString()
    @IsNotEmpty()
    DATABASE_NAME: string;

    // Anything other than 'true'/'false' passes through untouched so that
    // @IsBoolean rejects it instead of it silently becoming false.
    @Transform(({ value }: TransformFnParams): unknown => {
        const raw: unknown = value;
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        return raw;
    })
    @IsBoolean()
    DATABASE_SYNCHRONIZE: boolean;
}
