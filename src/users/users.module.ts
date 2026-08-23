import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { IsEmailUniqueConstraint } from './validators/is-email-unique.validator';
import { IsUsernameUniqueConstraint } from './validators/is-username-unique.validator';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UsersController],
    providers: [
        UsersService,
        IsEmailUniqueConstraint,
        IsUsernameUniqueConstraint,
    ],
    exports: [UsersService],
})
export class UsersModule {}
