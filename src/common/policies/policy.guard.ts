import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.type';
import { OWNERSHIP_KEY, OwnershipRule } from './ownership';

@Injectable()
export class PolicyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const rule = this.reflector.getAllAndOverride<
            OwnershipRule | undefined
        >(OWNERSHIP_KEY, [context.getHandler(), context.getClass()]);

        // Routes without @Owns() are none of this guard's business. It is bound
        // per-route rather than globally, so this is only a safety net.
        if (rule === undefined) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        // Non-null because @Owns() binds this guard at the route, and Nest runs
        // the global AuthGuard before any route-scoped guard.
        const userId = request.user!.sub;

        const id = Number(request.params[rule.param]);

        // Keeps a garbage id out of the query rather than letting the driver
        // reject it as a 500.
        if (!Number.isInteger(id)) {
            throw new NotFoundException();
        }

        const [relation, key] = rule.path.split('.');

        const row = await this.dataSource.getRepository(rule.entity).findOne({
            where: { id },
            relations: key === undefined ? {} : { [relation]: true },
        });

        if (row === null) {
            throw new NotFoundException();
        }

        // Indexed through Record<string, unknown> rather than the entity's own
        // ObjectLiteral, whose index signature returns `any` and would let an
        // unchecked value reach the comparison below.
        const source = row as Record<string, unknown>;

        const ownerId =
            key === undefined
                ? source[relation]
                : (source[relation] as Record<string, unknown> | null)?.[key];

        if (ownerId !== userId) {
            throw new ForbiddenException();
        }

        return true;
    }
}
