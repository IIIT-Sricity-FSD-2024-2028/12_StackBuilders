import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { FileValidationMiddleware } from '../common/middleware/file-validation.middleware';

@Module({
  controllers: [UploadsController],
})
export class UploadsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FileValidationMiddleware)
      .forRoutes({ path: 'uploads', method: RequestMethod.POST });
  }
}
