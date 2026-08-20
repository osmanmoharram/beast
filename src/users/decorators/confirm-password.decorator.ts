import {
    BadRequestException,
    createParamDecorator,
    ExecutionContext,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';

export const confirmPasswordFactory = (
    data: unknown,
    ctx: ExecutionContext,
): CreateUserDto => {
    const { body } = ctx.switchToHttp().getRequest<{ body: CreateUserDto }>();
    if (body?.password !== body?.confirm) {
        throw new BadRequestException('confirm must match password');
    }
    return body;
};

export const ConfirmPassword = createParamDecorator(confirmPasswordFactory);
