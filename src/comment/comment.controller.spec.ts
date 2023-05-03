import { Test } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { GetCommentsDto } from './dto/get-comments.dto';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'config/database.config';
import { CommentModule } from './comment.module';
import { PrismaModule } from 'prisma/prisma.module';

jest.setTimeout(100000);

describe('CommentsController', () => {
  let commentController: CommentController;
  let commentService: CommentService;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [databaseConfig],
        }),
        CommentModule,
        PrismaModule,
      ],
    }).compile();

    commentService = testingModule.get<CommentService>(CommentService);
    commentController = testingModule.get<CommentController>(CommentController);
  });

  describe('getComments', () => {
    it('should return an array of comments', async () => {
      const query = new GetCommentsDto();
      query.limit = 10;
      query.orderBy = 'createdAt';
      query.orderType = 'asc';
      query.cursor = undefined;
      // const { comments, cursor } = await commentController.getComments(query);
      // expect(comments).toBeDefined();
      // // expect(comments).toHaveLength(10);
      // console.log(JSON.stringify(comments));
      // expect(cursor).toBeDefined();
      const result = { comments: [], cursor: 'someBase64code' };
      jest
        .spyOn(commentService, 'getComments')
        .mockImplementation(async () => await result);

      expect(await commentController.getComments(query)).toBe(result);
    });
  });
});
