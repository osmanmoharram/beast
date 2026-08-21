import type { Request } from 'express';

export type JwtPayload = {
    sub: number;
    email: string;
};
