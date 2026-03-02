import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Đường dẫn tuyệt đối cho chắc
  const uploadPath = path.join(process.cwd(), 'uploads');
  const imagePath = path.join(uploadPath, 'images');
  const filePath = path.join(uploadPath, 'files');

  // ✅ Tạo thư mục nếu chưa tồn tại
  [uploadPath, imagePath, filePath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // ✅ Serve static
  app.use('/uploads', express.static(uploadPath));

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
  console.log('PORT IS:', process.env.PORT);
}

bootstrap();
