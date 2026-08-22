import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type JwtPayload } from '../auth/types/jwt.type';
import { SuccessResponse } from '../common/types/success-response';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { PostsService } from './posts.service';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<PostEntity[]> {
        return this.postsService.findAll();
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body() createPostDto: CreatePostDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<PostEntity> {
        return this.postsService.create(createPostDto, user.sub);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
        return this.postsService.findOneOrFail(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePostDto: UpdatePostDto,
    ): Promise<SuccessResponse> {
        return this.postsService.update(id, updatePostDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    remove(@Param('id', ParseIntPipe) id: number): Promise<SuccessResponse> {
        return this.postsService.remove(id);
    }
}
