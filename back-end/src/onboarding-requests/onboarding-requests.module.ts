import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { HrProfilesModule } from '../hr-profiles/hr-profiles.module';
import { OnboardingRequestsController } from './onboarding-requests.controller';
import { OnboardingRequestsService } from './onboarding-requests.service';

@Module({
  imports: [AuthModule, CompaniesModule, HrProfilesModule],
  controllers: [OnboardingRequestsController],
  providers: [OnboardingRequestsService],
})
export class OnboardingRequestsModule {}

