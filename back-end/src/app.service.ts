import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      message: 'NestJS backend scaffold is ready',
      docsPath: '/api/docs',
    };
  }
}
