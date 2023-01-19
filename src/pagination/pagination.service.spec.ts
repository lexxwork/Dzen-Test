import { Test } from '@nestjs/testing';
import { ModelFindManyArgs, NextKey, Pagination } from './pagination.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import databaseConfig from 'config/database.config';
import { PostModule } from 'post/post.module';
import { Logger } from '@nestjs/common';
import { SeedModule } from 'seeds/seed.module';
import { SeedAllService } from 'seeds/seedAll.service';
import { Prisma } from '@prisma/client';
import { isEqual, orderBy as _orderBy } from 'lodash';

const paginatePosts = async (pagination: Pagination, options: { orderBy: any }) => {
  const { orderBy } = options;
  const findManyArgs: ModelFindManyArgs<Prisma.PostFindManyArgs> = {
    where: undefined,
    take: 5,
    // orderBy: { author: { userName: orderBy } },
    // orderBy: [{ author: { userName: orderBy } }, { author: { email: orderBy } }],
    orderBy,
    select: {
      id: true,
      // createdAt: true,
      author: {
        select: {
          userName: true,
          email: true,
        },
      },
    },
  };
  let cnt = 0;
  let items = null;
  let nextKey: NextKey = undefined;
  const pages = [];
  do {
    cnt++;
    const result = await pagination.findManyPaginate<Prisma.PostFindManyArgs>(
      'Post',
      findManyArgs,
      nextKey,
    );
    items = result.items;
    nextKey = result.nextKey;
    if (cnt < 3) {
      expect(items).toBeDefined();
      expect(nextKey).toBeDefined();
      expect(items).toHaveLength(5);
      pages.push(items);
    }
  } while (nextKey && cnt < 5);
  expect(cnt).toBe(3);
  expect(items).toBeNull();
  expect(nextKey).toBeNull();
  expect(pages).toHaveLength(2);
  return pages;
};

describe('paginationQuery tests', () => {
  let prisma: PrismaService;
  let pagination: Pagination;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [databaseConfig],
        }),
        PrismaModule,
        PostModule,
        SeedModule,
      ],
      providers: [Logger, Pagination, SeedAllService],
    }).compile();

    pagination = testingModule.get<Pagination>(Pagination);
    prisma = testingModule.get<PrismaService>(PrismaService);
    const seedAllService = testingModule.get<SeedAllService>(SeedAllService);

    // await prisma.cleanDb();
    // await seedAllService.run();
  });

  it('sorting should by id', async () => {
    await Promise.all(
      ['asc', 'desc'].map(async (sortType) => {
        const pages = await paginatePosts(pagination, {
          orderBy: [{ id: sortType }],
        });
        pages.forEach((page) => {
          const sorted = _orderBy(page, ['id'], [sortType]);
          expect(isEqual(page, sorted)).toBeTruthy();
        });
      }),
    );
  });
  it('sorting should sort by userName and email', async () => {
    await Promise.all(
      ['asc', 'desc'].map(async (sortType) => {
        const pages = await paginatePosts(pagination, {
          orderBy: [{ author: { userName: sortType } }, { author: { email: sortType } }],
        });
        pages.forEach((page) => {
          const sorted = _orderBy(
            page,
            ['author.userName', 'author.email'],
            [sortType, sortType],
          );
          expect(isEqual(page, sorted)).toBeTruthy();
        });
      }),
    );
  });
});
