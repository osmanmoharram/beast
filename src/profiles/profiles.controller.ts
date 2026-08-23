import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
} from '@nestjs/common';
import { Owns } from '../common/policies/owns.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { SuccessResponse } from '../common/types/success-response';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { ProfilesService } from './profiles.service';

/**
 * No create or delete route: a profile is inserted with its user at
 * registration and removed with it, so every account has exactly one for its
 * whole lifetime and PATCH is the only write.
 */
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<Profile[]> {
        return this.profilesService.findAll();
    }

    // Declared above ':id' on purpose. Nest matches in declaration order, and
    // the other way round ParseIntPipe would reject 'me' with a 400.
    @Get('me')
    @HttpCode(HttpStatus.OK)
    findOwn(@CurrentUser() user: JwtPayload): Promise<Profile> {
        return this.profilesService.findOwnOrFail(user.sub);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Profile> {
        return this.profilesService.findOneOrFail(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @Owns(Profile, 'user.id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<SuccessResponse> {
        return this.profilesService.update(id, updateProfileDto);
    }
}
