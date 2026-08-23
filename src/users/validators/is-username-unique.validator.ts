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
@ValidatorConstraint({ name: 'isUsernameUnique', async: true })
export class IsUsernameUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async validate(username: unknown): Promise<boolean> {
        if (typeof username !== 'string') {
            return false;
        }

        return !(await this.usersRepository.existsBy({ username }));
    }

    defaultMessage(args: ValidationArguments): string {
        return `User with ${args.property} ${String(args.value)} already exists`;
    }
}

export function IsUsernameUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: IsUsernameUniqueConstraint,
        });
    };
}
