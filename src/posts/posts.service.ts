import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsSelect, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';

const POST_SELECT: FindOptionsSelect<Post> = {
    id: true,
    title: true,
    body: true,
    author: { id: true, username: true, email: true },
};

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepository: Repository<Post>,
    ) {}

    async findAll(): Promise<Post[]> {
        return await this.postsRepository.find({
            relations: { author: true },
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

    async update(id: Post['id'], updatePostDto: UpdatePostDto): Promise<Post> {
        const post = await this.findOneOrFail(id);

        Object.assign(post, updatePostDto);

        return await this.postsRepository.save(post);
    }

    async remove(id: Post['id']): Promise<void> {
        const { affected } = await this.postsRepository.delete({ id });

        if (!affected) {
            throw new NotFoundException(`Post ${id} not found`);
        }
    }

    private async findOne(id: Post['id']): Promise<Post | null> {
        return await this.postsRepository.findOne({
            where: { id },
            relations: { author: true },
            select: POST_SELECT,
        });
    }
}
