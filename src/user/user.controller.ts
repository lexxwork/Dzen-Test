import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtPayload } from 'auth/auth.interface';
import { GetUser } from 'auth/decorator/get-user.decorator';
import { JwtGuard } from 'auth/guard/jwt.guard';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('me')
  async getMe(@GetUser() payload: JwtPayload) {
    const user = await this.userService.getUserById(payload.id);
    return user;
  }
}
