import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { testDatabaseOptions } from '../common/testing/database';

jest.setTimeout(30_000);

describe('UsersService', () => {
    let testingModule: TestingModule;
    let usersService: UsersService;
    let profiles: Repository<Profile>;
    let users: Repository<User>;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDatabaseOptions()),
                UsersModule,
                ProfilesModule,
            ],
        }).compile();

        usersService = testingModule.get(UsersService);
        profiles = testingModule.get(getRepositoryToken(Profile));
        users = testingModule.get(getRepositoryToken(User));
    });

    afterAll(async () => {
        await testingModule.close();
    });

    beforeEach(async () => {
        // Profiles go with them: the FK is declared onDelete CASCADE.
        await users.createQueryBuilder().delete().execute();
    });

    async function register(): Promise<User> {
        return usersService.create({
            username: 'osman',
            email: 'osman@example.com',
            password: 'secret',
            confirm: 'secret',
        });
    }

    it('creates a profile for every new user', async () => {
        const user = await register();

        const profile = await profiles.findOne({
            where: { user: { id: user.id } },
        });

        expect(profile).not.toBeNull();
    });

    it('takes the profile with it when the user is removed', async () => {
        const user = await register();

        await usersService.remove(user.id);

        await expect(profiles.count()).resolves.toBe(0);
    });
});
