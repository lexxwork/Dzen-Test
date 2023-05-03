import { Test } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { GetCommentsDto } from './dto/get-comments.dto';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'config/database.config';
import { CommentModule } from './comment.module';
import { PrismaModule } from 'prisma/prisma.module';

jest.setTimeout(100000);

const sharedVars: { [key: string]: any } = {};

describe('CommentService', () => {
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
  });

  describe('getComments', () => {
    it('should return 5 comments with 1 comment each', async () => {
      const query = new GetCommentsDto();
      query.limit = 10;
      query.orderBy = 'createdAt';
      query.orderType = 'desc';
      const { comments, cursor } = await commentService.getComments(query);
      expect(comments).toBeDefined();
      expect(cursor).toBeDefined();
      const count = comments.reduce((cnt, item) => {
        cnt += (item.replies ? item.replies.length : 0) + 1;
        return cnt;
      }, 0);
      sharedVars.cursorPrev = cursor;
      expect(count).toBe(query.limit);
    });
  });

  it('should return 5 comments with 1 comment each reversed', async () => {
    const query = new GetCommentsDto();
    query.limit = 10;
    query.orderBy = 'createdAt';
    query.orderType = 'desc';
    // query.cursor = sharedVars.cursorPrev;
    query.reverse = true;
    const { comments, cursor } = await commentService.getComments(query);
    expect(comments).toBeDefined();
    expect(cursor).toBeDefined();
    const count = comments.reduce((cnt, item) => {
      cnt += (item.replies ? item.replies.length : 0) + 1;
      return cnt;
    }, 0);
    expect(count).toBe(query.limit);
  });
});
