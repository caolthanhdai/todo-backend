import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
