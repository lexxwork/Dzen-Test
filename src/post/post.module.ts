import { Module } from '@nestjs/common';
import { PaginationModule } from 'pagination/pagination.module';
import { PaginationService } from 'pagination/pagination.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
@Module({
  imports: [PaginationModule],
  controllers: [PostController],
  providers: [PostService, PaginationService],
})
export class PostModule {}
