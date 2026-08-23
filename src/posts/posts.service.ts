import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import {
    FindOptionsSelect,
    FindOptionsWhere,
    ILike,
    Repository,
} from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { SearchPostsDto } from './dto/search-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';
import { SuccessResponse } from '../common/types/success-response';

const POST_SELECT: FindOptionsSelect<Post> = {
    id: true,
    title: true,
    body: true,
    author: { id: true, username: true, email: true },
    comments: { id: true, body: true },
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepository: Repository<Post>,
    ) {}

    async findAll({ q }: SearchPostsDto = {}): Promise<Post[]> {
        return await this.postsRepository.find({
            where: this.searchCriteria(q),
            relations: {
                author: true,
                comments: true,
            },
            select: POST_SELECT,
        });
    }

    async create(
        createPostDto: CreatePostDto,
        authorId: User['id'],
    ): Promise<Post> {
        return await this.postsRepository.save(
            this.postsRepository.create({
                ...createPostDto,
                author: { id: authorId },
            }),
        );
    }

    async findOneOrFail(id: Post['id']): Promise<Post> {
        const post = await this.findOne(id);

        if (post === null) {
            throw new NotFoundException(`Post ${id} not found`);
        }

        return post;
    }

    async update(
        id: Post['id'],
        updatePostDto: UpdatePostDto,
    ): Promise<SuccessResponse> {
        const { affected } = await this.postsRepository.update(
            id,
            updatePostDto,
        );

        if (!affected) {
            throw new NotFoundException(`Post not found`);
        }

        return {
            code: HttpStatus.OK,
            message: `Post updated successfully`,
        };
    }

    async remove(id: Post['id']): Promise<SuccessResponse> {
        const { affected } = await this.postsRepository.delete({ id });

        if (!affected) {
            throw new NotFoundException(`Post not found`);
        }

        return {
            code: HttpStatus.OK,
            message: `Post deleted successfully`,
        };
    }

    /**
     * An array of conditions is an OR, so a term matches a post by its title
     * or its body. Undefined when no term was given, which leaves find()
     * unfiltered rather than searching for an empty string.
     */
    private searchCriteria(q?: string): FindOptionsWhere<Post>[] | undefined {
        if (q === undefined) {
            return undefined;
        }

        // % and _ are LIKE wildcards, so they are escaped rather than passed
        // through: searching for "100%" should not match every row.
        const term = `%${q.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;

        return [{ title: ILike(term) }, { body: ILike(term) }];
    }

    private async findOne(id: Post['id']): Promise<Post | null> {
        return await this.postsRepository.findOne({
            where: { id },
            relations: { author: true },
            select: POST_SELECT,
        });
    }
}
