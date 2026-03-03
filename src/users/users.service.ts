import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // map qua DTO
    const result = new UserResponseDto();
    result.userId = user.userId;
    result.name = user.name;
    result.email = user.email;
    result.avatarSrc = user.avatarSrc ?? null;
    result.location = user.location ?? null;
    result.unreadNotifications = user.unreadNotifications ?? 0;
    result.createdAt = user.createdAt.toISOString();

    return result;
  }
}
