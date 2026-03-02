import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
@WebSocketGateway({
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ===== AUTH SOCKET =====
  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('NO_TOKEN'));

        const payload = await this.jwt.verifyAsync(token, {
          secret: this.config.get('JWT_ACCESS_SECRET'),
        });

        socket.data.userId = payload.sub;
        next();
      } catch {
        next(new Error('UNAUTHORIZED'));
      }
    });
  }

  // ===== CLIENT READY =====
  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() socket: Socket) {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    socket.emit('ready:ok');
  }

  // ===== JOIN TASK ROOM =====
  @SubscribeMessage('joinTask')
  async joinTask(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const userId = socket.data.userId;
    const { taskId } = data;

    const member = await this.prisma.taskMember.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (!member) {
      socket.emit('task:join:error', { taskId });
      return;
    }
    socket.join(`task:${data.taskId}`);
    socket.emit('task:joined', { taskId: data.taskId });
  }

  // ===== LEAVE TASK ROOM =====
  @SubscribeMessage('leaveTask')
  leaveTask(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    socket.leave(`task:${data.taskId}`);
  }

  @SubscribeMessage('notification:readAll')
  async readAll(@ConnectedSocket() socket: Socket) {
    const userId = socket.data.userId;

    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    socket.emit('notification:read:ok');
  }

  // ===== EMIT HELPERS (DÙNG TRONG SERVICE) =====
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToTask(taskId: string, event: string, payload: any) {
    console.log('🔥 EMIT', event, 'TO task:', taskId);
    this.server.to(`task:${taskId}`).emit(event, payload);
  }
  emitNewMessage(taskId: string, message: any) {
    this.emitToTask(taskId, 'message:new', message);
  }
}
