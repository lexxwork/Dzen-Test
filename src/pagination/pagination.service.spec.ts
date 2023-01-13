import { Test } from '@nestjs/testing';
import { Pagination } from './pagination.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import databaseConfig from 'config/database.config';
import { PostModule } from 'post/post.module';
import { Logger } from '@nestjs/common';
import { SeedModule } from 'seeds/seed.module';
import { SeedAllService } from 'seeds/seedAll.service';

describe('paginationQuery tests', () => {
  let prisma: PrismaService;
  let paginationQuery: Pagination;

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

    paginationQuery = testingModule.get<Pagination>(Pagination);
    prisma = testingModule.get<PrismaService>(PrismaService);
    const seedAllService = testingModule.get<SeedAllService>(SeedAllService);

    await prisma.cleanDb();
    await seedAllService.run();
  });

  it('should have result', async () => {
    const nextKey = {
      id: 65,
      sortedValue: 'Eve',
    };
    const result = await paginationQuery.findManyPaginate({
      modelName: 'Post',
      where: undefined,
      include: undefined, //{ author: true },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        author: { select: { userName: true, email: true } },
      },
      sortInfo: {
        fieldName: 'userName',
        reference: 'author',
        type: 'asc',
      },
      nextKey: nextKey,
    });
    console.log(JSON.stringify(result));
    expect(result).toBeDefined();
  });
});
