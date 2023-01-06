import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'auth/auth.interface';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): JwtPayload => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
