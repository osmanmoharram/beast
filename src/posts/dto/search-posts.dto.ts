import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * A narrow shape rather than TypeORM's FindOptionsWhere: exposing the latter
 * would let a caller filter on any column, and — because it is an erased type
 * — ValidationPipe would skip it, so unknown query params reached the query
 * builder and threw EntityPropertyNotFoundError. A real class restores
 * `whitelist: true`, which drops anything not declared here.
 */
export class SearchPostsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    q?: string;
}
