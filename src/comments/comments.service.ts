import { UpdateCommentDto } from './dto/update-comment.dto';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrder, FindOptionsSelect, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { SuccessResponse } from '../common/types/success-response';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Paginated, paginate, toSkipTake } from '../common/types/paginated';

const COMMENT_SELECT: FindOptionsSelect<Comment> = {
    id: true,
    body: true,
    author: { id: true, username: true, email: true },
    createdAt: true,
    updatedAt: true,
};

// Oldest first: a comment thread reads in the order it was written, unlike a
// post feed. The id breaks ties so pages cannot overlap.
const COMMENT_ORDER: FindOptionsOrder<Comment> = {
    createdAt: 'ASC',
    id: 'ASC',
};

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepository: Repository<Comment>,
        @InjectRepository(Post)
        private readonly postsRepository: Repository<Post>,
    ) {}

    async findAllForPost(
        postId: Post['id'],
        paginationDto: PaginationDto,
    ): Promise<Paginated<Comment>> {
        await this.assertPostExists(postId);

        const where = { post: { id: postId } };

        const result = await Promise.all([
            this.commentsRepository.find({
                where,
                relations: { author: true },
                select: COMMENT_SELECT,
                order: COMMENT_ORDER,
                ...toSkipTake(paginationDto),
            }),
            this.commentsRepository.count({ where }),
        ]);

        return paginate(result, paginationDto);
    }

    async create(
        postId: Post['id'],
        createCommentDto: CreateCommentDto,
        authorId: User['id'],
    ): Promise<Comment> {
        await this.assertPostExists(postId);

        return await this.commentsRepository.save(
            this.commentsRepository.create({
                ...createCommentDto,
                post: { id: postId },
                author: { id: authorId },
            }),
        );
    }

    async update(
        postId: Post['id'],
        id: Comment['id'],
        updateCommentDto: UpdateCommentDto,
    ): Promise<SuccessResponse> {
        await this.assertCommentBelongsToPost(postId, id);

        await this.commentsRepository.update(id, updateCommentDto);

        return {
            code: HttpStatus.OK,
            message: `Comment updated successfully`,
        };
    }

    async remove(
        postId: Post['id'],
        id: Comment['id'],
    ): Promise<SuccessResponse> {
        await this.assertCommentBelongsToPost(postId, id);

        await this.commentsRepository.delete({ id });

        return {
            code: HttpStatus.OK,
            message: `Comment deleted successfully`,
        };
    }

    private async assertPostExists(postId: Post['id']): Promise<void> {
        if (!(await this.postsRepository.existsBy({ id: postId }))) {
            throw new NotFoundException(`Post ${postId} not found`);
        }
    }

    /**
     * Guards the pairing the nested URL claims. Done as its own query because
     * TypeORM cannot join a relation inside an UPDATE or DELETE, so the
     * post condition would be silently dropped from those statements.
     */
    private async assertCommentBelongsToPost(
        postId: Post['id'],
        id: Comment['id'],
    ): Promise<void> {
        const exists = await this.commentsRepository.existsBy({
            id,
            post: { id: postId },
        });

        if (!exists) {
            throw new NotFoundException(`Comment not found`);
        }
    }
}
