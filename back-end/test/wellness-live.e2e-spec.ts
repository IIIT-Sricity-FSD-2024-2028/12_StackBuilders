import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Wellness check-ins, responses, and live sessions (e2e)', () => {
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

  it('supports employee check-ins, expert responses, and expert live sessions', async () => {
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

    const checkinResponse = await request(app.getHttpServer())
      .post('/wellness-checkins')
      .set('role', 'Employee')
      .send({
        checkinType: 'mental',
        employeeId: employeeResponse.body.id,
        moodScore: '4',
        stressScore: '8',
        sleepHours: '5.5',
        focusScore: '3',
        anxietyTrigger: 'Project deadlines',
        supportNeeded: 'Need support as soon as possible',
        notes: 'Feeling very stressed this week.',
      })
      .expect(201);

    expect(checkinResponse.body).toMatchObject({
      checkinType: 'mental',
      employeeId: employeeResponse.body.id,
      companyId: 'CMP-1001',
      stressScore: '8',
      supportNeeded: 'Need support as soon as possible',
    });

    const checkinListResponse = await request(app.getHttpServer())
      .get('/wellness-checkins')
      .set('role', 'Wellness Expert')
      .query({
        checkinType: 'mental',
        companyId: 'CMP-1001',
      })
      .expect(200);

    expect(checkinListResponse.body).toHaveLength(1);

    const responseResponse = await request(app.getHttpServer())
      .post('/checkin-responses')
      .set('role', 'Wellness Expert')
      .send({
        checkinId: checkinResponse.body.id,
        checkinType: 'mental',
        employeeId: employeeResponse.body.id,
        employeeName: employeeResponse.body.name,
        expertId: expertResponse.body.id,
        message: 'Please take a short break and let us follow up tomorrow.',
      })
      .expect(201);

    expect(responseResponse.body).toMatchObject({
      checkinId: checkinResponse.body.id,
      expertId: expertResponse.body.id,
      companyId: 'CMP-1001',
    });

    const responsesList = await request(app.getHttpServer())
      .get('/checkin-responses')
      .set('role', 'Employee')
      .query({
        checkinId: checkinResponse.body.id,
        companyId: 'CMP-1001',
      })
      .expect(200);

    expect(responsesList.body).toHaveLength(1);
    expect(responsesList.body[0].message).toContain('short break');

    const liveSessionResponse = await request(app.getHttpServer())
      .post('/live-sessions')
      .set('role', 'Wellness Expert')
      .send({
        title: 'Mindful Breathing Circle',
        category: 'Mental Wellness',
        sessionType: 'Group Session',
        date: '2099-12-31',
        startTime: '18:30',
        duration: '45 min',
        maxParticipants: '50',
        meetingLink: 'https://meet.example.com/live-session',
        description: 'A live guided breathing and stress reset session.',
        expertId: expertResponse.body.id,
      })
      .expect(201);

    expect(liveSessionResponse.body).toMatchObject({
      title: 'Mindful Breathing Circle',
      status: 'scheduled',
      expertId: expertResponse.body.id,
      companyId: 'CMP-1001',
    });

    const liveSessionsForEmployee = await request(app.getHttpServer())
      .get('/live-sessions')
      .set('role', 'Employee')
      .query({
        status: 'scheduled',
        companyId: 'CMP-1001',
      })
      .expect(200);

    expect(liveSessionsForEmployee.body).toHaveLength(1);

    const updatedLiveSession = await request(app.getHttpServer())
      .patch(`/live-sessions/${liveSessionResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        status: 'completed',
        title: 'Mindful Breathing Circle',
        category: 'Mental Wellness',
        sessionType: 'Group Session',
        date: '2099-12-31',
        startTime: '18:30',
        duration: '45 min',
        maxParticipants: '50',
        meetingLink: 'https://meet.example.com/live-session',
        description: 'A live guided breathing and stress reset session.',
      })
      .expect(200);

    expect(updatedLiveSession.body.status).toBe('completed');
  });
});
