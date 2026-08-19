import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions.js';

type DatabaseOptions = PostgresDataSourceOptions & {
    autoLoadEntities?: TypeOrmModuleOptions['autoLoadEntities'];
};

/**
 * Built lazily from ConfigService instead of at import time: `.env` is only
 * read once ConfigModule.forRoot() runs, which happens after this module's
 * imports are evaluated. Touching process.env here would see undefined.
 *
 * Values come back already validated and converted by the DatabaseVariables
 * schema, so PORT is a number and SYNCHRONIZE a boolean without re-parsing.
 */
export default function databaseOptions(
    config: ConfigService,
): DatabaseOptions {
    return {
        type: config.getOrThrow<string>(
            'TYPEORM_TYPE',
        ) as PostgresDataSourceOptions['type'],
        host: config.getOrThrow<string>('TYPEORM_HOST'),
        port: config.getOrThrow<number>('TYPEORM_PORT'),
        username: config.getOrThrow<string>('TYPEORM_USERNAME'),
        password: config.getOrThrow<string>('TYPEORM_PASSWORD'),
        database: config.getOrThrow<string>('TYPEORM_NAME'),
        autoLoadEntities: config.getOrThrow<boolean>(
            'TYPEORM_AUTOLOAD_ENTITIES',
        ),
        synchronize: config.getOrThrow<boolean>('TYPEORM_SYNCHRONIZE'),
    };
}
