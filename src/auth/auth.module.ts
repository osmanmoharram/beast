import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import jwtOptions from '../config/jwt/options';
import { AuthGuard } from './guards/auth.guard';

@Module({
    imports: [
        UsersModule,
        // For AvatarsService: the user in an auth reply brings its profile
        // along, and a profile without its avatar resolved is half a profile.
        ProfilesModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: jwtOptions,
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
