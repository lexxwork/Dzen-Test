import { Test } from '@nestjs/testing';
import { PostService } from './post.service';
import { GetPostsDto } from './dto/get-posts.dto';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'config/database.config';
import { PostModule } from './post.module';
import { PrismaModule } from 'prisma/prisma.module';

jest.setTimeout(100000);

const sharedVars: { [key: string]: any } = {};

describe('PostService', () => {
  let postService: PostService;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [databaseConfig],
        }),
        PostModule,
        PrismaModule,
      ],
    }).compile();

    postService = testingModule.get<PostService>(PostService);
  });

  describe('getPosts', () => {
    it('should return 5 posts with 1 comment each', async () => {
      const query = new GetPostsDto();
      query.limit = 10;
      query.orderBy = 'createdAt';
      query.orderType = 'desc';
      const { posts, cursor } = await postService.getPosts(query);
      expect(posts).toBeDefined();
      expect(cursor).toBeDefined();
      const count = posts.reduce((cnt, item) => {
        cnt += (item.comments ? item.comments.length : 0) + 1;
        return cnt;
      }, 0);
      sharedVars.cursorPrev = cursor;
      expect(count).toBe(query.limit);
    });
  });

  it('should return 5 posts with 1 comment each reversed', async () => {
    const query = new GetPostsDto();
    query.limit = 10;
    query.orderBy = 'createdAt';
    query.orderType = 'desc';
    // query.cursor = sharedVars.cursorPrev;
    query.reverse = true;
    const { posts, cursor } = await postService.getPosts(query);
    expect(posts).toBeDefined();
    expect(cursor).toBeDefined();
    const count = posts.reduce((cnt, item) => {
      cnt += (item.comments ? item.comments.length : 0) + 1;
      return cnt;
    }, 0);
    expect(count).toBe(query.limit);
  });
});
