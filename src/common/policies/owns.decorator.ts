import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { OWNERSHIP_KEY } from './ownership';
import { PolicyGuard } from './policy.guard';

/**
 * Declares that the caller must own the resource the route addresses.
 *
 *     @Owns(Post, 'author.id')   // row.author.id === user.sub
 *     @Owns(User, 'id')          // row.id === user.sub
 *
 * UseGuards is bundled in rather than left to the caller because Nest runs
 * globally registered guards before route-scoped ones. Binding PolicyGuard
 * here guarantees AuthGuard has already populated request.user; registering it
 * as a second APP_GUARD would make that depend on module import order instead.
 */
export function Owns(
    entity: EntityTarget<ObjectLiteral>,
    path: string,
    param = 'id',
) {
    return applyDecorators(
        SetMetadata(OWNERSHIP_KEY, { entity, path, param }),
        UseGuards(PolicyGuard),
    );
}
