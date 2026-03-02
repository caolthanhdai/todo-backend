import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: RealtimeGateway,
  ) {}

  async create(data: {
    userId: string;
    type: 'message:new' | 'task:update';
    title: string;
    content?: string;
    payload?: any;
  }) {
    const noti = await this.prisma.notification.create({
      data,
    });

    // emit realtime cho user
    this.gateway.emitToUser(data.userId, 'notification:new', noti);

    return noti;
  }

  async markReadAll(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
