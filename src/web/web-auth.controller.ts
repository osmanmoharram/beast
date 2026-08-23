import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Render,
    Res,
} from '@nestjs/common';
import { type Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EnvType } from '../config/app/schema';
import { LoginFormDto } from './dto/login-form.dto';
import { SESSION_COOKIE, sessionCookieOptions } from './session';
import { flash, messagesOf, safeNext, validateForm } from './web.helpers';

@Controller()
export class WebAuthController {
    private readonly isProduction: boolean;

    constructor(
        private readonly authService: AuthService,
        config: ConfigService,
    ) {
        this.isProduction =
            config.getOrThrow<string>('NODE_ENV') ===
            String(EnvType.production);
    }

    @Public()
    @Get('login')
    @Render('auth/login')
    loginForm(@Query('next') next?: string) {
        return { title: 'Sign in', next: safeNext(next) };
    }

    /**
     * Renders the form again on failure rather than redirecting, so the email
     * survives a mistyped password.
     */
    @Public()
    @Post('login')
    async login(
        @Body() body: Record<string, unknown>,
        @Res() response: Response,
    ): Promise<void> {
        const next = safeNext(body.next as string | undefined);
        const { value, errors } = await validateForm(LoginFormDto, body);

        const fail = (messages: string[]) =>
            response.status(401).render('auth/login', {
                title: 'Sign in',
                errors: messages,
                email: value.email,
                next,
            });

        if (errors.length > 0) {
            fail(errors);

            return;
        }

        try {
            const { accessToken } = await this.authService.login({
                email: value.email,
                password: value.password,
            });

            this.startSession(response, accessToken);
            response.redirect(next ?? '/posts');
        } catch (error) {
            fail(messagesOf(error));
        }
    }

    @Public()
    @Get('register')
    @Render('auth/register')
    registerForm() {
        return { title: 'Create account' };
    }

    @Public()
    @Post('register')
    async register(
        @Body() body: Record<string, unknown>,
        @Res() response: Response,
    ): Promise<void> {
        const { value, errors } = await validateForm(CreateUserDto, body);

        const fail = (messages: string[]) =>
            response.status(400).render('auth/register', {
                title: 'Create account',
                errors: messages,
                form: value,
            });

        if (errors.length > 0) {
            fail(errors);

            return;
        }

        try {
            const { accessToken } = await this.authService.register(value);

            this.startSession(response, accessToken);
            flash(response, 'Welcome to beast.');
            response.redirect('/posts');
        } catch (error) {
            fail(messagesOf(error));
        }
    }

    /**
     * A POST, not a link. Signing out changes state, and as a GET any page
     * could do it to a visitor with an <img src="/logout">.
     */
    @Post('logout')
    logout(@Res() response: Response): void {
        response.clearCookie(SESSION_COOKIE, { path: '/' });
        flash(response, 'Signed out.');
        response.redirect('/login');
    }

    private startSession(response: Response, token: string): void {
        response.cookie(
            SESSION_COOKIE,
            token,
            sessionCookieOptions(this.isProduction),
        );
    }
}
