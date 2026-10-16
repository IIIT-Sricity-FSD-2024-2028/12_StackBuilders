import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { InMemoryDataService } from './../src/common/data/in-memory-data.service';

describe('HR subscription entitlements (e2e)', () => {
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

  async function createCompany() {
    const response = await request(app.getHttpServer())
      .post('/companies')
      .set('role', 'Admin')
      .send({
        name: 'Acme Wellness',
        phone: '9876543210',
        address: 'Bengaluru, Karnataka',
        email: 'company@acmewellness.com',
      })
      .expect(201);

    return response.body;
  }

  it('rejects HR employee and expert creation when there is no subscription', async () => {
    const company = await createCompany();

    await request(app.getHttpServer())
      .post('/employees')
      .set('role', 'HR')
      .send({
        name: 'Alex Employee',
        department: 'Engineering',
        email: 'alex.employee@gmail.com',
        password: 'secure123',
        companyId: company.id,
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/experts')
      .set('role', 'HR')
      .send({
        name: 'Alex Expert',
        specialization: 'Nutritionist',
        experience: '5 years',
        email: 'alex.expert@gmail.com',
        password: 'secure123',
        companyId: company.id,
      })
      .expect(403);

    const employees = await request(app.getHttpServer())
      .get('/employees')
      .set('role', 'Admin')
      .expect(200);
    const experts = await request(app.getHttpServer())
      .get('/experts')
      .set('role', 'Admin')
      .expect(200);

    expect(employees.body).toHaveLength(0);
    expect(experts.body).toHaveLength(0);
  });

  it('allows HR additions after an active company plan is present', async () => {
    const company = await createCompany();
    app.get(InMemoryDataService).subscriptions.push({
      companyId: company.id,
      companyName: company.name,
      planId: 'starter',
      planName: 'Starter',
      status: 'active',
    });

    await request(app.getHttpServer())
      .post('/employees')
      .set('role', 'HR')
      .send({
        name: 'Alex Employee',
        department: 'Engineering',
        email: 'alex.employee@gmail.com',
        password: 'secure123',
        companyId: company.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/experts')
      .set('role', 'HR')
      .send({
        name: 'Alex Expert',
        specialization: 'Nutritionist',
        experience: '5 years',
        email: 'alex.expert@gmail.com',
        password: 'secure123',
        companyId: company.id,
      })
      .expect(201);
  });

  it('does not transfer a deleted company subscription to a replacement with the same name', async () => {
    const company = await createCompany();
    app.get(InMemoryDataService).subscriptions.push({
      companyId: company.id,
      companyName: company.name,
      planId: 'starter',
      planName: 'Starter',
      status: 'active',
    });

    await request(app.getHttpServer())
      .delete(`/companies/${company.id}`)
      .set('role', 'Admin')
      .expect(200);

    const replacementResponse = await request(app.getHttpServer())
      .post('/companies')
      .set('role', 'Admin')
      .send({
        name: company.name,
        phone: '9123456789',
        address: 'Pune, Maharashtra',
        email: 'replacement@acmewellness.com',
      })
      .expect(201);
    const replacement = replacementResponse.body;

    expect(app.get(InMemoryDataService).subscriptions[0]).toMatchObject({
      companyName: company.name,
      status: 'cancelled',
    });

    await request(app.getHttpServer())
      .post('/employees')
      .set('role', 'HR')
      .send({
        name: 'Alex Employee',
        department: 'Engineering',
        email: 'alex.employee@gmail.com',
        password: 'secure123',
        companyId: replacement.id,
        companyName: replacement.name,
      })
      .expect(403);
  });
});
