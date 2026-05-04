import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChallengesModule } from './challenges/challenges.module';
import { RoleHeaderGuard } from './common/guards/role-header.guard';
import { InMemoryDataModule } from './common/data/in-memory-data.module';
import { CheckinResponsesModule } from './checkin-responses/checkin-responses.module';
import { CompaniesModule } from './companies/companies.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { EmployeesModule } from './employees/employees.module';
import { ExpertsModule } from './experts/experts.module';
import { HrProfilesModule } from './hr-profiles/hr-profiles.module';
import { LiveSessionsModule } from './live-sessions/live-sessions.module';
import { OnboardingRequestsModule } from './onboarding-requests/onboarding-requests.module';
import { RewardsModule } from './rewards/rewards.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { VideosModule } from './videos/videos.module';
import { WellnessCheckinsModule } from './wellness-checkins/wellness-checkins.module';

@Module({
  imports: [
    InMemoryDataModule,
    ChallengesModule,
    CheckinResponsesModule,
    CompaniesModule,
    ConsultationsModule,
    EmployeesModule,
    ExpertsModule,
    HrProfilesModule,
    LiveSessionsModule,
    OnboardingRequestsModule,
    RewardsModule,
    RolePermissionsModule,
    VideosModule,
    WellnessCheckinsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RoleHeaderGuard,
    },
  ],
})
export class AppModule {}
