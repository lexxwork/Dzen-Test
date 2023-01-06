import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type UserInfo = Pick<User, 'id' | 'email' | 'userName'>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: number) {
    const userSelect: Prisma.UserSelect = {
      id: true,
      email: true,
      userName: true,
    };
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    return user as UserInfo;
  }
}
