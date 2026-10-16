import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { InMemoryDataService } from './../src/common/data/in-memory-data.service';

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

  it('prevents one employee from booking the same slot with different experts', async () => {
    const data = app.get(InMemoryDataService);
    const slotDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    slotDate.setSeconds(0, 0);
    const slotTime = slotDate.toISOString();
    const now = new Date().toISOString();
    const companyId = 'CMP-BOOKING-TEST';
    const companyName = 'Booking Test Company';

    data.employees.push(
      {
        id: 'employee-booking-one',
        name: 'Aarav Sharma',
        email: 'aarav.booking@example.com',
        username: 'aarav.booking@example.com',
        password: 'secure123',
        department: 'Engineering',
        status: 'Active',
        age: '28',
        gender: 'M',
        phoneNumber: '',
        companyId,
        companyName,
        heightCm: '',
        weightKg: '',
        rewardPointsBalance: '0',
        claimedRewardIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'employee-booking-two',
        name: 'Priya Nair',
        email: 'priya.booking@example.com',
        username: 'priya.booking@example.com',
        password: 'secure123',
        department: 'Design',
        status: 'Active',
        age: '30',
        gender: 'F',
        phoneNumber: '',
        companyId,
        companyName,
        heightCm: '',
        weightKg: '',
        rewardPointsBalance: '0',
        claimedRewardIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'employee-booking-three',
        name: 'Kavya Rao',
        email: 'kavya.booking@example.com',
        username: 'kavya.booking@example.com',
        password: 'secure123',
        department: 'Operations',
        status: 'Active',
        age: '29',
        gender: 'F',
        phoneNumber: '',
        companyId,
        companyName,
        heightCm: '',
        weightKg: '',
        rewardPointsBalance: '0',
        claimedRewardIds: [],
        createdAt: now,
        updatedAt: now,
      },
    );

    data.experts.push(
      {
        id: 'expert-booking-one',
        name: 'Neha Verma',
        email: 'neha.booking@example.com',
        username: 'neha.booking@example.com',
        password: 'secure123',
        specialization: 'Psychologist',
        experience: '5',
        phoneNumber: '',
        companyId,
        companyName,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
        availableSlots: [slotTime],
      },
      {
        id: 'expert-booking-two',
        name: 'Rahul Menon',
        email: 'rahul.booking@example.com',
        username: 'rahul.booking@example.com',
        password: 'secure123',
        specialization: 'Nutritionist',
        experience: '7',
        phoneNumber: '',
        companyId,
        companyName,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
        availableSlots: [slotTime],
      },
    );

    const firstBooking = await request(app.getHttpServer())
      .post('/consultations/book-slot')
      .set('role', 'Employee')
      .send({
        employeeId: 'employee-booking-one',
        expertId: 'expert-booking-one',
        purpose: 'First consultation',
        slotTime,
      })
      .expect(201);

    const duplicateBooking = await request(app.getHttpServer())
      .post('/consultations/book-slot')
      .set('role', 'Employee')
      .send({
        employeeId: 'employee-booking-one',
        expertId: 'expert-booking-two',
        purpose: 'Conflicting consultation',
        slotTime,
      })
      .expect(400);

    expect(duplicateBooking.body.message).toContain(
      'already have a consultation booked for this time slot',
    );
    expect(data.experts.find((expert) => expert.id === 'expert-booking-two')?.availableSlots).toContain(slotTime);

    await request(app.getHttpServer())
      .post('/consultations/book-slot')
      .set('role', 'Employee')
      .send({
        employeeId: 'employee-booking-two',
        expertId: 'expert-booking-two',
        purpose: 'Different employee, same clock time',
        slotTime,
      })
      .expect(201);

    const unscheduledRequest = await request(app.getHttpServer())
      .post('/consultations')
      .set('role', 'Employee')
      .send({
        employeeId: 'employee-booking-one',
        expertId: 'expert-booking-two',
        purpose: 'Request to schedule later',
      })
      .expect(201);

    const scheduleConflict = await request(app.getHttpServer())
      .patch(`/consultations/${unscheduledRequest.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        status: 'accepted',
        sessionTitle: 'Conflicting session',
        sessionDate: firstBooking.body.sessionDate,
        sessionTime: firstBooking.body.sessionTime,
        sessionDuration: '15 min',
        sessionMeetingLink: 'https://meet.example.com/conflicting-session',
      })
      .expect(400);

    expect(scheduleConflict.body.message).toContain(
      'already have a consultation booked for this time slot',
    );

    const expertCollisionRequest = await request(app.getHttpServer())
      .post('/consultations')
      .set('role', 'Employee')
      .send({
        employeeId: 'employee-booking-three',
        expertId: 'expert-booking-one',
        purpose: 'Request without a selected slot',
      })
      .expect(201);

    const overlappingStart = new Date(slotDate.getTime() + 10 * 60 * 1000);
    const expertCollision = await request(app.getHttpServer())
      .patch(`/consultations/${expertCollisionRequest.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        status: 'accepted',
        sessionTitle: 'Overlapping unslotted consultation',
        sessionDate: `${overlappingStart.getFullYear()}-${String(overlappingStart.getMonth() + 1).padStart(2, '0')}-${String(overlappingStart.getDate()).padStart(2, '0')}`,
        sessionTime: `${String(overlappingStart.getHours()).padStart(2, '0')}:${String(overlappingStart.getMinutes()).padStart(2, '0')}`,
        sessionDuration: '15 min',
        sessionMeetingLink: 'https://meet.example.com/overlap',
      })
      .expect(400);

    expect(expertCollision.body.message).toContain(
      'wellness expert already has a consultation booked during this time',
    );

    const employeeConsultations = await request(app.getHttpServer())
      .get('/consultations')
      .set('role', 'Employee')
      .query({ employeeId: 'employee-booking-one' })
      .expect(200);

    expect(employeeConsultations.body.find((item) => item.id === unscheduledRequest.body.id).status).toBe('requested');
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
