import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(public prisma: PrismaService) {}

  async getPostsCount() {
    const cnt = await this.prisma.post.count();
    return cnt;
  }
}
