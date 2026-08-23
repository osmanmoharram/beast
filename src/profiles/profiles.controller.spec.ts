import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { Repository } from 'typeorm';
import { ProfilesModule } from './profiles.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { testDatabaseOptions } from '../common/testing/database';
import { EnvType } from '../config/app/schema';
import validate from '../config';

jest.setTimeout(30_000);

// jest sets NODE_ENV=test, which is not one of EnvType's values. Set before
// ConfigModule.forRoot() runs its validation, or every request 500s.
process.env.NODE_ENV = EnvType.testing;

describe('ProfilesController', () => {
    let app: INestApplication;
    let testingModule: TestingModule;
    let authService: AuthService;
    let users: Repository<User>;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true, validate }),
                TypeOrmModule.forRoot(testDatabaseOptions()),
                UsersModule,
                AuthModule,
                ProfilesModule,
            ],
        }).compile();

        app = testingModule.createNestApplication();
        // Mirrors main.ts, because the @Exclude() rules under test are only
        // applied by the global serializer.
        app.useGlobalPipes(
            new ValidationPipe({ transform: true, whitelist: true }),
        );
        app.useGlobalInterceptors(
            new ClassSerializerInterceptor(app.get(Reflector)),
        );
        await app.init();

        authService = testingModule.get(AuthService);
        users = testingModule.get(getRepositoryToken(User));
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await users.createQueryBuilder().delete().execute();
    });

    // getHttpServer() is typed `any`; narrowing once here keeps every call
    // below type-safe instead of silencing the rule at each one.
    function api() {
        return request(app.getHttpServer() as Server);
    }

    async function register(username = 'osman'): Promise<string> {
        const { accessToken } = await authService.register({
            username,
            email: `${username}@example.com`,
            password: 'secret',
            confirm: 'secret',
        });

        return accessToken;
    }

    it('gives the owner their own profile, birth date included', async () => {
        const token = await register();
        await api()
            .patch('/profiles/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ birthDate: '1991-05-10' })
            .expect(200);

        const response = await api()
            .get('/profiles/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toMatchObject({
            username: 'osman',
            birthDate: '1991-05-10',
        });
    });

    it('saves the fields sent to PATCH /profiles/me', async () => {
        const token = await register();

        const response = await api()
            .patch('/profiles/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ displayName: 'Osman Moharram', bio: 'Backend dev' })
            .expect(200);

        expect(response.body).toMatchObject({
            displayName: 'Osman Moharram',
            bio: 'Backend dev',
        });
    });

    it('keeps the birth date out of a public profile', async () => {
        const token = await register();
        await api()
            .patch('/profiles/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ birthDate: '1991-05-10', bio: 'Backend dev' })
            .expect(200);

        const response = await api()
            .get('/profiles/osman')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toMatchObject({ bio: 'Backend dev' });
        expect(response.body).not.toHaveProperty('birthDate');
    });

    it('keeps the owner email out of a public profile', async () => {
        const token = await register();

        const response = await api()
            .get('/profiles/osman')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(JSON.stringify(response.body)).not.toContain(
            'osman@example.com',
        );
    });

    it('rejects an anonymous request for /profiles/me', async () => {
        await api().get('/profiles/me').expect(401);
    });

    it('answers 404 for a username nobody holds', async () => {
        const token = await register();

        await api()
            .get('/profiles/ghost')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});
