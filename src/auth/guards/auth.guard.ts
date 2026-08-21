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

        const token = this.extractBearerToken(request);

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

    private extractBearerToken(
        request: AuthenticatedRequest,
    ): string | undefined {
        const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

        return scheme === 'Bearer' && token ? token : undefined;
    }
}
