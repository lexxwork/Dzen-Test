import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ModelFindManyArgs,
  CursorKeys,
} from 'pagination/interfaces/pagination.interface';
import { cursorKeyFn, PaginationService } from 'pagination/pagination.service';
import { PrismaService } from 'prisma/prisma.service';
import { GetPostsDto } from './dto/get-posts.dto';
import { PostItem, PostsResponse } from './interfaces/post.interface';
import { cloneDeep } from 'lodash';

@Injectable()
export class PostService {
  constructor(public prisma: PrismaService, private pagination: PaginationService) {}

  async getPostsCount() {
    const cnt = await this.prisma.post.count();
    return cnt;
  }

  async getPosts(
    query: GetPostsDto = {
      limit: 25,
      orderType: 'desc',
      orderBy: undefined,
      cursor: undefined,
      reverse: false,
    },
  ): Promise<PostsResponse> {
    const {
      cursor: cursorB64,
      limit: postsLimit,
      orderBy: postOrderBy,
      orderType: postOrderType,
      reverse,
    } = query;

    const limit = postsLimit <= 25 ? postsLimit : 25;
    const take = limit > 10 ? 10 : limit;

    let cursorKeys: CursorKeys = { nextCursor: null, prevCursor: null };
    if (!!cursorB64) {
      try {
        cursorKeys = JSON.parse(
          Buffer.from(cursorB64, 'base64').toString('utf-8'),
        ) as CursorKeys;
      } catch (error) {}
    }

    const orderType = !postOrderType ? 'desc' : 'asc';
    let orderBy = [];
    switch (postOrderBy) {
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

    const findManyArgs: ModelFindManyArgs<Prisma.PostFindManyArgs> = {
      orderBy,
      include: {
        author: authorSelect,
        attachment: true,
        _count: { select: { comments: true } },
        comments: {
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
    const allPosts: any[] = [];
    let cursorKeysNext: CursorKeys = cloneDeep(cursorKeys);
    do {
      const result = await this.pagination.findManyPaginate<Prisma.PostFindManyArgs>(
        'Post',
        findManyArgs,
        cursorKeysNext,
      );
      const items = result.items as PostItem[];
      cursorKeysNext = result.cursorKeys;

      if (items && items.length > 0) {
        let postIndex = 0;
        for (let i = 0; i < items.length && allCnt < limit; i++) {
          postIndex = !reverse ? i : items.length - i - 1;
          allCnt++;
          if (allCnt > limit) {
            postIndex += reverse ? 1 : -1;
            break;
          }
          const item = items[postIndex];
          const overflow = limit - (allCnt + item.comments.length);
          const ctake = item.comments.length + (overflow >= 0 ? 0 : overflow);
          allCnt += ctake;
          if (ctake < item.comments.length) {
            item.comments = item.comments.slice(0, ctake);
            break;
          }
        }
        const toTake = !reverse
          ? items.slice(0, postIndex + 1)
          : items.slice(postIndex, items.length);

        !reverse ? allPosts.push(...toTake) : allPosts.unshift(...toTake);
      }
    } while (allCnt < limit && cursorKeysNext.prevCursor && cursorKeysNext.nextCursor);

    cursorKeysNext = cursorKeyFn(allPosts, orderBy);

    const cursorNextB64 = Buffer.from(JSON.stringify(cursorKeysNext)).toString('base64');
    console.log(JSON.stringify({ allPosts, cursorKeysNext }, null, 2));

    return {
      posts: allPosts,
      cursor: cursorNextB64,
    };
  }
}
