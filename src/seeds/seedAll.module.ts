import { Module } from '@nestjs/common';
import { SeedAllService } from './seedAll.service';

@Module({
  providers: [SeedAllService],
})
export class AllModule {}
