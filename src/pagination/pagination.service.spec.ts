import { Test } from '@nestjs/testing';
import { PaginationService } from './pagination.service';
import { ModelFindManyArgs, CursorKeys } from './interfaces/pagination.interface';
// import { PrismaService } from 'prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import databaseConfig from 'config/database.config';
import { PostModule } from 'post/post.module';
import { Logger } from '@nestjs/common';
import { SeedModule } from 'seeds/seed.module';
import { SeedAllService } from 'seeds/seedAll.service';
import { Prisma } from '@prisma/client';
import { isEqual, orderBy as _orderBy, cloneDeep } from 'lodash';

const paginatePosts = async (
  pagination: PaginationService,
  options: { orderBy: any; cursorKeys?: CursorKeys; reverse?: boolean },
) => {
  const { orderBy, reverse = false } = options;
  const { cursorKeys: cursorKeys = { nextCursor: null, prevCursor: null } } = options;
  const findManyArgs: ModelFindManyArgs<Prisma.PostFindManyArgs> = {
    where: undefined,
    take: reverse ? -5 : 5,
    orderBy,
    select: {
      id: true,
      createdAt: true,
      author: {
        select: {
          userName: true,
          email: true,
        },
      },
    },
  };
  let cnt = 0;
  const items = null;
  let nextCursorKeys: CursorKeys = cloneDeep(cursorKeys);
  const pages = [];
  do {
    cnt++;
    const { items, cursorKeys: cursorKeysNew } =
      await pagination.findManyPaginate<Prisma.PostFindManyArgs>(
        'Post',
        findManyArgs,
        nextCursorKeys,
      );
    nextCursorKeys = cursorKeysNew;
    if (cnt < 3) {
      expect(items).toBeDefined();
      expect(nextCursorKeys.nextCursor || nextCursorKeys.prevCursor).toBeDefined();
      expect(items).toHaveLength(5);
      pages.push(items);
    }
  } while (nextCursorKeys.nextCursor && nextCursorKeys.prevCursor && cnt < 5);
  expect(cnt).toBe(3);
  expect(items).toBeNull();
  expect(nextCursorKeys.prevCursor === null || nextCursorKeys.nextCursor === null).toBe(
    true,
  );
  expect(pages).toHaveLength(2);
  return { pages, cursorKeys: nextCursorKeys };
};

// const sharedVars: { [key: string]: any } = {};

describe('paginationQuery tests', () => {
  // let prisma: PrismaService;
  let pagination: PaginationService;

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
      providers: [Logger, PaginationService, SeedAllService],
    }).compile();

    pagination = testingModule.get<PaginationService>(PaginationService);
    // prisma = testingModule.get<PrismaService>(PrismaService);
    // const seedAllService = testingModule.get<SeedAllService>(SeedAllService);
    // await prisma.cleanDb();
    // await seedAllService.run();
  });

  it('sorting should sort by id', async () => {
    await Promise.all(
      ['asc', 'desc'].map(async (sortType) => {
        const { pages } = await paginatePosts(pagination, {
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
        const { pages } = await paginatePosts(pagination, {
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

  it('sorting should sort by createdAt', async () => {
    await Promise.all(
      ['asc', 'desc'].map(async (sortType) => {
        const { pages } = await paginatePosts(pagination, {
          orderBy: [{ createdAt: sortType }],
        });
        pages.forEach((page) => {
          const sorted = _orderBy(page, ['createdAt'], [sortType]);
          expect(isEqual(page, sorted)).toBeTruthy();
        });
      }),
    );
  });

  it('sorting should paginate reversed by id', async () => {
    await Promise.all(
      ['asc', 'desc'].map(async (sortType) => {
        const { pages } = await paginatePosts(pagination, {
          orderBy: [{ id: sortType }],
          reverse: true,
        });
        pages.forEach((page) => {
          const sorted = _orderBy(page, ['id'], [sortType]);
          expect(isEqual(page, sorted)).toBeTruthy();
        });
      }),
    );
  });

  it('sorting should paginate reversed by userName and email', async () => {
    await Promise.all(
      ['asc', 'desc'].map(async (sortType) => {
        const { pages } = await paginatePosts(pagination, {
          orderBy: [{ author: { userName: sortType } }, { author: { email: sortType } }],
          reverse: true,
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
