import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyGuard } from '../common/policies/policy.guard';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Post])],
    controllers: [CommentsController],
    providers: [CommentsService, PolicyGuard],
    exports: [CommentsService],
})
export class CommentsModule {}
