import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreatePostDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 150)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @Length(3, 1000)
    body!: string;
}
