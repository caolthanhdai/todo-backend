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

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
  joinTask(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    socket.join(`task:${data.taskId}`);
  }

  // ===== LEAVE TASK ROOM =====
  @SubscribeMessage('leaveTask')
  leaveTask(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    socket.leave(`task:${data.taskId}`);
  }

  // ===== EMIT HELPERS (DÙNG TRONG SERVICE) =====
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToTask(taskId: string, event: string, payload: any) {
    this.server.to(`task:${taskId}`).emit(event, payload);
  }
}
