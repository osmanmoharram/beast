import { EntityTarget, ObjectLiteral } from 'typeorm';

export const OWNERSHIP_KEY = 'ownership';

/**
 * Describes how to prove the caller owns the resource a route addresses.
 *
 * `path` is read against the loaded row: 'author.id' loads the `author`
 * relation and compares its id, while a single segment like 'id' compares the
 * column directly, for the case where the row is its own owner.
 *
 * Kept in its own file so the guard and the decorator can each import it
 * without importing each other.
 */
export type OwnershipRule = {
    entity: EntityTarget<ObjectLiteral>;
    path: string;
    param: string;
};
