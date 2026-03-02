import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTaskDto,
  LoadTasksQueryDto,
  TaskResponseDto,
  TaskSearchResponseDto,
  UpdateTaskDto,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TaskMemberResponseDto } from './dto';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { Prisma } from '@prisma/client';
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tasksGateway: RealtimeGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async createTask(
    dto: CreateTaskDto,
    assets: {
      files?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    userId: string,
  ): Promise<TaskResponseDto> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. tạo task
      const task = await tx.task.create({
        data: {
          title: dto.title,
          description: dto.description ?? '',
          status: dto.status ?? 'todo',
          priority: dto.priority ?? 'medium',
          dueTime: dto.dueTime ? new Date(dto.dueTime) : null,
          createdById: userId,
          members: {
            create: { userId, role: 'manager' },
          },
        },
      });
      // 3. add first message
      await tx.taskMessage.create({
        data: {
          content: 'Task created',
          taskId: task.taskId,
          authorId: userId,
        },
      });
      // 2. add files
      if (assets.files?.length) {
        await tx.file.createMany({
          data: assets.files.map((file) => ({
            name: file.originalname,
            url: `/uploads/files/${file.filename}`,
            size: file.size,
            type: file.mimetype,
            taskId: task.taskId,
            uploadedById: userId,
          })),
        });
      }

      // 3. add images
      if (assets.images?.length) {
        await tx.uploadedImage.createMany({
          data: assets.images.map((img) => ({
            name: img.originalname,
            url: `/uploads/images/${img.filename}`,
            size: img.size,
            type: img.mimetype,
            taskId: task.taskId,
            uploadedById: userId,
          })),
        });
      }
      const fullTask = await tx.task.findUnique({
        where: { taskId: task.taskId },
        include: {
          files: {
            include: {
              uploadedBy: {
                select: {
                  userId: true,
                  name: true,
                  email: true,
                  avatarSrc: true,
                },
              },
            },
          },
          images: {
            include: {
              uploadedBy: {
                select: {
                  userId: true,
                  name: true,
                },
              },
            },
          },
          members: {
            include: {
              user: true,
            },
          },
          _count: { select: { messages: true } },
        },
      });
      if (!fullTask) {
        throw new Error('Task not found after creation');
      }
      this.tasksGateway.emitToUser(userId, 'task:created', fullTask);
      return {
        title: task.title,
        taskId: task.taskId,
        description: task.description,
        status: task.status,
        priority: task.priority,
        members: fullTask.members.map((m: any) => ({
          userId: m.user.userId,
          name: m.user.name,
          email: m.user.email,
          avatarSrc: m.user.avatarSrc,
          role: m.role,
        })),
        myRole:
          fullTask.members.find((m: any) => m.user.userId === userId)?.role ??
          'viewer',
        messagesCount: fullTask._count.messages,
        files: fullTask.files.map((f: any) => ({
          id: f.fileId,
          name: f.name,
          url: f.url,
          uploadedAt: f.uploadedAt.toISOString(),
          uploadedBy: f.uploadedBy
            ? {
                userId: f.uploadedBy.userId,
                name: f.uploadedBy.name,
              }
            : undefined,
        })),
        images: fullTask.images.map((img: any) => ({
          id: img.imageId,
          name: img.name,
          url: img.url,
          uploadedAt: img.uploadedAt.toISOString(),
          uploadedBy: img.uploadedBy
            ? {
                userId: img.uploadedBy.userId,
                name: img.uploadedBy.name,
              }
            : undefined,
        })),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    });
  }

  async loadTasks(
    userId: string,
    query: LoadTasksQueryDto,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        members: { some: { userId } },
        ...(query.status && { status: query.status }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        files: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
                email: true,
                avatarSrc: true,
              },
            },
          },
        },
        images: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return tasks.map((task: any) => ({
      taskId: task.taskId,
      title: task.title,
      description: task.description,

      status: task.status,
      priority: task.priority,

      members: task.members.map((m: any) => ({
        userId: m.user.userId,
        name: m.user.name,
        email: m.user.email,
        avatarSrc: m.user.avatarSrc,
        role: m.role,
      })),
      myRole:
        task.members.find((m: any) => m.user.userId === userId)?.role ??
        'viewer',
      files: task.files.map((f: any) => ({
        id: f.fileId,
        name: f.name,
        url: f.url,
        uploadedBy: f.uploadedBy
          ? {
              userId: f.uploadedBy.userId,
              name: f.uploadedBy.name,
            }
          : undefined,
        uploadedAt: f.uploadedAt.toISOString(),
      })),

      images: task.images.map((img: any) => ({
        id: img.imageId,
        name: img.name,
        url: img.url,
        uploadedBy: img.uploadedBy
          ? {
              userId: img.uploadedBy.userId,
              name: img.uploadedBy.name,
            }
          : undefined,
        uploadedAt: img.uploadedAt.toISOString(),
      })),

      messagesCount: task._count.messages,

      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
  }

  async updateTask(
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    const member = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (!member) throw new ForbiddenException();

    await this.prisma.task.update({
      where: { taskId },
      data: {
        ...dto,
        dueTime: dto.dueTime ? new Date(dto.dueTime) : undefined,
      },
    });
    const task = await this.prisma.task.findUnique({
      where: { taskId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        files: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
                email: true,
                avatarSrc: true,
              },
            },
          },
        },
        images: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    const resTask = {
      taskId: task.taskId,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,

      members: task.members.map((m: any) => ({
        userId: m.user.userId,
        name: m.user.name,
        email: m.user.email,
        avatarSrc: m.user.avatarSrc,
        role: m.role,
      })),
      myRole:
        task.members.find((m: any) => m.user.userId === userId)?.role ??
        'viewer',
      files: task.files.map((f: any) => ({
        id: f.fileId,
        name: f.name,
        url: f.url,
        uploadedAt: f.uploadedAt.toISOString(),
        uploadedBy: f.uploadedBy
          ? {
              userId: f.uploadedBy.userId,
              name: f.uploadedBy.name,
            }
          : undefined,
      })),

      images: task.images.map((i) => ({
        id: i.imageId,
        name: i.name,
        url: i.url,
        uploadedAt: i.uploadedAt.toISOString(),
        uploadedBy: i.uploadedBy
          ? {
              userId: i.uploadedBy.userId,
              name: i.uploadedBy.name,
            }
          : undefined,
      })),

      messagesCount: task._count.messages,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    this.tasksGateway.emitToTask(taskId, 'task:updated', resTask);
    task.members.forEach((m: any) => {
      this.tasksGateway.emitToUser(m.user.userId, 'task:updated', resTask);
    });

    const notifyMembers = task.members.filter(
      (m: any) => m.user.userId !== userId,
    );
    await Promise.all(
      notifyMembers.map((m: any) =>
        this.notificationService.create({
          userId: m.user.userId,
          type: 'task:update',
          title: 'Task updated',
          content: `Task "${task.title}" was updated`,
          payload: { taskId },
        }),
      ),
    );

    // 3. map to TaskResponseDto
    return resTask;
  }
  async deleteTask(taskId: string, userId: string) {
    // 1. check quyền
    const member = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (!member || member.role !== 'manager') {
      throw new ForbiddenException();
    }

    // 2. LẤY MEMBERS TRƯỚC KHI DELETE
    const members = await this.prisma.taskMember.findMany({
      where: { taskId },
      select: { userId: true },
    });

    // 3. delete task
    await this.prisma.task.delete({
      where: { taskId },
    });

    // 4. notify TỪNG USER (TaskBoard đang nghe)
    members.forEach((m: any) => {
      this.tasksGateway.emitToUser(m.userId, 'task:deleted', { taskId });
    });

    return { message: 'Task deleted successfully' };
  }

  async addFile(taskId: string, file: Express.Multer.File, userId: string) {
    const member = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (!member) throw new ForbiddenException();
    const createdFile = await this.prisma.file.create({
      data: {
        name: file.originalname,
        url: `/uploads/files/${file.filename}`,
        size: file.size,
        type: file.mimetype,
        taskId,
        uploadedById: userId,
      },
    });
    const resFile = {
      id: createdFile.fileId,
      name: createdFile.name,
      url: createdFile.url,
      uploadedBy: {
        userId,
        name: (await this.prisma.user.findUnique({ where: { userId } }))?.name,
      },
      uploadedAt: createdFile.uploadedAt.toISOString(),
    };

    this.tasksGateway.emitToTask(taskId, 'task:fileAdded', resFile);

    return resFile;
  }

  async addImage(taskId: string, image: Express.Multer.File, userId: string) {
    const member = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (!member) throw new ForbiddenException();
    const baseUrl = this.config.get<string>('APP_URL');
    const createdImage = await this.prisma.uploadedImage.create({
      data: {
        name: image.originalname,
        url: `/uploads/images/${image.filename}`,
        size: image.size,
        type: image.mimetype,
        taskId,
        uploadedById: userId,
      },
    });
    const resImage = {
      id: createdImage.imageId,
      name: createdImage.name,
      url: createdImage.url,
      uploadedBy: {
        userId,
        name: (await this.prisma.user.findUnique({ where: { userId } }))?.name,
      },
      uploadedAt: createdImage.uploadedAt.toISOString(),
    };
    this.tasksGateway.emitToTask(taskId, 'task:imageAdded', resImage);

    return resImage;
  }
  async getTaskById(taskId: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: {
        taskId,
        members: { some: { userId } },
      },
      include: {
        files: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
                email: true,
                avatarSrc: true,
              },
            },
          },
        },
        images: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
              },
            },
          },
        },
        members: { include: { user: true } },
        _count: { select: { messages: true } },
      },
    });

    if (!task) throw new NotFoundException();
    const myMember = task.members.find((m: any) => m.userId === userId);
    return {
      taskId: task.taskId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      members: task.members.map((m: any) => ({
        userId: m.user.userId,
        name: m.user.name,
        email: m.user.email,
        avatarSrc: m.user.avatarSrc,
        role: m.role,
      })),
      files: task.files.map((f: any) => ({
        id: f.fileId,
        name: f.name,
        url: f.url,
        uploadedAt: f.uploadedAt.toISOString(),
        uploadedBy: f.uploadedBy
          ? {
              userId: f.uploadedBy.userId,
              name: f.uploadedBy.name,
            }
          : undefined,
      })),
      images: task.images.map((i: any) => ({
        id: i.imageId,
        name: i.name,
        url: i.url,
        uploadedAt: i.uploadedAt.toISOString(),
        uploadedBy: i.uploadedBy
          ? {
              userId: i.uploadedBy.userId,
              name: i.uploadedBy.name,
            }
          : undefined,
      })),
      messagesCount: task._count.messages,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      myRole: myMember?.role || 'viewer',
    };
  }
  async addMemberByEmail(taskId: string, email: string, userId: string) {
    // chỉ manager mới được add
    const current = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (!current || current.role !== 'manager') {
      throw new ForbiddenException();
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found');

    const existed = await this.prisma.taskMember.findUnique({
      where: {
        taskId_userId: { taskId, userId: user.userId },
      },
    });
    if (existed) return existed;

    const member = await this.prisma.taskMember.create({
      data: {
        taskId,
        userId: user.userId,
        role: 'member',
      },
      include: { user: true },
    });
    const task = await this.prisma.task.findUnique({
      where: { taskId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        files: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
                email: true,
                avatarSrc: true,
              },
            },
          },
        },
        images: {
          include: {
            uploadedBy: {
              select: {
                userId: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    const resTask = {
      taskId: task.taskId,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,

      members: task.members.map((m: any) => ({
        userId: m.user.userId,
        name: m.user.name,
        email: m.user.email,
        avatarSrc: m.user.avatarSrc,
        role: m.role,
      })),

      files: task.files.map((f: any) => ({
        id: f.fileId,
        name: f.name,
        url: f.url,
        uploadedAt: f.uploadedAt.toISOString(),
        uploadedBy: f.uploadedBy
          ? {
              userId: f.uploadedBy.userId,
              name: f.uploadedBy.name,
            }
          : undefined,
      })),

      images: task.images.map((i: any) => ({
        id: i.imageId,
        name: i.name,
        url: i.url,
        uploadedAt: i.uploadedAt.toISOString(),
        uploadedBy: i.uploadedBy
          ? {
              userId: i.uploadedBy.userId,
              name: i.uploadedBy.name,
            }
          : undefined,
      })),

      messagesCount: task._count.messages,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    const resMember = {
      userId: member.user.userId,
      name: member.user.name,
      email: member.user.email,
      avatarSrc: member.user.avatarSrc,
      role: member.role,
    };

    this.tasksGateway.emitToUser(user.userId, 'task:added', resTask);

    this.tasksGateway.emitToTask(taskId, 'task:memberAdded', resMember);

    return {
      member: resMember,
    };
  }
  // task.service.ts
  async searchMyTasksLite(
    userId: string,
    q?: string,
  ): Promise<TaskSearchResponseDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        members: {
          some: { userId },
        },
        ...(q && {
          title: {
            contains: q,
            mode: 'insensitive',
          },
        }),
      },
      select: {
        taskId: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    return tasks.map((task: any) => ({
      taskId: task.taskId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      myRole: task.members[0].role,
      messagesCount: task._count.messages,
      updatedAt: task.updatedAt.toISOString(),
    }));
  }
}
