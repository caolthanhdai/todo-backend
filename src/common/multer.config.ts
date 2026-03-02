import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { join } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, join(process.cwd(), 'uploads/images'));
      } else {
        cb(null, join(process.cwd(), 'uploads/files'));
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
    _file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    return cb(null, true);
  },
};
