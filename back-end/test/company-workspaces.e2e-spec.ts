import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Company workspace provisioning (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a company and its initial HR profile in one request', async () => {
    const payload = {
      companyName: 'Northstar Wellness Pvt Ltd',
      companyPhone: '9876543210',
      companyAddress: 'Bengaluru, Karnataka',
      companyEmail: 'contact@northstarwellness.com',
      hrName: 'Priya Sharma',
      hrPhoneNumber: '9123456780',
      hrEmail: 'priya.northstar@gmail.com',
      hrPassword: 'secure123',
    };

    await request(app.getHttpServer())
      .post('/companies/with-hr')
      .send(payload)
      .expect(403);

    const provisionResponse = await request(app.getHttpServer())
      .post('/companies/with-hr')
      .set('role', 'Admin')
      .send(payload)
      .expect(201);

    expect(provisionResponse.body).toMatchObject({
      company: {
        id: 'CMP-1001',
        name: payload.companyName,
        email: payload.companyEmail,
      },
      hrProfile: {
        name: payload.hrName,
        email: payload.hrEmail,
        companyId: 'CMP-1001',
        companyName: payload.companyName,
        status: 'Active',
      },
    });
    expect(provisionResponse.body.hrProfile).not.toHaveProperty('password');

    const [companies, hrProfiles] = await Promise.all([
      request(app.getHttpServer())
        .get('/companies')
        .set('role', 'Admin')
        .expect(200),
      request(app.getHttpServer())
        .get('/hr-profiles')
        .set('role', 'Admin')
        .expect(200),
    ]);

    expect(companies.body).toHaveLength(1);
    expect(hrProfiles.body).toHaveLength(1);
    expect(hrProfiles.body[0]).toMatchObject({
      email: payload.hrEmail,
      companyId: 'CMP-1001',
    });
  });

  it('does not leave a company behind if the HR email is already taken', async () => {
    const existingCompany = await request(app.getHttpServer())
      .post('/companies')
      .set('role', 'Admin')
      .send({
        name: 'Existing Workspace Pvt Ltd',
        phone: '9876543210',
        address: 'Bengaluru, Karnataka',
        email: 'contact@existingworkspace.com',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/hr-profiles')
      .set('role', 'Admin')
      .send({
        name: 'Existing HR',
        email: 'taken.account@gmail.com',
        password: 'secure123',
        companyId: existingCompany.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/companies/with-hr')
      .set('role', 'Admin')
      .send({
        companyName: 'New Workspace Pvt Ltd',
        companyPhone: '9123456780',
        companyAddress: 'Mysuru, Karnataka',
        companyEmail: 'contact@newworkspace.com',
        hrName: 'New HR',
        hrEmail: 'taken.account@gmail.com',
        hrPassword: 'secure123',
      })
      .expect(400);

    const [companies, hrProfiles] = await Promise.all([
      request(app.getHttpServer())
        .get('/companies')
        .set('role', 'Admin')
        .expect(200),
      request(app.getHttpServer())
        .get('/hr-profiles')
        .set('role', 'Admin')
        .expect(200),
    ]);

    expect(companies.body).toHaveLength(1);
    expect(companies.body[0].name).toBe('Existing Workspace Pvt Ltd');
    expect(hrProfiles.body).toHaveLength(1);
  });
});
