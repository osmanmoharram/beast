import { UpdateCommentDto } from './dto/update-comment.dto';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
import { SuccessResponse } from '../common/types/success-response';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepository: Repository<Comment>,
    ) {}

    async findAll(): Promise<Comment[]> {
        return await this.commentsRepository.find();
    }

    async create(
        createCommentDto: CreateCommentDto,
        authorId: User['id'],
    ): Promise<Comment> {
        return await this.commentsRepository.save(
            this.commentsRepository.create({
                ...createCommentDto,
                author: { id: authorId },
            }),
        );
    }

    async update(
        id: Comment['id'],
        updateCommentDto: UpdateCommentDto,
    ): Promise<SuccessResponse> {
        const { affected } = await this.commentsRepository.update(
            id,
            updateCommentDto,
        );

        if (!affected) {
            throw new NotFoundException(`Comment not found`);
        }

        return {
            code: HttpStatus.OK,
            message: `Comment updated successfully`,
        };
    }

    async remove(id: Comment['id']): Promise<SuccessResponse> {
        const { affected } = await this.commentsRepository.delete({ id });

        if (!affected) {
            throw new NotFoundException(`Comment not found`);
        }

        return {
            code: HttpStatus.OK,
            message: `Comment deleted successfully`,
        };
    }
}
