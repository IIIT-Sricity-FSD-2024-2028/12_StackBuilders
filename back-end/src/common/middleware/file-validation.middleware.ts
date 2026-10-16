import {
  BadRequestException,
  HttpException,
  Injectable,
  NestMiddleware,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { extname } from 'path';
import multer = require('multer');

const ALLOWED_MIME_TYPES = /^(image\/png|image\/jpeg|image\/webp|application\/pdf)$/;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const uploadSingleFile = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.test(file.mimetype)) {
      cb(
        new BadRequestException(
          'Only PNG, JPEG, WebP, or PDF files are allowed.',
        ) as unknown as Error,
      );
      return;
    }
    cb(null, true);
  },
}).single('file');

@Injectable()
export class FileValidationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.runMulter(req, res);
    } catch (error) {
      throw this.toHttpException(error);
    }
    next();
  }

  private runMulter(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      uploadSingleFile(req, res, (error: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private toHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return new PayloadTooLargeException('File exceeds the 10MB size limit.');
      }
      return new BadRequestException(error.message);
    }
    return new BadRequestException('File upload failed.');
  }
}
