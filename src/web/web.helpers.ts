import { HttpException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Response } from 'express';
import { FLASH_COOKIE } from './session';

/**
 * Leaves a one-render message for the page a redirect is about to land on.
 * A cookie rather than a session store, because there is no session store —
 * ViewContextInterceptor reads it and clears it, so it shows exactly once.
 */
export function flash(response: Response, message: string): void {
    response.cookie(FLASH_COOKIE, message, { sameSite: 'lax', path: '/' });
}

/**
 * Pulls the human-readable lines out of whatever was thrown. Nest puts a
 * single string on some exceptions and an array of validation lines on
 * others; a form wants to list all of them.
 */
export function messagesOf(error: unknown): string[] {
    if (error instanceof HttpException) {
        const body = error.getResponse();

        if (typeof body === 'string') {
            return [body];
        }

        const { message } = body as { message?: string | string[] };

        if (Array.isArray(message)) {
            return message;
        }

        if (typeof message === 'string') {
            return [message];
        }

        return [error.message];
    }

    return ['Something went wrong. Please try again.'];
}

/**
 * Only ever returns a path on this site.
 *
 * `?next=` is attacker-controllable, and echoing it into a redirect unchecked
 * is an open redirect: a link to our own login page that lands the visitor on
 * someone else's, wearing our domain in the address bar as it asks for their
 * password. A value must start with a single slash to survive — which rules
 * out "https://evil.test" and the "//evil.test" that a naive check misses.
 */
export function safeNext(next?: string): string | undefined {
    if (typeof next !== 'string' || !next.startsWith('/')) {
        return undefined;
    }

    return next.startsWith('//') ? undefined : next;
}

export type FormResult<T> = { value: T; errors: string[] };

/**
 * Validates a submitted form by hand.
 *
 * The global ValidationPipe cannot do this job: it throws before the handler
 * runs, so the reply would be a JSON 400 rather than the form redisplayed
 * with what went wrong and what was typed. Taking the body as a plain object
 * — which the pipe skips — and validating here keeps the failure on the page
 * the visitor is looking at.
 *
 * Async because the interesting rules are: @IsEmailUnique and
 * @IsUsernameUnique query the database through the DI container that
 * useContainer() wired up in main.ts, and validateSync would silently skip
 * both, letting a duplicate through to fail later as a constraint violation.
 */
export async function validateForm<T extends object>(
    cls: ClassConstructor<T>,
    body: unknown,
): Promise<FormResult<T>> {
    const value = plainToInstance(cls, body ?? {}, {
        enableImplicitConversion: false,
    });

    const failures = await validate(value, {
        whitelist: true,
        forbidUnknownValues: false,
    });

    return {
        value,
        errors: failures.flatMap((failure) =>
            Object.values(failure.constraints ?? {}),
        ),
    };
}
