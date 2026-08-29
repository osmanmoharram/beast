import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { WebAuthController } from './web-auth.controller';
import { WebPostsController } from './web-posts.controller';
import { WebCommentsController } from './web-comments.controller';
import { WebProfilesController } from './web-profiles.controller';
import { ViewContextInterceptor } from './interceptors/view-context.interceptor';
import { WebExceptionFilter } from './filters/web-exception.filter';

/**
 * The server-rendered half of the application. It owns no services and no
 * entities: every route here calls the same services the JSON API calls, and
 * differs only in answering with HTML and redirects instead of JSON. That is
 * the whole point of keeping the logic in services rather than controllers.
 */
@Module({
    imports: [AuthModule, PostsModule, CommentsModule, ProfilesModule],
    controllers: [
        WebAuthController,
        WebPostsController,
        WebCommentsController,
        WebProfilesController,
    ],
    providers: [
        // Registered globally rather than per-controller so the JSON API gets
        // the same treatment: both only touch requests that asked for HTML,
        // which is what separates a browser navigation from an API call.
        { provide: APP_INTERCEPTOR, useClass: ViewContextInterceptor },
        { provide: APP_FILTER, useClass: WebExceptionFilter },
    ],
})
export class WebModule {}
