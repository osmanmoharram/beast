import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/**
 * URL prefix the uploads directory is served under. Shared by main.ts, which
 * mounts the static handler, and AvatarsService, which builds the URLs that
 * point at it — the two have to agree or every stored avatar 404s.
 */
export const UPLOADS_ROUTE = '/uploads';

export function uploadsPath(config: ConfigService): string {
    return resolve(process.cwd(), config.getOrThrow<string>('UPLOADS_DIR'));
}

/**
 * Memory storage rather than multer's disk storage: validation runs after the
 * interceptor, so writing straight to disk would leave a file behind every
 * time a request is rejected. Buffering also lets the file's real type decide
 * its extension instead of trusting the name the client sent.
 */
export default function multerOptions(config: ConfigService): MulterOptions {
    return {
        storage: memoryStorage(),
        limits: {
            fileSize: config.getOrThrow<number>('UPLOADS_MAX_FILE_SIZE'),
            files: 1,
        },
    };
}
