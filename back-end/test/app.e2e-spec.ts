import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('role', 'Admin')
      .expect(200)
      .expect({
        message: 'NestJS backend scaffold is ready',
        docsPath: '/api/docs',
      });
  });

  it('/ (GET) rejects missing role header', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(403);
  });
});
