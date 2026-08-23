import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../types/jwt.type';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SESSION_COOKIE } from '../../web/session';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('Missing bearer token');
        }

        try {
            request.user = this.jwtService.verify<JwtPayload>(token);
        } catch {
            // jsonwebtoken throws its own error types (expired, malformed,
            // bad signature); surface all of them as a 401 rather than a 500.
            throw new UnauthorizedException('Invalid or expired token');
        }

        return true;
    }

    /**
     * Two ways in, one guard. An API client sends the JWT as a bearer token; a
     * browser following a link cannot set headers, so the server-rendered
     * pages send the same JWT in an httpOnly cookie. Accepting both here is
     * what lets @Owns() and every protected route work identically for the
     * SPA and the HTML views, instead of needing a parallel set of guards.
     *
     * The header wins when both are present: an explicit Authorization header
     * is a deliberate act, while a cookie rides along on its own.
     */
    private extractToken(request: AuthenticatedRequest): string | undefined {
        const [scheme, bearer] =
            request.headers.authorization?.split(' ') ?? [];

        if (scheme === 'Bearer' && bearer) {
            return bearer;
        }

        // cookie-parser populates this; typed loosely by express, so the
        // value is narrowed rather than trusted.
        const cookie: unknown = request.cookies?.[SESSION_COOKIE];

        return typeof cookie === 'string' && cookie ? cookie : undefined;
    }
}
