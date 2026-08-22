import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 100)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @Length(3)
    body!: string;
}
