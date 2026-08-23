import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
    MAX_LIMIT,
    PaginationDto,
} from '../dto/pagination.dto';
import { paginate, toSkipTake } from './paginated';

function parseQuery(query: Record<string, string>) {
    const dto = plainToInstance(PaginationDto, query, {
        enableImplicitConversion: false,
    });

    return { dto, errors: validateSync(dto) };
}

describe('PaginationDto', () => {
    it('defaults to the first page when the query is empty', () => {
        const { dto, errors } = parseQuery({});

        expect(errors).toHaveLength(0);
        expect(dto).toEqual({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT });
    });

    it('converts the numbers a query string delivers as text', () => {
        const { dto, errors } = parseQuery({ page: '3', limit: '50' });

        expect(errors).toHaveLength(0);
        expect(dto).toEqual({ page: 3, limit: 50 });
    });

    /**
     * The whole point of the DTO: without the ceiling a caller can ask for
     * every row in the table, which is the behaviour pagination replaced.
     */
    it('refuses a limit above the ceiling', () => {
        const { errors } = parseQuery({ limit: String(MAX_LIMIT + 1) });

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('limit');
    });

    it.each([
        ['a page below one', { page: '0' }],
        ['a negative limit', { limit: '-5' }],
        ['a fractional page', { page: '1.5' }],
        ['text where a number belongs', { limit: 'all' }],
    ])('rejects %s', (_label, query) => {
        expect(parseQuery(query).errors.length).toBeGreaterThan(0);
    });
});

describe('toSkipTake', () => {
    it('skips nothing on the first page', () => {
        expect(toSkipTake({ page: 1, limit: 20 })).toEqual({
            skip: 0,
            take: 20,
        });
    });

    it('skips whole pages, not rows', () => {
        expect(toSkipTake({ page: 4, limit: 25 })).toEqual({
            skip: 75,
            take: 25,
        });
    });
});

describe('paginate', () => {
    it('reports the page count a client needs to walk the whole set', () => {
        const { meta } = paginate([['a', 'b'], 50], { page: 1, limit: 20 });

        expect(meta).toEqual({ total: 50, page: 1, limit: 20, pages: 3 });
    });

    it('rounds a partial last page up rather than dropping it', () => {
        expect(paginate([[], 21], { page: 1, limit: 20 }).meta.pages).toBe(2);
    });

    it('reports no pages for an empty set', () => {
        expect(paginate([[], 0], { page: 1, limit: 20 }).meta.pages).toBe(0);
    });

    it('passes the rows through untouched', () => {
        const rows = [{ id: 1 }, { id: 2 }];

        expect(paginate([rows, 2], { page: 1, limit: 20 }).data).toBe(rows);
    });
});
