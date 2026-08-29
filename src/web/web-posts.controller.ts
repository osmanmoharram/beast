import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Redirect,
    Render,
    Res,
} from '@nestjs/common';
import { type Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { Owns } from '../common/policies/owns.decorator';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { SearchPostsDto } from '../posts/dto/search-posts.dto';
import { Post as PostEntity } from '../posts/entities/post.entity';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { flash, messagesOf, validateForm } from './web.helpers';
import { pagerOf } from './pager';

@Controller()
export class WebPostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly commentsService: CommentsService,
    ) {}

    /**
     * Public so the front door always points somewhere: an unauthenticated
     * visitor is bounced on to /posts, which sends them to the login form.
     * Guarding it would answer the bare domain with a 401 instead.
     */
    @Public()
    @Get()
    @Redirect('/posts')
    index(): void {}

    @Get('posts')
    @Render('posts/index')
    async list(@Query() searchPostsDto: SearchPostsDto) {
        const { data, meta } = await this.postsService.findAll(searchPostsDto);

        return {
            title: searchPostsDto.q ? `Search: ${searchPostsDto.q}` : 'Posts',
            posts: data,
            q: searchPostsDto.q ?? '',
            pager: pagerOf(meta, '/posts', { q: searchPostsDto.q }),
        };
    }

    // Above ':id' so the literal path is not swallowed by the parameter.
    @Get('posts/new')
    @Render('posts/form')
    newForm() {
        return { title: 'Write a post', action: '/posts', submit: 'Publish' };
    }

    @Post('posts')
    async create(
        @Body() body: Record<string, unknown>,
        @CurrentUser() user: JwtPayload,
        @Res() response: Response,
    ): Promise<void> {
        const { value, errors } = await validateForm(CreatePostDto, body);

        if (errors.length > 0) {
            response.status(400).render('posts/form', {
                title: 'Write a post',
                action: '/posts',
                submit: 'Publish',
                errors,
                post: value,
            });

            return;
        }

        const post = await this.postsService.create(value, user.sub);

        flash(response, 'Post published.');
        response.redirect(`/posts/${post.id}`);
    }

    @Get('posts/:id')
    @Render('posts/show')
    async show(
        @Param('id', ParseIntPipe) id: number,
        @Query() paginationDto: PaginationDto,
        @CurrentUser() user: JwtPayload,
    ) {
        const post = await this.postsService.findOneOrFail(id);
        const { data, meta } = await this.commentsService.findAllForPost(
            id,
            paginationDto,
        );

        return {
            title: post.title,
            post,
            // Templates cannot compare values, so ownership is decided here
            // and handed over as a flag the template only has to branch on.
            owned: post.author.id === user.sub,
            comments: data.map((comment) => ({
                ...comment,
                owned: comment.author.id === user.sub,
            })),
            commentCount: meta.total,
            pager: pagerOf(meta, `/posts/${id}`),
        };
    }

    @Get('posts/:id/edit')
    @Owns(PostEntity, 'author.id')
    @Render('posts/form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const post = await this.postsService.findOneOrFail(id);

        return {
            title: 'Edit post',
            action: `/posts/${post.id}?_method=PATCH`,
            submit: 'Save changes',
            post,
        };
    }

    /**
     * Reached as a POST carrying ?_method=PATCH, which method-override
     * rewrites: a browser form can only send GET or POST, and the route it
     * is updating is a PATCH everywhere else in this codebase.
     */
    @Patch('posts/:id')
    @Owns(PostEntity, 'author.id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: Record<string, unknown>,
        @Res() response: Response,
    ): Promise<void> {
        const { value, errors } = await validateForm(CreatePostDto, body);

        if (errors.length > 0) {
            response.status(400).render('posts/form', {
                title: 'Edit post',
                action: `/posts/${id}?_method=PATCH`,
                submit: 'Save changes',
                errors,
                post: { ...value, id },
            });

            return;
        }

        await this.postsService.update(id, value);

        flash(response, 'Post updated.');
        response.redirect(`/posts/${id}`);
    }

    @Delete('posts/:id')
    @Owns(PostEntity, 'author.id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Res() response: Response,
    ): Promise<void> {
        try {
            await this.postsService.remove(id);
            flash(response, 'Post deleted.');
        } catch (error) {
            flash(response, messagesOf(error)[0]);
        }

        response.redirect('/posts');
    }
}
