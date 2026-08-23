import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { SearchIndexService } from './search-index.service';
import { PolicyGuard } from '../common/policies/policy.guard';

@Module({
    imports: [TypeOrmModule.forFeature([Post])],
    controllers: [PostsController],
    providers: [PostsService, SearchIndexService, PolicyGuard],
})
export class PostsModule {}
