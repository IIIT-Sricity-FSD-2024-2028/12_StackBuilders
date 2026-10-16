import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { HrProfilesModule } from '../hr-profiles/hr-profiles.module';
import { CompanyWorkspacesController } from './company-workspaces.controller';
import { CompanyWorkspacesService } from './company-workspaces.service';

@Module({
  imports: [CompaniesModule, HrProfilesModule],
  controllers: [CompanyWorkspacesController],
  providers: [CompanyWorkspacesService],
})
export class CompanyWorkspacesModule {}
