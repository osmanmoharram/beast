import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route (or a whole controller) out of the globally registered
 * AuthGuard. Needed by anything that runs before a token exists — logging in,
 * registering — since the guard rejects every request by default.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
