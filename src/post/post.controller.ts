import { Controller, Get, Query } from '@nestjs/common';
import { GetPostsDto } from './dto/get-posts.dto';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(@Query() query: GetPostsDto) {
    return await this.postService.getPosts(query);
  }
}
