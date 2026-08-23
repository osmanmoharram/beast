import { PaginationDto } from '../dto/pagination.dto';

export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export type Paginated<T> = {
    data: T[];
    meta: PaginationMeta;
};

/**
 * Turns a page of rows and a total into what a list endpoint answers with.
 * Kept in one place so `pages` is rounded the same way everywhere and a client
 * can page through /posts, /profiles and /comments with identical code.
 *
 * The two halves are fetched separately rather than with findAndCount, which
 * counts by wrapping every selected column of the joined row in
 * COUNT(DISTINCT(...)) — asking Postgres to de-duplicate 50k post bodies to
 * learn a number the primary key already answers. A plain count() is the same
 * total for a fraction of the work; see the call sites.
 */
export function paginate<T>(
    [data, total]: [T[], number],
    { page, limit }: PaginationDto,
): Paginated<T> {
    return {
        data,
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
}

/**
 * `skip`/`take` rather than page/limit, which is what the repository wants.
 */
export function toSkipTake({ page, limit }: PaginationDto): {
    skip: number;
    take: number;
} {
    return { skip: (page - 1) * limit, take: limit };
}
