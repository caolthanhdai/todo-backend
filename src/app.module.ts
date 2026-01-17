import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TasksModule,
    PrismaModule,
    RealtimeModule,
    ConfigModule.forRoot({
      isGlobal: true, // ⚠️ cực kỳ quan trọng
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
