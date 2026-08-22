import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import validate from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseOptions from './config/database/options';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';

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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
