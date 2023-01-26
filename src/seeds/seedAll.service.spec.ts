import { Test } from '@nestjs/testing';
import { SeedAllService } from 'seeds/seedAll.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import databaseConfig from 'config/database.config';

describe('seedAll tests', () => {
  let prisma: PrismaService;
  let seedAllService: SeedAllService;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [databaseConfig],
        }),
        PrismaModule,
      ],
      providers: [SeedAllService],
    }).compile();

    seedAllService = testingModule.get<SeedAllService>(SeedAllService);
    prisma = testingModule.get<PrismaService>(PrismaService);
    await prisma.cleanDb();
    await seedAllService.run();
  });

  it('should be 10 users', async () => {
    const count = await prisma.user.count();
    expect(count).toBe(10);
  });

  it('should be 10 posts', async () => {
    const count = await prisma.post.count();
    expect(count).toBe(10);
  });

  it('should be 20 comments', async () => {
    const count = await prisma.comment.count();
    expect(count).toBe(30);
  });

  it('should be 30 attachments', async () => {
    const count = await prisma.attachment.count();
    expect(count).toBe(40);
  });
});
