import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Admin onboarding workflows (e2e)', () => {
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

  it('creates and approves a company onboarding request', async () => {
    const createRequestResponse = await request(app.getHttpServer())
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

    expect(createRequestResponse.body).toMatchObject({
      companyName: 'Stack Builders Pvt Ltd',
      companyPhone: '+91 98765 43210',
      companyEmail: 'contact@stackbuilders.com',
      hrEmail: 'priya.sharma@gmail.com',
      status: 'pending',
    });

    await request(app.getHttpServer())
      .get('/company-onboarding-requests')
      .expect(403);

    const listRequestsResponse = await request(app.getHttpServer())
      .get('/company-onboarding-requests')
      .set('role', 'Admin')
      .expect(200);

    expect(listRequestsResponse.body).toHaveLength(1);

    const requestId = createRequestResponse.body.id;

    const approveResponse = await request(app.getHttpServer())
      .post(`/company-onboarding-requests/${requestId}/approve`)
      .set('role', 'Admin')
      .expect(201);

    expect(approveResponse.body).toMatchObject({
      removedRequestId: requestId,
      company: {
        id: 'CMP-1001',
        name: 'Stack Builders Pvt Ltd',
        phone: '+91 98765 43210',
        email: 'contact@stackbuilders.com',
      },
      hrProfile: {
        name: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        companyId: 'CMP-1001',
        companyName: 'Stack Builders Pvt Ltd',
      },
    });

    const companiesResponse = await request(app.getHttpServer())
      .get('/companies')
      .set('role', 'Admin')
      .expect(200);

    expect(companiesResponse.body).toHaveLength(1);
    expect(companiesResponse.body[0]).toMatchObject({
      id: 'CMP-1001',
      name: 'Stack Builders Pvt Ltd',
    });

    const hrProfilesResponse = await request(app.getHttpServer())
      .get('/hr-profiles')
      .set('role', 'Admin')
      .expect(200);

    expect(hrProfilesResponse.body).toHaveLength(1);
    expect(hrProfilesResponse.body[0]).toMatchObject({
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      companyId: 'CMP-1001',
    });
  });

  it('allows an admin to reject and remove a pending company request', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/company-onboarding-requests')
      .send({
        companyName: 'Rejected Example Pvt Ltd',
        companyPhone: '9876543210',
        companyAddress: 'Bengaluru, Karnataka',
        companyEmail: 'contact@rejected-example.com',
        hrName: 'Riya Sharma',
        hrPhoneNumber: '9876543210',
        hrEmail: 'riya.rejected@gmail.com',
        hrPassword: 'secure123',
      })
      .expect(201);

    const requestId = createResponse.body.id;

    await request(app.getHttpServer())
      .delete(`/company-onboarding-requests/${requestId}`)
      .set('role', 'Admin')
      .expect(200);

    const listResponse = await request(app.getHttpServer())
      .get('/company-onboarding-requests')
      .set('role', 'Admin')
      .expect(200);

    expect(listResponse.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: requestId })]),
    );
  });
});
