import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { PaginationResponseDto, TaskWithLastMessageDto } from './dto';
import { MessageResponseDto } from './dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notificationService: NotificationService,
  ) {}
  private toMessageDto(m: any): MessageResponseDto {
    return {
      messageId: m.messageId,
      taskId: m.taskId,
      content: m.content,
      createdAt: m.createdAt,
      author: {
        userId: m.author.userId,
        name: m.author.name,
        avatarSrc: m.author.avatarSrc,
      },
    };
  }

  private async assertMember(taskId: string, userId: string) {
    const member = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (!member) throw new ForbiddenException();
  }
  async getInitialTaskMessages(
    taskId: string,
    userId: string,
    limit = 50,
  ): Promise<PaginationResponseDto<MessageResponseDto>> {
    await this.assertMember(taskId, userId);

    const messages = await this.prisma.taskMessage.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: true },
    });

    return {
      data: messages.map(this.toMessageDto).reverse(),
      nextCursor:
        messages.length === limit
          ? messages[messages.length - 1].createdAt.toISOString()
          : null,
    };
  }
  async getMessagesBefore(
    taskId: string,
    userId: string,
    cursor: string,
    limit = 50,
  ): Promise<PaginationResponseDto<MessageResponseDto>> {
    await this.assertMember(taskId, userId);

    const messages = await this.prisma.taskMessage.findMany({
      where: {
        taskId,
        createdAt: { lt: new Date(cursor) },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: true },
    });

    return {
      data: messages.map(this.toMessageDto).reverse(),
      nextCursor:
        messages.length === limit
          ? messages[messages.length - 1].createdAt.toISOString()
          : null,
    };
  }
  async getTasksWithLastMessage(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<PaginationResponseDto<TaskWithLastMessageDto>> {
    const tasks = await this.prisma.task.findMany({
      where: {
        members: { some: { userId } },
        ...(cursor && { updatedAt: { lt: new Date(cursor) } }),
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { author: true },
        },
      },
    });

    return {
      data: tasks.map((task: any) => ({
        taskId: task.taskId,
        title: task.title,
        updatedAt: task.updatedAt,
        lastMessage: task.messages[0]
          ? {
              messageId: task.messages[0].messageId,
              content: task.messages[0].content,
              taskId: task.taskId,
              createdAt: task.messages[0].createdAt,
              author: {
                userId: task.messages[0].author.userId,
                name: task.messages[0].author.name,
                avatarSrc: task.messages[0].author.avatarSrc,
              },
            }
          : null,
      })),
      nextCursor:
        tasks.length === limit
          ? tasks[tasks.length - 1].updatedAt.toISOString()
          : null,
    };
  }
  async sendMessage(
    taskId: string,
    userId: string,
    content: string,
  ): Promise<MessageResponseDto> {
    if (!content?.trim()) {
      throw new BadRequestException('Content is empty');
    }

    // check user là member task
    await this.assertMember(taskId, userId);

    // tạo message
    const message = await this.prisma.taskMessage.create({
      data: {
        taskId,
        authorId: userId,
        content,
      },
      include: { author: true },
    });

    const dto = this.toMessageDto(message);

    // emit realtime message cho room task
    this.realtime.emitToTask(taskId, 'message:new', dto);

    // lấy danh sách member khác sender
    const members = await this.prisma.taskMember.findMany({
      where: {
        taskId,
        userId: { not: userId },
      },
      select: { userId: true },
    });

    // gửi notification
    await Promise.all(
      members.map((m: any) =>
        this.notificationService.create({
          userId: m.userId,
          type: 'message:new',
          title: 'New message',
          content: message.content,
          payload: {
            taskId,
            messageId: message.messageId,
          },
        }),
      ),
    );

    return dto;
  }
}
