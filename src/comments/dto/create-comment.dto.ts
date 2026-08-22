import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsPostExists } from '../validators/is-post-exists.validator';
import { Post } from '../../posts/entities/post.entity';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 500)
    body!: string;

    @IsNotEmpty()
    @IsPostExists()
    postId!: Post['id'];
}
