import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { messagesOf, safeNext, wantsHtml } from '../web.helpers';

/**
 * One filter rather than several, because Nest resolves overlapping global
 * filters by registration order and that is a fragile thing to depend on. The
 * branching is explicit here instead.
 *
 * Whether a caller gets HTML or JSON is decided by what it asked for, not by
 * the route: a browser navigating sends `Accept: text/html`, while fetch() defaults
 * to a wildcard Accept. So the JSON API keeps answering in JSON even though it
 * now shares an application with a set of rendered pages.
 */
@Catch()
export class WebExceptionFilter implements ExceptionFilter {
    /**
     * A global @Catch() replaces Nest's own ExceptionsHandler, which is what
     * would otherwise log an unhandled exception. Without this, a dropped
     * database connection reaches the visitor as a polite apology and leaves
     * nothing at all in the server output.
     */
    private readonly logger = new Logger(WebExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const http = host.switchToHttp();
        const request = http.getRequest<Request>();
        const response = http.getResponse<Response>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        if (status >= SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.originalUrl} failed`,
                exception instanceof Error ? exception.stack : exception,
            );
        }

        // A handler that already started writing — a controller rendering its
        // own form back with errors — must not have a second response layered
        // on top of it, whichever shape that second one would take.
        if (response.headersSent) {
            return;
        }

        if (!wantsHtml(request)) {
            response.status(status).json(
                exception instanceof HttpException
                    ? exception.getResponse()
                    : {
                          statusCode: status,
                          message: 'Internal server error',
                      },
            );

            return;
        }

        if (exception instanceof UnauthorizedException) {
            // Remembering where they were aiming, so signing in continues the
            // journey instead of dumping everyone on the same page. Only for
            // GET: sending a form post back to itself after login would
            // resubmit nothing useful.
            const next =
                request.method === 'GET'
                    ? safeNext(request.originalUrl)
                    : undefined;

            response.redirect(
                next ? `/login?next=${encodeURIComponent(next)}` : '/login',
            );

            return;
        }

        if (exception instanceof ForbiddenException) {
            response.redirect('/posts');

            return;
        }

        response.status(status).render('error', {
            title: titleFor(status),
            status,
            heading: titleFor(status),
            // Below 500 the message describes what the caller did wrong and is
            // safe to show; at 500 and above it may describe our internals.
            detail:
                status < SERVER_ERROR
                    ? messagesOf(exception).join(' ')
                    : 'Something went wrong on our end.',
        });
    }
}

/** Numeric so the comparisons below are number-to-number, not enum-to-number. */
const SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

const TITLES: Record<number, string> = {
    [HttpStatus.NOT_FOUND]: 'Page not found',
    [HttpStatus.BAD_REQUEST]: 'That request did not make sense',
    [HttpStatus.FORBIDDEN]: 'You cannot do that',
};

function titleFor(status: number): string {
    return TITLES[status] ?? 'Something went wrong';
}
