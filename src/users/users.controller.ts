// src/users/user.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  
  async getMe(@Req() req: { user: { userId: string; email: string } }) {
    const userId = req.user.userId; // lấy từ payload trong JWT guard
    return this.usersService.getMe(userId);
  }
}
