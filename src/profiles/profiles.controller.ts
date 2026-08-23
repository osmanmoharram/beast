import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { OwnProfileDto } from './dto/own-profile.dto';
import { PublicProfileDto } from './dto/public-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) {}

    // 'me' is declared ahead of ':username' because the first matching route
    // wins: reversed, /profiles/me looks up a user literally called "me".
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async findMine(@CurrentUser() user: JwtPayload): Promise<OwnProfileDto> {
        return new OwnProfileDto(
            await this.profilesService.findByUserId(user.sub),
        );
    }

    @Patch('me')
    @HttpCode(HttpStatus.OK)
    async update(
        @Body() updateProfileDto: UpdateProfileDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<OwnProfileDto> {
        return new OwnProfileDto(
            await this.profilesService.update(user.sub, updateProfileDto),
        );
    }

    // Public in what it shows, not in who may call it: AuthGuard is global and
    // this route does not opt out with @Public(), matching /posts.
    @Get(':username')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('username') username: string,
    ): Promise<PublicProfileDto> {
        return new PublicProfileDto(
            await this.profilesService.findByUsername(username),
        );
    }
}
