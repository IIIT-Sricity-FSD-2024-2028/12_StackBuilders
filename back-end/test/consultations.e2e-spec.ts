import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Consultation workflows (e2e)', () => {
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

  it('supports request, accept, schedule, and follow-up consultation flows', async () => {
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
        specialization: 'Nutritionist',
        experience: '5',
        email: 'neha.verma@gmail.com',
        password: 'secure123',
        companyId: 'CMP-1001',
      })
      .expect(201);

    const consultationResponse = await request(app.getHttpServer())
      .post('/consultations')
      .set('role', 'Employee')
      .send({
        employeeId: employeeResponse.body.id,
        employeeName: employeeResponse.body.name,
        expertId: expertResponse.body.id,
        purpose: 'Need guidance for nutrition planning.',
      })
      .expect(201);

    expect(consultationResponse.body).toMatchObject({
      employeeId: employeeResponse.body.id,
      expertId: expertResponse.body.id,
      status: 'requested',
      category: 'Nutritionist',
      companyId: 'CMP-1001',
    });

    const requestedListResponse = await request(app.getHttpServer())
      .get('/consultations')
      .set('role', 'Wellness Expert')
      .query({
        expertId: expertResponse.body.id,
        status: 'requested',
        companyId: 'CMP-1001',
      })
      .expect(200);

    expect(requestedListResponse.body).toHaveLength(1);

    const acceptedConsultationResponse = await request(app.getHttpServer())
      .patch(`/consultations/${consultationResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        status: 'accepted',
        rejectionReason: '',
      })
      .expect(200);

    expect(acceptedConsultationResponse.body.status).toBe('accepted');

    const scheduledConsultationResponse = await request(app.getHttpServer())
      .patch(`/consultations/${consultationResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        sessionTitle: 'Nutrition Consultation with Aarav Sharma',
        sessionDate: '2099-12-31',
        sessionTime: '18:30',
        sessionDuration: '45 min',
        sessionMeetingLink: 'https://meet.example.com/session',
      })
      .expect(200);

    expect(scheduledConsultationResponse.body).toMatchObject({
      sessionDate: '2099-12-31',
      sessionTime: '18:30',
      sessionDuration: '45 min',
      sessionMeetingLink: 'https://meet.example.com/session',
    });

    const lookupResponse = await request(app.getHttpServer())
      .get('/consultations/open-latest/search')
      .set('role', 'Wellness Expert')
      .query({
        employeeId: employeeResponse.body.id,
        expertId: expertResponse.body.id,
        companyId: 'CMP-1001',
      })
      .expect(200);

    expect(lookupResponse.body.consultation.id).toBe(consultationResponse.body.id);

    const followUpResponse = await request(app.getHttpServer())
      .post('/consultations/follow-up')
      .set('role', 'Wellness Expert')
      .send({
        employeeId: employeeResponse.body.id,
        employeeName: employeeResponse.body.name,
        expertId: expertResponse.body.id,
        expertName: expertResponse.body.name,
        purpose:
          'High nutrition follow-up recommended based on the latest employee update.',
        sourceCheckinId: 'checkin-123',
        followUpPriority: 'high',
      })
      .expect(201);

    expect(followUpResponse.body.reused).toBe(true);
    expect(followUpResponse.body.consultation.id).toBe(consultationResponse.body.id);

    await request(app.getHttpServer())
      .patch(`/consultations/${consultationResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        status: 'rejected',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/consultations/${consultationResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        sessionTitle: 'Should fail',
        sessionDate: '2099-12-31',
        sessionTime: '18:30',
        sessionDuration: '45 min',
        sessionMeetingLink: 'https://meet.example.com/session',
      })
      .expect(400);
  });
});
