import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from 'config/app.config';
import authConfig from 'config/auth.config';
import databaseConfig from 'config/database.config';

import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'auth/auth.module';
import { UserModule } from 'user/user.module';
import { PostModule } from 'post/post.module';
import { PaginationModule } from './pagination/pagination.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    AuthModule,
    PrismaModule,
    UserModule,
    PostModule,
    PaginationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
