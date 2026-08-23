import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';
import {
    Get,
    HttpStatus,
    HttpCode,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    Controller,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Owns } from '../common/policies/owns.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { Comment } from './entities/comment.entity';
import { SuccessResponse } from '../common/types/success-response';

@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(@Param('postId', ParseIntPipe) postId: number): Promise<Comment[]> {
        return this.commentsService.findAllForPost(postId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Param('postId', ParseIntPipe) postId: number,
        @Body() createCommentDto: CreateCommentDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<Comment> {
        return this.commentsService.create(postId, createCommentDto, user.sub);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @Owns(Comment, 'author.id')
    update(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCommentDto: UpdateCommentDto,
    ): Promise<SuccessResponse> {
        return this.commentsService.update(postId, id, updateCommentDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Owns(Comment, 'author.id')
    remove(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SuccessResponse> {
        return this.commentsService.remove(postId, id);
    }
}
