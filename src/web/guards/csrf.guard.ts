import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
    CallHandler,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import {
    CSRF_COOKIE,
    CSRF_FIELD,
    SESSION_COOKIE,
    csrfCookieOptions,
} from '../session';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF protection for the cookie-authenticated pages.
 *
 * The bearer-token API never needed this: another origin cannot read a token
 * out of localStorage, so it cannot attach one. A cookie is different — the
 * browser sends it on any request to this host, including a form some other
 * site submitted. The defence is to require a value the attacker cannot read:
 * a random token in a readable cookie that every form echoes back in a hidden
 * field. Same-origin policy stops another site reading the cookie, so it
 * cannot produce the matching field.
 */
export function assertCsrf(request: Request): void {
    const expected: unknown = request.cookies?.[CSRF_COOKIE];
    const body = request.body as Record<string, unknown> | undefined;
    const provided = body?.[CSRF_FIELD];

    if (
        typeof expected !== 'string' ||
        typeof provided !== 'string' ||
        !equals(expected, provided)
    ) {
        throw new ForbiddenException('Invalid or missing CSRF token');
    }
}

/** True when the request carries no cookie-borne authority to abuse. */
function isExempt(request: Request): boolean {
    return (
        SAFE_METHODS.has(request.method) ||
        // Authenticated by a header rather than by the cookie, which is what
        // AuthGuard prefers when both are present. The browser never attaches
        // this on its own, so another site cannot produce it without a
        // preflight that CORS refuses — there is no ambient authority to
        // borrow, and the SPA never has to carry a token.
        hasBearerToken(request) ||
        // Nothing was authenticated by cookie either, so there is nothing to
        // abuse: the login form itself lands here.
        !request.cookies?.[SESSION_COOKIE]
    );
}

function hasBearerToken(request: Request): boolean {
    return request.headers.authorization?.startsWith('Bearer ') ?? false;
}

/**
 * A multipart body has not been parsed when guards run — multer does that
 * inside FileInterceptor, which is an interceptor and therefore later. The
 * hidden field is genuinely absent at this point rather than missing, so those
 * requests are checked by MultipartCsrfInterceptor instead.
 */
function isMultipart(request: Request): boolean {
    return (
        request.headers['content-type']?.startsWith('multipart/form-data') ??
        false
    );
}

@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        if (isExempt(request)) {
            return true;
        }

        if (isMultipart(request)) {
            // Waved through only when something later will actually do the
            // check. A multipart route that forgets the interceptor is
            // refused here rather than silently exempted — the failure is
            // then obvious on the first request instead of invisible.
            if (!defersToInterceptor(this.reflector, context)) {
                throw new ForbiddenException('Invalid or missing CSRF token');
            }

            return true;
        }

        assertCsrf(request);

        return true;
    }
}

/**
 * Whether the route declares MultipartCsrfInterceptor, which is what makes
 * skipping the check here safe. Read off the same metadata @UseInterceptors
 * writes, so the two cannot disagree.
 */
function defersToInterceptor(
    reflector: Reflector,
    context: ExecutionContext,
): boolean {
    const declared = [
        ...(reflector.get<unknown[]>(
            INTERCEPTORS_METADATA,
            context.getHandler(),
        ) ?? []),
        ...(reflector.get<unknown[]>(
            INTERCEPTORS_METADATA,
            context.getClass(),
        ) ?? []),
    ];

    return declared.some(
        (interceptor) =>
            interceptor === MultipartCsrfInterceptor ||
            interceptor instanceof MultipartCsrfInterceptor,
    );
}

/**
 * The same check, run late enough to see a multipart body. Declared after
 * FileInterceptor on a route so multer has already moved the form's non-file
 * fields onto request.body.
 */
@Injectable()
export class MultipartCsrfInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();

        if (!isExempt(request)) {
            assertCsrf(request);
        }

        return next.handle();
    }
}

/**
 * Compared in constant time so the number of matching leading characters
 * cannot be read off the response time.
 */
function equals(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Issues the token if the visitor does not have one yet, and hands it to the
 * templates. Runs on every rendered request rather than only on pages with
 * forms: the cookie has to exist before the first form is drawn.
 */
export function csrfToken(
    request: Request,
    response: Response,
    isProduction: boolean,
): string {
    const existing: unknown = request.cookies?.[CSRF_COOKIE];

    if (typeof existing === 'string' && existing.length === 64) {
        return existing;
    }

    const token = randomBytes(32).toString('hex');

    // Deliberately not httpOnly. The form has to carry the value, and the
    // secret is not the token itself but that a foreign origin cannot read
    // this cookie to copy it.
    response.cookie(CSRF_COOKIE, token, csrfCookieOptions(isProduction));

    return token;
}
