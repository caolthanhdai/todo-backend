import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [AuthModule, RealtimeModule, NotificationModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
