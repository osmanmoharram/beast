import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 500)
    body!: string;
}
