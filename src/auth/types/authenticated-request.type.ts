import type { Request } from 'express';
import { JwtPayload } from './jwt.type';

/**
 * A request that has passed JwtAuthGuard. `user` is optional because the guard
 * is what populates it; read it through the @CurrentUser() decorator.
 */
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
