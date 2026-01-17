import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Module({
  imports: [AuthModule, RealtimeGateway],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
