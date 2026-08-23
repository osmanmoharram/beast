import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import {
    FindOptionsOrder,
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
import { Paginated, paginate, toSkipTake } from '../common/types/paginated';

const POST_SELECT: FindOptionsSelect<Post> = {
    id: true,
    title: true,
    body: true,
    author: { id: true, username: true, email: true },
    createdAt: true,
    updatedAt: true,
};

/**
 * Newest first, with the id as a tiebreaker. Ordering is not cosmetic once
 * there are pages: rows come back in whatever order the plan happens to
 * produce, so without a total order two pages can repeat a post and skip
 * another. The (createdAt, id) index exists to make this free.
 */
const POST_ORDER: FindOptionsOrder<Post> = { createdAt: 'DESC', id: 'DESC' };

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepository: Repository<Post>,
    ) {}

    /**
     * The comments relation is deliberately absent. Joining it fanned every
     * post out into one row per comment and shipped the whole thread of every
     * post in the list — megabytes to render a page of titles. Nothing read
     * them: the detail route does not return comments either, and a client
     * that wants them asks /posts/:id/comments, which pages them properly.
     */
    async findAll(searchPostsDto: SearchPostsDto): Promise<Paginated<Post>> {
        const where = this.searchCriteria(searchPostsDto.q);

        // Counting without the join, and in parallel with the page: the total
        // is a property of the rows that match, and the author each one
        // belongs to has no bearing on it.
        const result = await Promise.all([
            this.postsRepository.find({
                where,
                relations: { author: true },
                select: POST_SELECT,
                order: POST_ORDER,
                ...toSkipTake(searchPostsDto),
            }),
            this.postsRepository.count({ where }),
        ]);

        return paginate(result, searchPostsDto);
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
