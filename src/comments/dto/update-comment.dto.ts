import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/**
 * Deliberately not a PartialType(CreateCommentDto): the post a comment belongs
 * to comes from the URL and must never be reassignable through the body.
 */
export class UpdateCommentDto {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Length(3, 500)
    body?: string;
}
