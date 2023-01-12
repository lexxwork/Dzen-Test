import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PaginationQuery } from './paginationQuery.service';
import { Logger } from '@nestjs/common';

@Module({
  controllers: [PostController],
  providers: [PostService, PaginationQuery, Logger],
})
export class PostModule {}
