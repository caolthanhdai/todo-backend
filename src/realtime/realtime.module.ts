// realtime.module.ts
import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    ConfigModule,
  ],
  providers: [RealtimeGateway, JwtService],
  exports: [RealtimeGateway], // ⬅ cho service khác dùng
})
export class RealtimeModule {}
