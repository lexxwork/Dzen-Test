import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          provider: config.get('database.DATABASE_PROVIDER'),
          url: config.get('database.DATABASE_URL'),
        },
      },
    });
  }
}
