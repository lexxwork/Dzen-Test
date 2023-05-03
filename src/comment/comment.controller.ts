import { Controller, Get, Query } from '@nestjs/common';
import { GetCommentsDto } from './dto/get-comments.dto';
import { CommentService } from './comment.service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getComments(@Query() query: GetCommentsDto) {
    return await this.commentService.getComments(query);
  }
}
