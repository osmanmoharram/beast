import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';
import {
    Controller,
    Get,
    HttpStatus,
    HttpCode,
    Post,
    Patch,
    Delete,
    Body,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { Comment } from './entities/comment.entity';
import { SuccessResponse } from '../common/types/success-response';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.commentsService.findAll();
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body() createCommentDto: CreateCommentDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<Comment> {
        return this.commentsService.create(createCommentDto, user.sub);
    }

    @Patch()
    @HttpCode(HttpStatus.OK)
    update(
        id: Comment['id'],
        @Body() updateCommentDto: UpdateCommentDto,
    ): Promise<SuccessResponse> {
        return this.commentsService.update(id, updateCommentDto);
    }

    @Delete()
    @HttpCode(HttpStatus.OK)
    remove(id: Comment['id']): Promise<SuccessResponse> {
        return this.commentsService.remove(id);
    }
}
