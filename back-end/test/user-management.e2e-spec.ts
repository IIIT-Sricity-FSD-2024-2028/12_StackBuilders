import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Employee and expert user management (e2e)', () => {
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

  it('creates employee and expert records with role-based access', async () => {
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
        age: '28',
        gender: 'Male',
        phoneNumber: '9876543210',
        heightCm: '175',
        weightKg: '72',
      })
      .expect(201);

    expect(employeeResponse.body).toMatchObject({
      name: 'Aarav Sharma',
      department: 'Engineering',
      email: 'aarav.sharma@gmail.com',
      companyId: 'CMP-1001',
      companyName: 'Stack Builders Pvt Ltd',
      age: '28',
      heightCm: '175',
      weightKg: '72',
    });

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
        phoneNumber: '9876543210',
      })
      .expect(201);

    expect(expertResponse.body).toMatchObject({
      name: 'Neha Verma',
      specialization: 'Nutritionist',
      experience: '5',
      email: 'neha.verma@gmail.com',
      companyId: 'CMP-1001',
      companyName: 'Stack Builders Pvt Ltd',
    });

    await request(app.getHttpServer())
      .get('/experts')
      .set('role', 'Employee')
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].email).toBe('neha.verma@gmail.com');
      });

    await request(app.getHttpServer())
      .get('/employees')
      .set('role', 'Employee')
      .expect(403);

    const updatedEmployeeResponse = await request(app.getHttpServer())
      .patch(`/employees/${employeeResponse.body.id}`)
      .set('role', 'Employee')
      .send({
        heightCm: '176',
        weightKg: '73',
      })
      .expect(200);

    expect(updatedEmployeeResponse.body.heightCm).toBe('176');
    expect(updatedEmployeeResponse.body.weightKg).toBe('73');

    const updatedExpertResponse = await request(app.getHttpServer())
      .patch(`/experts/${expertResponse.body.id}`)
      .set('role', 'Wellness Expert')
      .send({
        experience: '6',
      })
      .expect(200);

    expect(updatedExpertResponse.body.experience).toBe('6');

    await request(app.getHttpServer())
      .post('/employees')
      .set('role', 'HR')
      .send({
        name: 'Duplicate Employee',
        department: 'Engineering',
        email: 'neha.verma@gmail.com',
        password: 'secure123',
        companyId: 'CMP-1001',
      })
      .expect(400);
  });
});
