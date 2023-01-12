import { NestFactory } from '@nestjs/core';
import { SeedAllService } from './seedAll.service';
import { SeedModule } from './seed.module';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);
  await app.get(SeedAllService).run();
  await app.close();
};

void runSeed();
