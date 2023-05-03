import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ModelFindManyArgs,
  CursorKeys,
} from 'pagination/interfaces/pagination.interface';
import { cursorKeyFn, PaginationService } from 'pagination/pagination.service';
import { PrismaService } from 'prisma/prisma.service';
import { GetCommentsDto } from './dto/get-comments.dto';
import { CommentItem, CommentsResponse } from './interfaces/comment.interface';
import { cloneDeep } from 'lodash';

@Injectable()
export class CommentService {
  constructor(public prisma: PrismaService, private pagination: PaginationService) {}

  async getCommentsCount() {
    const cnt = await this.prisma.comment.count();
    return cnt;
  }

  async getComments(
    query: GetCommentsDto = {
      limit: 25,
      orderType: 'desc',
      orderBy: undefined,
      cursor: undefined,
      reverse: false,
    },
  ): Promise<CommentsResponse> {
    const {
      cursor: cursorB64,
      limit: commentsLimit,
      orderBy: commentOrderBy,
      orderType: commentOrderType,
      reverse,
    } = query;

    const limit = commentsLimit <= 25 ? commentsLimit : 25;
    const take = limit > 10 ? 10 : limit;

    let cursorKeys: CursorKeys = { nextCursor: null, prevCursor: null };
    if (!!cursorB64) {
      try {
        cursorKeys = JSON.parse(
          Buffer.from(cursorB64, 'base64').toString('utf-8'),
        ) as CursorKeys;
      } catch (error) {}
    }

    const orderType = !commentOrderType ? 'desc' : 'asc';
    let orderBy = [];
    switch (commentOrderBy) {
      case 'userName':
        orderBy = [{ author: { userName: orderType } }];
        break;
      case 'email':
        orderBy = [{ author: { userName: orderType } }];
        break;
      case 'createdAt':
        orderBy = [{ createdAt: orderType }];
        break;
      default:
        orderBy = [{ id: orderType }];
        break;
    }

    const authorSelect = {
      select: {
        id: true,
        email: true,
        userName: true,
      },
    };

    const findManyArgs: ModelFindManyArgs<Prisma.CommentFindManyArgs> = {
      orderBy,
      include: {
        author: authorSelect,
        attachment: true,
        _count: { select: { replies: true } },
        replies: {
          where: { replyToId: null },
          include: {
            author: authorSelect,
            attachment: true,
            _count: { select: { replies: true } },
          },
          take: 5,
        },
      },
      take: reverse ? -take : take,
    };

    let allCnt = 0;
    const allComments: any[] = [];
    let cursorKeysNext: CursorKeys = cloneDeep(cursorKeys);
    do {
      const result = await this.pagination.findManyPaginate<Prisma.CommentFindManyArgs>(
        'Comment',
        findManyArgs,
        cursorKeysNext,
      );
      const items = result.items as CommentItem[];
      cursorKeysNext = result.cursorKeys;

      if (items && items.length > 0) {
        let commentIndex = 0;
        for (let i = 0; i < items.length && allCnt < limit; i++) {
          commentIndex = !reverse ? i : items.length - i - 1;
          allCnt++;
          if (allCnt > limit) {
            commentIndex += reverse ? 1 : -1;
            break;
          }
          const item = items[commentIndex];
          const overflow = limit - (allCnt + item.replies.length);
          const take = item.replies.length + (overflow >= 0 ? 0 : overflow);
          allCnt += take;
          if (take < item.replies.length) {
            item.replies = item.replies.slice(0, take);
            break;
          }
        }
        const toTake = !reverse
          ? items.slice(0, commentIndex + 1)
          : items.slice(commentIndex, items.length);

        !reverse ? allComments.push(...toTake) : allComments.unshift(...toTake);
      }
    } while (allCnt < limit && cursorKeysNext.prevCursor && cursorKeysNext.nextCursor);

    cursorKeysNext = cursorKeyFn(allComments, orderBy);

    const cursorNextB64 = Buffer.from(JSON.stringify(cursorKeysNext)).toString('base64');
    console.log(JSON.stringify({ allComments, cursorKeysNext }, null, 2));

    return {
      comments: allComments,
      cursor: cursorNextB64,
    };
  }
}
