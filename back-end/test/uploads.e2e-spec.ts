import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'node:path';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Uploads workflow (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts supported document uploads', async () => {
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'file-1787481152339-559260302.pdf',
    );

    const response = await request(app.getHttpServer())
      .post('/uploads')
      .attach('file', filePath)
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'File uploaded successfully',
    });

    expect(response.body.filename).toMatch(/^file-\d+-\d+\.pdf$/);
    expect(response.body.path).toContain(path.join('uploads', 'file-'));
  });
});
