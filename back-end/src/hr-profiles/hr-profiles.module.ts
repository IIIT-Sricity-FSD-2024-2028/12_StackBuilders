import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { HrProfilesController } from './hr-profiles.controller';
import { HrProfilesService } from './hr-profiles.service';

@Module({
  imports: [CompaniesModule],
  controllers: [HrProfilesController],
  providers: [HrProfilesService],
  exports: [HrProfilesService],
})
export class HrProfilesModule {}

