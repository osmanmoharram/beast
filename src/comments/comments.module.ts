import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsPostExistsConstraint } from './validators/is-post-exists.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Comment]),
        TypeOrmModule.forFeature([Post]),
    ],
    controllers: [CommentsController],
    providers: [CommentsService, IsPostExistsConstraint],
})
export class CommentsModule {}
