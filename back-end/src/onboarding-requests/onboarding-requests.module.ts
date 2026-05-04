import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { HrProfilesModule } from '../hr-profiles/hr-profiles.module';
import { OnboardingRequestsController } from './onboarding-requests.controller';
import { OnboardingRequestsService } from './onboarding-requests.service';

@Module({
  imports: [CompaniesModule, HrProfilesModule],
  controllers: [OnboardingRequestsController],
  providers: [OnboardingRequestsService],
})
export class OnboardingRequestsModule {}

