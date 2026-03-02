import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [ConfigModule, PrismaModule, RealtimeModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
