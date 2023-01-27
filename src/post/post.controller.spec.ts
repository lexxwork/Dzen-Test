import { Test } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { GetPostsDto } from './dto/get-posts.dto';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'config/database.config';
import { PostModule } from './post.module';
import { PrismaModule } from 'prisma/prisma.module';

jest.setTimeout(100000);

describe('PostsController', () => {
  let postController: PostController;
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
    postController = testingModule.get<PostController>(PostController);
  });

  describe('getPosts', () => {
    it('should return an array of posts', async () => {
      const query = new GetPostsDto();
      query.limit = 10;
      query.orderBy = 'createdAt';
      query.orderType = 'asc';
      query.cursor = undefined;
      // const { posts, cursor } = await postController.getPosts(query);
      // expect(posts).toBeDefined();
      // // expect(posts).toHaveLength(10);
      // console.log(JSON.stringify(posts));
      // expect(cursor).toBeDefined();
      const result = { posts: [], cursor: 'someBase64code' };
      jest.spyOn(postService, 'getPosts').mockImplementation(async () => await result);

      expect(await postController.getPosts(query)).toBe(result);
    });
  });
});
