import { Injectable } from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service';
import { CompanyEntity } from '../companies/entities/company.entity';
import { HrProfileEntity } from '../hr-profiles/entities/hr-profile.entity';
import { HrProfilesService } from '../hr-profiles/hr-profiles.service';
import { CreateCompanyWorkspaceDto } from './dto/create-company-workspace.dto';

@Injectable()
export class CompanyWorkspacesService {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly hrProfilesService: HrProfilesService,
  ) {}

  create(dto: CreateCompanyWorkspaceDto): {
    company: CompanyEntity;
    hrProfile: Omit<HrProfileEntity, 'password'>;
  } {
    const company = this.companiesService.create({
      name: dto.companyName,
      phone: dto.companyPhone,
      address: dto.companyAddress,
      email: dto.companyEmail,
    });

    try {
      const { hrProfile: createdProfile } = this.hrProfilesService.create({
        name: dto.hrName,
        email: dto.hrEmail,
        password: dto.hrPassword,
        phoneNumber: dto.hrPhoneNumber || dto.companyPhone,
        companyId: company.id,
        companyName: company.name,
        status: 'Active',
        createdBySuperUser: true,
      });
      const { password: _password, ...hrProfile } = createdProfile;

      return { company, hrProfile };
    } catch (error) {
      this.companiesService.removeForRollback(company.id);
      throw error;
    }
  }
}
