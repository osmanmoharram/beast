import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, from, switchMap } from 'rxjs';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.type';
import { ProfilesService } from '../../profiles/profiles.service';
import { csrfToken } from '../guards/csrf.guard';
import { wantsHtml } from '../web.helpers';
import { FLASH_COOKIE } from '../session';

/**
 * Everything every page needs and no controller should have to remember: the
 * signed-in profile for the header, a CSRF token for the forms, and any flash
 * message left behind by the redirect that landed here.
 *
 * Put on res.locals rather than merged into the handler's returned model,
 * because a handler holding @Res() — every form that redisplays itself with
 * validation errors — renders the template itself and never returns a model
 * for an interceptor to merge into. Express merges res.locals into the
 * options of every res.render(), so both routes to a template pick the
 * context up, including the one WebExceptionFilter takes. A key the handler
 * passes explicitly still wins, which is the precedence this had before.
 */
@Injectable()
export class ViewContextInterceptor implements NestInterceptor {
    constructor(private readonly profilesService: ProfilesService) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const http = context.switchToHttp();
        const request = http.getRequest<AuthenticatedRequest>();
        const response = http.getResponse<Response>();

        // Scoped to browser navigations rather than to @Render() handlers:
        // the redisplayed forms are the pages that need this most and carry no
        // such decorator. The JSON API shares these services but not this
        // shape, and must not pay for the profile lookup.
        if (!wantsHtml(request)) {
            return next.handle();
        }

        response.locals.csrfToken = csrfToken(request, response);
        response.locals.flash = takeFlash(request, response);

        // Resolved before the handler runs, not after it returns: a handler
        // that renders through @Res() has already sent the page by the time
        // control would come back here.
        return from(this.currentProfile(request)).pipe(
            switchMap((currentProfile) => {
                response.locals.currentProfile = currentProfile;

                return next.handle();
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
 *
 * Only on a safe method. A POST is what *sets* the next flash, and clearing
 * the cookie on the way in would leave the response carrying both a Set-Cookie
 * that empties it and the one the handler wrote, decided by their order.
 */
function takeFlash(request: Request, response: Response): string | null {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return null;
    }

    const value: unknown = request.cookies?.[FLASH_COOKIE];

    if (typeof value !== 'string' || value === '') {
        return null;
    }

    response.clearCookie(FLASH_COOKIE, { path: '/' });

    return value;
}
