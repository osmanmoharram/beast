import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
@ValidatorConstraint({ name: 'isUserEmailUnique', async: true })
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(User)
        private readonly postsRepository: Repository<User>,
    ) {}

    async validate(email: unknown): Promise<boolean> {
        if (typeof email !== 'string') {
            return false;
        }

        return !(await this.postsRepository.existsBy({ email }));
    }

    defaultMessage(args: ValidationArguments): string {
        return `User with ${args.property} ${String(args.value)} already exists`;
    }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: IsEmailUniqueConstraint,
        });
    };
}
