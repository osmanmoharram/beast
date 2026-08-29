import {
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseFilePipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Owns } from '../common/policies/owns.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { SuccessResponse } from '../common/types/success-response';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Paginated } from '../common/types/paginated';
// Reaching into web/ for this one import: CsrfGuard refuses a multipart
// request unless the route declares this, and this route is reachable with
// the same session cookie the rendered pages use.
import { MultipartCsrfInterceptor } from '../web/guards/csrf.guard';
import { AVATAR_MIME_TYPES } from './avatars.service';
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
    findAll(
        @Query() paginationDto: PaginationDto,
    ): Promise<Paginated<Profile>> {
        return this.profilesService.findAll(paginationDto);
    }

    // Declared above ':id' on purpose. Nest matches in declaration order, and
    // the other way round ParseIntPipe would reject 'me' with a 400.
    @Get('me')
    @HttpCode(HttpStatus.OK)
    findOwn(@CurrentUser() user: JwtPayload): Promise<Profile> {
        return this.profilesService.findOwnOrFail(user.sub);
    }

    /**
     * Own profile only, like /profiles/me: an avatar is the one thing on a
     * profile a client sets by uploading, and it sets it on its own.
     *
     * Size and count limits come from the multer options the module registers;
     * the type is checked here, against the file's magic numbers rather than
     * the Content-Type the client claimed. `overrideMimeType` then writes the
     * detected type back onto the file, which is what AvatarsService reads to
     * pick an extension.
     */
    @Post('me/avatar')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('avatar'), MultipartCsrfInterceptor)
    uploadOwnAvatar(
        @CurrentUser() user: JwtPayload,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({
                        fileType: AVATAR_MIME_TYPES,
                        overrideMimeType: true,
                    }),
                ],
            }),
        )
        file: Express.Multer.File,
    ): Promise<Profile> {
        return this.profilesService.uploadOwnAvatar(user.sub, file);
    }

    @Delete('me/avatar')
    @HttpCode(HttpStatus.OK)
    removeOwnAvatar(@CurrentUser() user: JwtPayload): Promise<Profile> {
        return this.profilesService.removeOwnAvatar(user.sub);
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
