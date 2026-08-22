import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });
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

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
