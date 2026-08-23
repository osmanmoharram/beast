import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { POST_SEARCH_INDEXES } from './entities/post.entity';

/**
 * Creates the indexes that make `q=` searches indexable.
 *
 * A trigram index cannot be declared with @Index: TypeORM emits btree, and a
 * btree is useless to `ILIKE '%term%'` because a leading wildcard has no
 * prefix to seek on. GIN over pg_trgm is the one index Postgres can use for a
 * match anywhere inside the text, and reaching it means raw DDL.
 *
 * Run here rather than in a migration because the project has TypeORM
 * synchronize the schema; when that gives way to migrations, this moves into
 * the first one and this service goes away. The statements are idempotent, so
 * a boot that finds them already there costs two catalogue lookups.
 */
@Injectable()
export class SearchIndexService implements OnModuleInit {
    private readonly logger = new Logger(SearchIndexService.name);

    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.dataSource.query(
                'CREATE EXTENSION IF NOT EXISTS pg_trgm',
            );

            for (const [name, column] of Object.entries(POST_SEARCH_INDEXES)) {
                await this.dataSource.query(
                    `CREATE INDEX IF NOT EXISTS "${name}" ` +
                        `ON posts USING gin ("${column}" gin_trgm_ops)`,
                );
            }
        } catch (error) {
            // Creating an extension wants elevated rights the deployment may
            // not grant. Search still returns the right rows without the
            // index, just by scanning, so this degrades rather than refusing
            // to boot over a missing optimisation.
            this.logger.warn(
                `Could not ensure trigram search indexes, ` +
                    `search will fall back to a sequential scan: ` +
                    `${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
