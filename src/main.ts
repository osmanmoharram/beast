import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import { join } from 'node:path';
import hbs from 'hbs';
import { AppModule } from './app.module';
import { UPLOADS_ROUTE, uploadsPath } from './config/uploads/options';

/**
 * A year, the longest any cache is meant to honour.
 */
const AVATAR_MAX_AGE = '365d';

async function bootstrap() {
    // Typed as the Express application so useStaticAssets() is available,
    // which is what serves uploaded avatars back out.
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        cors: true,
    });
    // JSON of the kind these endpoints return is highly repetitive — the same
    // keys on every row — so gzip takes roughly a tenth of the bytes off the
    // wire. Registered first so it wraps every later handler, static files
    // included.
    app.use(compression());
    // Both of these have to run before the router: the guards read cookies to
    // find the session, and the route a form reaches depends on the override
    // having already rewritten POST into PATCH or DELETE.
    app.use(cookieParser());
    app.use(methodOverride('_method'));
    // Lets class-validator resolve constraint classes through Nest's DI, which
    // is what allows IsEmailUniqueConstraint to inject the User repository.
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
    );
    // Applies @Exclude() on entity properties to every response, which is what
    // keeps User.password out of the JSON returned by /users, /posts and the
    // nested user in AuthResponseDto.
    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    // Uploads are plain files with generated names and no secrets in them, so
    // they are served straight off disk rather than through a controller that
    // would only re-read them into Node to hand back unchanged.
    app.useStaticAssets(uploadsPath(app.get(ConfigService)), {
        prefix: UPLOADS_ROUTE,
        // Stored names are generated per upload and never rewritten, so a
        // given URL always answers with the same bytes. That is what
        // `immutable` promises, and it lets a browser stop revalidating an
        // avatar it already has.
        maxAge: AVATAR_MAX_AGE,
        immutable: true,
    });

    // Templates and their partials live outside src/ because they are not
    // compiled; __dirname is dist/ at runtime, so both climb out of it.
    const root = join(__dirname, '..');
    app.setBaseViewsDir(join(root, 'views'));
    app.setViewEngine('hbs');
    hbs.registerPartials(join(root, 'views', 'partials'));
    registerHelpers();

    // Stylesheet for the rendered pages, separate from the uploads mount so
    // user files and application assets never share a directory.
    app.useStaticAssets(join(root, 'public'), { prefix: '/public' });

    await app.listen(process.env.PORT ?? 3000);
}
/**
 * Handlebars is deliberately logic-less, so anything a template cannot decide
 * for itself is decided here. Kept small: a helper is a sign the controller
 * should probably have prepared the value instead.
 */
function registerHelpers(): void {
    hbs.registerHelper('date', (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : '',
    );

    hbs.registerHelper('datetime', (value: unknown) =>
        value ? new Date(value as string).toLocaleString() : '',
    );

    hbs.registerHelper('excerpt', (value: unknown, length: unknown) => {
        const text = typeof value === 'string' ? value : '';
        const limit = typeof length === 'number' ? length : 180;

        return text.length > limit
            ? `${text.slice(0, limit).trimEnd()}…`
            : text;
    });
}

void bootstrap();
