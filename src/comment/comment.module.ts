import { Module } from '@nestjs/common';
import { PaginationModule } from 'pagination/pagination.module';
import { PaginationService } from 'pagination/pagination.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
@Module({
  imports: [PaginationModule],
  controllers: [CommentController],
  providers: [CommentService, PaginationService],
})
export class CommentModule {}
