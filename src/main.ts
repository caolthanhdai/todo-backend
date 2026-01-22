// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ STATIC FILES – CÁCH CHẮC CHẮN NHẤT
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.enableCors({
    origin: process.env.FRONTEND_URL, // FE
    credentials: true, // để gửi cookie
  });

  await app.listen(3002);
}
bootstrap();
