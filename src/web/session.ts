/**
 * Name of the cookie the browser session lives in. The value is the same JWT
 * the API issues — there is no server-side session store, so signing in
 * through a form and signing in through /api/auth/login produce the same
 * credential, just delivered differently.
 */
export const SESSION_COOKIE = 'session';

/**
 * httpOnly is the reason to do this at all: unlike the token the SPA keeps in
 * localStorage, script on the page cannot read this one, so an XSS bug cannot
 * walk off with the session. The cost is CSRF, which cookies reintroduce and
 * CsrfGuard handles.
 *
 * `lax` lets the cookie ride along when someone follows a link into the site,
 * which is what keeps a bookmarked /posts working, while still withholding it
 * from cross-site form posts.
 */
export function sessionCookieOptions(isProduction: boolean) {
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: isProduction,
        path: '/',
    };
}

/** Name of the cookie holding a one-render message across a redirect. */
export const FLASH_COOKIE = 'flash';

/** Readable by script on purpose: the form has to echo it back. */
export const CSRF_COOKIE = 'csrf';

/**
 * Not httpOnly — the form has to read this one — but `secure` in production
 * all the same. Double-submit rests on the attacker controlling neither half
 * of the pair, and someone able to write this cookie over plaintext controls
 * both: they can set a value and then submit a form carrying it.
 */
export function csrfCookieOptions(isProduction: boolean) {
    return {
        sameSite: 'lax' as const,
        secure: isProduction,
        path: '/',
    };
}

/** Hidden field every state-changing form must carry. */
export const CSRF_FIELD = '_csrf';
