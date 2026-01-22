import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

export const multerConfig = {
  storage: diskStorage({
    destination: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, './uploads/images');
      } else {
        cb(null, './uploads/files');
      }
    },

    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueName =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        extname(file.originalname);

      cb(null, uniqueName);
    },
  }),

  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      throw new BadRequestException('Invalid file type');
    }
  },
};
