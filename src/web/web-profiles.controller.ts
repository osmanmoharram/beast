import {
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    Param,
    ParseFilePipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Render,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AVATAR_MIME_TYPES } from '../profiles/avatars.service';
import { MultipartCsrfInterceptor } from './guards/csrf.guard';
import { UpdateProfileDto } from '../profiles/dto/update-profile.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { flash, messagesOf, validateForm } from './web.helpers';
import { pagerOf } from './pager';

@Controller()
export class WebProfilesController {
    constructor(private readonly profilesService: ProfilesService) {}

    @Get('profiles')
    @Render('profiles/index')
    async list(@Query() paginationDto: PaginationDto) {
        const { data, meta } =
            await this.profilesService.findAll(paginationDto);

        return {
            title: 'People',
            profiles: data,
            pager: pagerOf(meta, '/profiles'),
        };
    }

    // Above ':id', or ParseIntPipe would reject the literal 'me' with a 400.
    @Get('profiles/me')
    @Render('profiles/edit')
    async editOwn(@CurrentUser() user: JwtPayload) {
        const profile = await this.profilesService.findOwnOrFail(user.sub);

        return { title: 'Your profile', profile, ...birthDateFor(profile) };
    }

    @Get('profiles/:id')
    @Render('profiles/show')
    async show(@Param('id', ParseIntPipe) id: number) {
        const profile = await this.profilesService.findOneOrFail(id);

        return { title: profile.displayName, profile };
    }

    @Patch('profiles/me')
    async update(
        @CurrentUser() user: JwtPayload,
        @Body() body: Record<string, unknown>,
        @Res() response: Response,
    ): Promise<void> {
        const profile = await this.profilesService.findOwnOrFail(user.sub);

        // An empty date field arrives as '', which is not a date; dropping it
        // means "leave unchanged" rather than "fail validation".
        if (body.birthDate === '') {
            delete body.birthDate;
        }

        const { value, errors } = await validateForm(UpdateProfileDto, body);

        if (errors.length > 0) {
            response.status(400).render('profiles/edit', {
                title: 'Your profile',
                profile,
                errors,
                ...birthDateFor(profile),
            });

            return;
        }

        await this.profilesService.update(profile.id, value);

        flash(response, 'Profile saved.');
        response.redirect('/profiles/me');
    }

    /**
     * Interceptor order matters: FileInterceptor parses the multipart body,
     * and only then can the CSRF check see the hidden field it carries.
     */
    @Post('profiles/me/avatar')
    @UseInterceptors(FileInterceptor('avatar'), MultipartCsrfInterceptor)
    async uploadAvatar(
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
        @Res() response: Response,
    ): Promise<void> {
        try {
            await this.profilesService.uploadOwnAvatar(user.sub, file);
            flash(response, 'Avatar updated.');
        } catch (error) {
            flash(response, messagesOf(error)[0]);
        }

        response.redirect('/profiles/me');
    }

    @Delete('profiles/me/avatar')
    async removeAvatar(
        @CurrentUser() user: JwtPayload,
        @Res() response: Response,
    ): Promise<void> {
        await this.profilesService.removeOwnAvatar(user.sub);

        flash(response, 'Avatar removed.');
        response.redirect('/profiles/me');
    }
}

/** <input type="date"> only accepts YYYY-MM-DD. */
function birthDateFor(profile: { birthDate?: Date | null }) {
    return {
        birthDateValue: profile.birthDate
            ? new Date(profile.birthDate).toISOString().slice(0, 10)
            : '',
        today: new Date().toISOString().slice(0, 10),
    };
}
