import {
    Body,
    Controller,
    Delete,
    Param,
    ParseIntPipe,
    Post,
    Res,
} from '@nestjs/common';
import { type Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { Owns } from '../common/policies/owns.decorator';
import { Comment } from '../comments/entities/comment.entity';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { DEFAULT_LIMIT } from '../common/dto/pagination.dto';
import { flash, messagesOf, validateForm } from './web.helpers';

/**
 * Comments have no pages of their own: they are written and removed from the
 * post they belong to, and every route here redirects straight back to it.
 */
@Controller('posts/:postId/comments')
export class WebCommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post()
    async create(
        @Param('postId', ParseIntPipe) postId: number,
        @Body() body: Record<string, unknown>,
        @CurrentUser() user: JwtPayload,
        @Res() response: Response,
    ): Promise<void> {
        const { value, errors } = await validateForm(CreateCommentDto, body);

        if (errors.length > 0) {
            flash(response, errors[0]);
        } else {
            try {
                await this.commentsService.create(postId, value, user.sub);
            } catch (error) {
                flash(response, messagesOf(error)[0]);
            }
        }

        // Back to the page the new comment landed on. The thread reads
        // oldest-first, so that is the last one — computed here because the
        // page parameter has to be a number the pagination DTO accepts.
        const total = await this.commentsService.countForPost(postId);
        const page = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));

        // `#comments` puts the browser at the thread rather than the top of
        // the post it has already read.
        response.redirect(`/posts/${postId}?page=${page}#comments`);
    }

    @Delete(':id')
    @Owns(Comment, 'author.id')
    async remove(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('id', ParseIntPipe) id: number,
        @Res() response: Response,
    ): Promise<void> {
        try {
            await this.commentsService.remove(postId, id);
            flash(response, 'Comment deleted.');
        } catch (error) {
            flash(response, messagesOf(error)[0]);
        }

        response.redirect(`/posts/${postId}#comments`);
    }
}
