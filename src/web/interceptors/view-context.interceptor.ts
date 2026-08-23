import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { RENDER_METADATA } from '@nestjs/common/constants';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.type';
import { ProfilesService } from '../../profiles/profiles.service';
import { csrfToken } from '../guards/csrf.guard';
import { FLASH_COOKIE } from '../session';

/**
 * Everything every page needs and no controller should have to remember: the
 * signed-in profile for the header, a CSRF token for the forms, and any flash
 * message left behind by the redirect that landed here.
 *
 * Scoped to handlers carrying @Render() so it never touches a JSON response —
 * the API and the views share these controllers' services, not their shape.
 */
@Injectable()
export class ViewContextInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly profilesService: ProfilesService,
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const isView = this.reflector.get<string | undefined>(
            RENDER_METADATA,
            context.getHandler(),
        );

        if (isView === undefined) {
            return next.handle();
        }

        const http = context.switchToHttp();
        const request = http.getRequest<AuthenticatedRequest>();
        const response = http.getResponse<Response>();

        const token = csrfToken(request, response);
        const flash = takeFlash(request, response);

        return next.handle().pipe(
            map(async (body: unknown) => {
                const model = (body ?? {}) as Record<string, unknown>;

                return {
                    csrfToken: token,
                    flash,
                    currentProfile: await this.currentProfile(request),
                    ...model,
                };
            }),
        );
    }

    /**
     * The header shows the signed-in user's name and avatar, so it is needed
     * on every page rather than only the ones about a profile. Absent rather
     * than fatal when signed out, which is what the layout branches on.
     */
    private async currentProfile(request: AuthenticatedRequest) {
        if (!request.user) {
            return null;
        }

        try {
            return await this.profilesService.findOwnOrFail(request.user.sub);
        } catch {
            return null;
        }
    }
}

/**
 * Reads the flash cookie and clears it, so a message survives exactly one
 * redirect and does not reappear when the page is reloaded.
 */
function takeFlash(request: Request, response: Response): string | null {
    const value: unknown = request.cookies?.[FLASH_COOKIE];

    if (typeof value !== 'string' || value === '') {
        return null;
    }

    response.clearCookie(FLASH_COOKIE, { path: '/' });

    return value;
}
