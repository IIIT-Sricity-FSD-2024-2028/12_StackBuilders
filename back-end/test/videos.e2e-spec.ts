import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Video library workflows (e2e)', () => {
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

  it('supports company-scoped video CRUD for wellness experts and read access for HR and employees', async () => {
    const onboardingResponse = await request(app.getHttpServer())
      .post('/company-onboarding-requests')
      .send({
        companyName: 'Stack Builders Pvt Ltd',
        companyPhone: '9876543210',
        companyAddress: 'Bengaluru, Karnataka',
        companyEmail: 'contact@stackbuilders.com',
        hrName: 'Priya Sharma',
        hrPhoneNumber: '9876543210',
        hrEmail: 'priya.sharma@gmail.com',
        hrPassword: 'secure123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/company-onboarding-requests/${onboardingResponse.body.id}/approve`)
      .set('role', 'Admin')
      .expect(201);

    const employeeResponse = await request(app.getHttpServer())
      .post('/employees')
      .set('role', 'HR')
      .send({
        name: 'Aarav Sharma',
        department: 'Engineering',
        email: 'aarav.sharma@gmail.com',
        password: 'secure123',
        companyId: 'CMP-1001',
      })
      .expect(201);

    const expertResponse = await request(app.getHttpServer())
      .post('/experts')
      .set('role', 'HR')
      .send({
        name: 'Neha Verma',
        specialization: 'Psychologist',
        experience: '5',
        email: 'neha.verma@gmail.com',
        password: 'secure123',
        companyId: 'CMP-1001',
      })
      .expect(201);

    const createVideoResponse = await request(app.getHttpServer())
      .post('/videos')
      .set('role', 'Wellness Expert')
      .send({
        title: 'Guided Mindfulness Reset',
        category: 'Mind Relaxation',
        duration: '09:55',
        videoLink: 'https://www.youtube.com/watch?v=inpok4MKVLM',
        thumbnailLink:
          'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80',
        description: 'A short mindfulness reset for stress and focus.',
        creatorExpertId: expertResponse.body.id,
      })
      .expect(201);

    expect(createVideoResponse.body).toMatchObject({
      title: 'Guided Mindfulness Reset',
      category: 'Mind Relaxation',
      creatorExpertId: expertResponse.body.id,
      companyId: 'CMP-1001',
    });

    const hrVideosResponse = await request(app.getHttpServer())
      .get('/videos')
      .set('role', 'HR')
      .query({ companyId: 'CMP-1001' })
      .expect(200);

    expect(hrVideosResponse.body).toHaveLength(1);

    const employeeVideosResponse = await request(app.getHttpServer())
      .get('/videos')
      .set('role', 'Employee')
      .query({
        companyId: 'CMP-1001',
        category: 'Mind Relaxation',
      })
      .expect(200);

    expect(employeeVideosResponse.body).toHaveLength(1);
    expect(employeeVideosResponse.body[0].id).toBe(createVideoResponse.body.id);

    const updatedVideoResponse = await request(app.getHttpServer())
      .patch(`/videos/${createVideoResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        title: 'Guided Mindfulness Reset for Busy Days',
        category: 'Mind Relaxation',
        duration: '10:10',
        videoLink: 'https://www.youtube.com/watch?v=inpok4MKVLM',
        thumbnailLink:
          'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80',
        description: 'An updated mindfulness reset for busy workdays.',
        creatorExpertId: expertResponse.body.id,
      })
      .expect(200);

    expect(updatedVideoResponse.body).toMatchObject({
      title: 'Guided Mindfulness Reset for Busy Days',
      duration: '10:10',
    });

    await request(app.getHttpServer())
      .delete(`/videos/${createVideoResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .expect(200);

    await request(app.getHttpServer())
      .get(`/videos/${createVideoResponse.body.id}`)
      .set('role', 'Employee')
      .expect(404);

    await request(app.getHttpServer())
      .get('/videos')
      .set('role', 'Employee')
      .query({ companyId: employeeResponse.body.companyId })
      .expect(200, []);
  });
});
