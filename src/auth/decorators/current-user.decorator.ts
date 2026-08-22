import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { JwtPayload } from '../types/jwt.type';

/**
 * Reads the JWT payload that AuthGuard attached to the request. Non-null
 * because the guard is registered globally via APP_GUARD, so any handler that
 * runs at all has already been through it — @Public() routes excepted, which
 * must not use this decorator.
 */
export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): JwtPayload => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        return request.user!;
    },
);
