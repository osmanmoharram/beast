import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
    Injectable,
    OnModuleInit,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import gravatar from 'gravatar';
import { UPLOADS_ROUTE, uploadsPath } from '../config/uploads/options';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';

/**
 * Sub-directory of the uploads root. Avatars live apart from the images posts
 * will bring later so one kind can be pruned without touching the other.
 */
const AVATARS_DIRECTORY = 'avatars';

/**
 * Extension per accepted type, and at the same time the whitelist itself: a
 * type absent from here has no entry to look up, so it cannot be stored.
 * The extension is derived from the type rather than from the uploaded
 * filename, which is attacker-controlled and may not match the bytes.
 */
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

export const AVATAR_MIME_TYPES = new RegExp(
    `^(${Object.keys(EXTENSIONS).join('|')})$`,
);

const GRAVATAR_SIZE = '200';

/**
 * Gravatar serves this generated pattern for any hash it has no photo for,
 * which is what makes a fallback avatar unconditional — without it an unknown
 * address gets a 404 image instead.
 */
const GRAVATAR_FALLBACK = 'identicon';

/**
 * Owns everything about a profile picture: where the uploaded file lives, what
 * URL it is reachable at, and what stands in when there is no upload.
 */
@Injectable()
export class AvatarsService implements OnModuleInit {
    private readonly directory: string;
    private readonly baseUrl: string;

    constructor(config: ConfigService) {
        this.directory = join(uploadsPath(config), AVATARS_DIRECTORY);
        // Trailing slash on purpose: without it the URL constructor treats
        // 'avatars' as a file and drops it when the filename is appended.
        this.baseUrl = new URL(
            `${UPLOADS_ROUTE}/${AVATARS_DIRECTORY}/`,
            config.getOrThrow<string>('APP_URL'),
        ).toString();
    }

    /**
     * Created once at boot rather than per upload, so the first write of a
     * fresh deployment does not race a second one over the same mkdir.
     */
    async onModuleInit(): Promise<void> {
        await mkdir(this.directory, { recursive: true });
    }

    /**
     * Fills in the URL a client should render. Called on the way out of every
     * read: `avatar` holds a bare filename, which means nothing to a client on
     * its own, and an empty one still has to resolve to a picture.
     *
     * The email is a parameter rather than something read off `profile.user`
     * because that relation is not loaded on every path a profile reaches a
     * response through — the one in an /auth reply hangs off the user instead.
     * Taking it from the caller is what keeps the fallback identical
     * everywhere: seeded with anything else, a profile would come back wearing
     * one face on /profiles/me and another on /auth/login.
     */
    resolve<T extends Profile>(profile: T, email: User['email']): T {
        profile.avatarUrl = profile.avatar
            ? `${this.baseUrl}${profile.avatar}`
            : this.fallbackUrl(email);

        return profile;
    }

    /**
     * Writes the upload under a generated name and returns it for the caller
     * to persist. The client's filename is discarded entirely — reusing it
     * would let one user overwrite another's avatar by picking their name, and
     * a path separator in it would escape the uploads directory.
     */
    async store(file: Express.Multer.File): Promise<string> {
        const extension = EXTENSIONS[file.mimetype];

        // ParseFilePipe has already rejected everything else; this is the
        // backstop for the whitelist and the two lists drifting apart.
        if (extension === undefined) {
            throw new UnsupportedMediaTypeException(
                `${file.mimetype} is not a supported image type`,
            );
        }

        const filename = `${randomUUID()}.${extension}`;

        await writeFile(join(this.directory, filename), file.buffer);

        return filename;
    }

    /**
     * Deletes a previously stored file. A missing one is not an error: the row
     * pointing at it is already gone or about to be, and failing here would
     * turn a successful upload into a 500 over a file nobody can reach.
     */
    async discard(filename?: Profile['avatar']): Promise<void> {
        if (!filename) {
            return;
        }

        await unlink(join(this.directory, filename)).catch(() => undefined);
    }

    private fallbackUrl(email: User['email']): string {
        return gravatar.url(
            email,
            { s: GRAVATAR_SIZE, d: GRAVATAR_FALLBACK, protocol: 'https' },
            true,
        );
    }
}
