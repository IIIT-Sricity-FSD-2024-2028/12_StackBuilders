import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Support queries (e2e)', () => {
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

  it('accepts a support query submitted by a wellness expert', async () => {
    const payload = {
      userId: 'expert-123',
      userEmail: 'expert@example.com',
      userName: 'Dr. Example Expert',
      userType: 'Wellness Expert',
      companyId: 'CMP-1001',
      companyName: 'Example Company',
      description: 'Please help me with my account.',
      status: 'Open',
      reply: '',
      readBySender: false,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/queries')
      .set('role', 'Wellness Expert')
      .send(payload)
      .expect(201);

    expect(createResponse.body).toMatchObject(payload);
    expect(createResponse.body.id).toMatch(/^Q-/);

    const reply = 'We have received your request and will follow up shortly.';
    const repliedAt = Date.now();
    const replyResponse = await request(app.getHttpServer())
      .patch(`/queries/${createResponse.body.id}`)
      .set('role', 'Admin')
      .send({ reply, status: 'Replied', readBySender: false, repliedAt })
      .expect(200);

    expect(replyResponse.body).toMatchObject({
      reply,
      status: 'Replied',
      readBySender: false,
      repliedAt,
    });

    const listResponse = await request(app.getHttpServer())
      .get('/queries')
      .expect(200);

    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createResponse.body.id,
          userType: 'Wellness Expert',
          description: payload.description,
          reply,
          readBySender: false,
        }),
      ]),
    );

    const readResponse = await request(app.getHttpServer())
      .patch(`/queries/${createResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({ readBySender: true })
      .expect(200);

    expect(readResponse.body.readBySender).toBe(true);
  });
});
