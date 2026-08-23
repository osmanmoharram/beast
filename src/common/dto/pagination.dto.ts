import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

/**
 * The ceiling is the point of this class. Without one, `limit` is whatever a
 * caller types, and a list endpoint over a real table becomes a way to ask the
 * server to load, serialise and send the whole thing in one response.
 */
export const MAX_LIMIT = 100;

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = DEFAULT_PAGE;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(MAX_LIMIT)
    limit: number = DEFAULT_LIMIT;
}
