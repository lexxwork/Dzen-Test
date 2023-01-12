import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AllModule } from './seedAll.module';
import appConfig from 'config/app.config';
import databaseConfig from 'config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AllModule,
  ],
  controllers: [],
  providers: [],
})
export class SeedModule {}
