import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

/**
 * Hits the posts table to confirm the decorated id refers to a real row.
 *
 * Marked @Injectable so Nest can hand class-validator an instance that already
 * has the repository wired up; that only works because main.ts calls
 * useContainer() to point class-validator at the Nest container.
 */
@Injectable()
@ValidatorConstraint({ name: 'isPostExists', async: true })
export class IsPostExistsConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepository: Repository<Post>,
    ) {}

    async validate(postId: unknown): Promise<boolean> {
        if (typeof postId !== 'number' || !Number.isInteger(postId)) {
            return false;
        }

        return await this.postsRepository.existsBy({ id: postId });
    }

    defaultMessage(args: ValidationArguments): string {
        return `Post with ${args.property} ${String(args.value)} does not exist`;
    }
}

export function IsPostExists(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: IsPostExistsConstraint,
        });
    };
}
