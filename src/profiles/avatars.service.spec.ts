import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { AvatarsService } from './avatars.service';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';

const APP_URL = 'https://blog.example';

const EMAIL = 'ada@example.com';

// md5('ada@example.com'), which is what makes the generated image stable.
const EMAIL_HASH = '3e3417d7ef77d5932a6734b916515ed5';

function profileWith(overrides: Partial<Profile> = {}): Profile {
    return Object.assign(new Profile(), {
        id: 1,
        displayName: 'Ada Lovelace',
        user: { email: EMAIL } as User,
        ...overrides,
    });
}

function upload(mimetype: string, buffer = Buffer.from('bytes')) {
    return { mimetype, buffer } as Express.Multer.File;
}

describe('AvatarsService', () => {
    let root: string;
    let service: AvatarsService;

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), 'avatars-'));

        const config = {
            getOrThrow: (key: string) =>
                key === 'UPLOADS_DIR' ? root : APP_URL,
        } as ConfigService;

        service = new AvatarsService(config);
        await service.onModuleInit();
    });

    afterEach(async () => {
        await rm(root, { recursive: true, force: true });
    });

    describe('resolve', () => {
        it('points at the uploaded file when there is one', () => {
            const profile = service.resolve(
                profileWith({ avatar: 'a1b2.png' }),
                EMAIL,
            );

            expect(profile.avatarUrl).toBe(
                `${APP_URL}/uploads/avatars/a1b2.png`,
            );
        });

        it('falls back to a gravatar of the email when there is not', () => {
            const profile = service.resolve(
                profileWith({ avatar: null }),
                EMAIL,
            );

            expect(profile.avatarUrl).toBe(
                `https://s.gravatar.com/avatar/${EMAIL_HASH}` +
                    '?s=200&d=identicon',
            );
        });

        /**
         * The reason the email is a parameter: an /auth reply resolves a
         * profile whose `user` relation was never loaded, and it has to come
         * out looking exactly like the one /profiles/me returns.
         */
        it('ignores the profile itself when seeding the fallback', () => {
            const loaded = service.resolve(
                profileWith({ avatar: null }),
                EMAIL,
            );
            const detached = service.resolve(
                profileWith({ avatar: null, user: undefined }),
                EMAIL,
            );

            expect(detached.avatarUrl).toBe(loaded.avatarUrl);
        });
    });

    describe('store', () => {
        it('names the file after its type, not after the upload', async () => {
            const filename = await service.store(upload('image/jpeg'));

            expect(filename).toMatch(/^[0-9a-f-]{36}\.jpg$/);
            await expect(
                readFile(join(root, 'avatars', filename)),
            ).resolves.toBeDefined();
        });

        it('gives two uploads of one image separate names', async () => {
            const first = await service.store(upload('image/png'));
            const second = await service.store(upload('image/png'));

            expect(first).not.toBe(second);
        });

        it('refuses a type it has no extension for', async () => {
            await expect(
                service.store(upload('image/svg+xml')),
            ).rejects.toThrow(UnsupportedMediaTypeException);
        });
    });

    describe('discard', () => {
        it('deletes the stored file', async () => {
            const filename = await service.store(upload('image/webp'));

            await service.discard(filename);

            await expect(
                readFile(join(root, 'avatars', filename)),
            ).rejects.toThrow();
        });

        it('is a no-op for a profile that never had an upload', async () => {
            await expect(service.discard(null)).resolves.toBeUndefined();
        });

        it('tolerates a file that is already gone', async () => {
            await expect(
                service.discard('missing.png'),
            ).resolves.toBeUndefined();
        });

        it('leaves other avatars alone', async () => {
            const kept = await service.store(upload('image/png'));
            await writeFile(join(root, 'avatars', 'marker'), 'x');

            await service.discard('missing.png');

            await expect(
                readFile(join(root, 'avatars', kept)),
            ).resolves.toBeDefined();
        });
    });
});
