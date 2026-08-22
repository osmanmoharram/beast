import { UpdateCommentDto } from './dto/update-comment.dto';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsSelect, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { SuccessResponse } from '../common/types/success-response';

const COMMENT_SELECT: FindOptionsSelect<Comment> = {
    id: true,
    body: true,
    author: { id: true, username: true, email: true },
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepository: Repository<Comment>,
        @InjectRepository(Post)
        private readonly postsRepository: Repository<Post>,
    ) {}

    async findAllForPost(postId: Post['id']): Promise<Comment[]> {
        await this.assertPostExists(postId);

        return await this.commentsRepository.find({
            where: { post: { id: postId } },
            relations: { author: true },
            select: COMMENT_SELECT,
        });
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
