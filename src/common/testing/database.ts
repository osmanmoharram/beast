import { config } from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PluralNamingStrategy } from '../../config/database/naming.strategy';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Profile } from '../../profiles/entities/profile.entity';

config({ quiet: true });

/**
 * Test-only. Points TypeORM at a throwaway database (`beast_test` unless
 * TYPEORM_TEST_NAME says otherwise) and rebuilds the schema on every
 * connection, so specs start from empty tables and never touch the
 * development data in TYPEORM_NAME.
 *
 * Entities are listed rather than auto-loaded: autoLoadEntities only picks up
 * whatever forFeature() the spec happened to import, which breaks as soon as
 * one entity points at another the spec did not ask for. New entity, new line.
 */
export function testDatabaseOptions(): TypeOrmModuleOptions {
    return {
        type: 'postgres',
        host: process.env.TYPEORM_HOST ?? 'localhost',
        port: Number(process.env.TYPEORM_PORT ?? 5432),
        username: process.env.TYPEORM_USERNAME ?? 'postgres',
        password: process.env.TYPEORM_PASSWORD ?? '',
        database: process.env.TYPEORM_TEST_NAME ?? 'beast_test',
        entities: [User, Post, Comment, Profile],
        namingStrategy: new PluralNamingStrategy(),
        synchronize: true,
        dropSchema: true,
        // A spec that cannot reach postgres should say so at once rather than
        // spending half a minute retrying.
        retryAttempts: 0,
    };
}
