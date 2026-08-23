import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import validate from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseOptions from './config/database/options';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ProfilesModule } from './profiles/profiles.module';
import { WebModule } from './web/web.module';
import { RouterModule } from '@nestjs/core';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: databaseOptions,
        }),
        UsersModule,
        AuthModule,
        PostsModule,
        CommentsModule,
        ProfilesModule,
        WebModule,
        /**
         * The JSON API moves under /api so the server-rendered pages can have
         * the bare paths — /posts is a page a person visits, /api/posts is the
         * resource behind it. Done here rather than with setGlobalPrefix,
         * which has no way to exempt WebModule.
         *
         * Static files are unaffected: /uploads is mounted on the Express app
         * itself, below Nest's router.
         */
        RouterModule.register([
            {
                path: 'api',
                children: [
                    AuthModule,
                    UsersModule,
                    PostsModule,
                    CommentsModule,
                    ProfilesModule,
                ],
            },
        ]),
    ],
})
export class AppModule {}
