import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfilesModule } from './profiles.module';
import { ProfilesService } from './profiles.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { testDatabaseOptions } from '../common/testing/database';

jest.setTimeout(30_000);

describe('ProfilesService', () => {
    let testingModule: TestingModule;
    let profilesService: ProfilesService;
    let usersService: UsersService;
    let users: Repository<User>;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDatabaseOptions()),
                UsersModule,
                ProfilesModule,
            ],
        }).compile();

        profilesService = testingModule.get(ProfilesService);
        usersService = testingModule.get(UsersService);
        users = testingModule.get(getRepositoryToken(User));
    });

    afterAll(async () => {
        await testingModule.close();
    });

    beforeEach(async () => {
        // Profiles go with them: the FK is declared onDelete CASCADE.
        await users.createQueryBuilder().delete().execute();
    });

    async function register(username = 'osman'): Promise<User> {
        return usersService.create({
            username,
            email: `${username}@example.com`,
            password: 'secret',
            confirm: 'secret',
        });
    }

    it('finds the profile belonging to a user', async () => {
        const user = await register();

        const profile = await profilesService.findByUserId(user.id);

        expect(profile.user.id).toBe(user.id);
    });

    it('finds a profile by the owner username', async () => {
        await register('osman');

        const profile = await profilesService.findByUsername('osman');

        expect(profile.user.username).toBe('osman');
    });

    it('rejects a username that belongs to nobody', async () => {
        await expect(profilesService.findByUsername('ghost')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('saves the fields it is given', async () => {
        const user = await register();

        await profilesService.update(user.id, {
            displayName: 'Osman Moharram',
            bio: 'Backend dev',
        });

        const profile = await profilesService.findByUserId(user.id);
        expect(profile.displayName).toBe('Osman Moharram');
        expect(profile.bio).toBe('Backend dev');
    });

    it('leaves fields it was not given untouched', async () => {
        const user = await register();
        await profilesService.update(user.id, { displayName: 'Osman' });

        await profilesService.update(user.id, { bio: 'Backend dev' });

        const profile = await profilesService.findByUserId(user.id);
        expect(profile.displayName).toBe('Osman');
    });

    it('clears a field when given null', async () => {
        const user = await register();
        await profilesService.update(user.id, { displayName: 'Osman' });

        await profilesService.update(user.id, { displayName: null });

        const profile = await profilesService.findByUserId(user.id);
        expect(profile.displayName).toBeNull();
    });
});
