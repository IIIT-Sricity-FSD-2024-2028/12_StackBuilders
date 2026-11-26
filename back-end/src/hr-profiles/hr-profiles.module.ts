import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { HrProfilesController } from './hr-profiles.controller';
import { HrProfilesService } from './hr-profiles.service';

@Module({
  imports: [AuthModule, CompaniesModule],
  controllers: [HrProfilesController],
  providers: [HrProfilesService],
  exports: [HrProfilesService],
})
export class HrProfilesModule {}

