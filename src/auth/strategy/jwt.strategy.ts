import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Prisma } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('auth.secret'),
    });
  }

  async validate(payload: { sub: number; email: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    const userSelect: Prisma.UserSelect = {
      id: true,
      email: true,
      userName: true,
    };
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: userSelect,
    });
    return user;
  }
}
