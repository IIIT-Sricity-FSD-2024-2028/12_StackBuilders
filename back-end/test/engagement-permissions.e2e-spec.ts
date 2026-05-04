import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Challenges, rewards, and role permissions (e2e)', () => {
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

  it('supports HR challenge/reward workflows and admin role-permission updates', async () => {
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

    const approvalResponse = await request(app.getHttpServer())
      .post(`/company-onboarding-requests/${onboardingResponse.body.id}/approve`)
      .set('role', 'Admin')
      .expect(201);

    const challengeResponse = await request(app.getHttpServer())
      .post('/challenges')
      .set('role', 'HR')
      .send({
        name: '10k Step Sprint',
        type: 'Fitness',
        reward: 'Gift voucher',
        deadline: '2099-12-31',
        goal: 'Complete 10,000 steps for 7 days.',
        companyId: approvalResponse.body.company.id,
        creatorHrId: approvalResponse.body.hrProfile.id,
      })
      .expect(201);

    expect(challengeResponse.body).toMatchObject({
      name: '10k Step Sprint',
      type: 'Fitness',
      companyId: approvalResponse.body.company.id,
    });

    const employeeChallengeList = await request(app.getHttpServer())
      .get('/challenges')
      .set('role', 'Employee')
      .query({
        companyId: approvalResponse.body.company.id,
      })
      .expect(200);

    expect(employeeChallengeList.body).toHaveLength(1);

    const rewardResponse = await request(app.getHttpServer())
      .post('/rewards')
      .set('role', 'HR')
      .send({
        imageUrl: 'https://example.com/reward.png',
        name: 'Amazon Voucher',
        description: 'Redeem this reward after completing the challenge.',
        points: '500',
        claimableCount: '10',
        companyId: approvalResponse.body.company.id,
        creatorHrId: approvalResponse.body.hrProfile.id,
      })
      .expect(201);

    expect(rewardResponse.body).toMatchObject({
      name: 'Amazon Voucher',
      claimableCount: '10',
      claimedCount: '0',
      companyId: approvalResponse.body.company.id,
    });

    const employeeRewardList = await request(app.getHttpServer())
      .get('/rewards')
      .set('role', 'Employee')
      .query({
        companyId: approvalResponse.body.company.id,
      })
      .expect(200);

    expect(employeeRewardList.body).toHaveLength(1);

    const defaultHrPermissions = await request(app.getHttpServer())
      .get('/role-permissions/hr')
      .set('role', 'Admin')
      .expect(200);

    expect(defaultHrPermissions.body.permissions['challenge-management-create']).toBe(
      false,
    );

    const updatedHrPermissions = await request(app.getHttpServer())
      .put('/role-permissions/hr')
      .set('role', 'Admin')
      .send({
        permissions: {
          'challenge-management-create': true,
          'user-management-delete': true,
        },
      })
      .expect(200);

    expect(updatedHrPermissions.body.permissions['challenge-management-create']).toBe(
      true,
    );
    expect(updatedHrPermissions.body.permissions['user-management-delete']).toBe(
      true,
    );

    const hrPermissionRead = await request(app.getHttpServer())
      .get('/role-permissions/hr')
      .set('role', 'HR')
      .expect(200);

    expect(hrPermissionRead.body.permissions['challenge-management-create']).toBe(
      true,
    );

    await request(app.getHttpServer())
      .get('/role-permissions/employee')
      .set('role', 'HR')
      .expect(403);

    const resetHrPermissions = await request(app.getHttpServer())
      .delete('/role-permissions/hr')
      .set('role', 'Admin')
      .expect(200);

    expect(resetHrPermissions.body.permissions['challenge-management-create']).toBe(
      false,
    );
  });
});
