import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { UPLOADS_ROUTE, uploadsPath } from './config/uploads/options';

async function bootstrap() {
    // Typed as the Express application so useStaticAssets() is available,
    // which is what serves uploaded avatars back out.
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        cors: true,
    });
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
    });

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
