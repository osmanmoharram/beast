import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import multerOptions from '../config/uploads/options';
import { AvatarsService } from './avatars.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';
import { PolicyGuard } from '../common/policies/policy.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Profile]),
        // Registered on the module rather than passed to FileInterceptor so the
        // size limit can come from configuration: a decorator argument is
        // evaluated at import time, before ConfigModule has read the .env.
        MulterModule.registerAsync({
            inject: [ConfigService],
            useFactory: multerOptions,
        }),
    ],
    controllers: [ProfilesController],
    providers: [ProfilesService, AvatarsService, PolicyGuard],
    // Exported for AuthModule: register and login both answer with the user's
    // profile, and it has to carry the same avatar as everywhere else.
    exports: [AvatarsService, ProfilesService],
})
export class ProfilesModule {}
