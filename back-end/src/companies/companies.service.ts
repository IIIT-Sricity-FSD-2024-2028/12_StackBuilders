import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import {
  cleanText,
  formatIndianPhoneNumber,
  formatStoredDate,
  generateSequentialId,
  isValidEmailAddress,
  normalizeEmail,
  normalizeLookupValue,
} from '../common/utils/record.utils';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyEntity } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(private readonly data: InMemoryDataService) {}

  findAll(): CompanyEntity[] {
    return this.data.companies.filter((company) => !company.archivedAt);
  }

  findOne(id: string): CompanyEntity {
    const normalizedId = cleanText(id);
    const company =
      this.data.companies.find((entry) => entry.id === normalizedId) ?? null;

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    return company;
  }

  create(createCompanyDto: CreateCompanyDto): CompanyEntity {
    const preparedCompany = this.prepareCompanyInput(createCompanyDto);
    this.assertCompanyUniqueness(preparedCompany);

    const createdAt = Date.now();
    const company: CompanyEntity = {
      id: generateSequentialId('CMP', this.data.companies),
      name: preparedCompany.name,
      phone: preparedCompany.phone,
      address: preparedCompany.address,
      email: preparedCompany.email,
      createdAt,
      createdLabel: formatStoredDate(createdAt),
    };

    this.data.companies.unshift(company);
    return company;
  }

  update(id: string, updateCompanyDto: UpdateCompanyDto): CompanyEntity {
    const company = this.findOne(id);
    const nextName = Object.prototype.hasOwnProperty.call(updateCompanyDto, 'name')
      ? cleanText(updateCompanyDto.name)
      : company.name;
    const nextPhone = Object.prototype.hasOwnProperty.call(updateCompanyDto, 'phone')
      ? formatIndianPhoneNumber(updateCompanyDto.phone)
      : company.phone;
    const nextAddress = Object.prototype.hasOwnProperty.call(updateCompanyDto, 'address')
      ? cleanText(updateCompanyDto.address)
      : company.address;
    const nextEmail = Object.prototype.hasOwnProperty.call(updateCompanyDto, 'email')
      ? normalizeEmail(updateCompanyDto.email)
      : company.email;

    if (!nextName) {
      throw new BadRequestException('Enter a company name.');
    }

    if (!nextPhone) {
      throw new BadRequestException('Enter a valid Indian phone number.');
    }

    if (!nextAddress) {
      throw new BadRequestException('Enter the company address.');
    }

    if (!nextEmail || !isValidEmailAddress(nextEmail)) {
      throw new BadRequestException('Enter a valid company email address.');
    }

    this.assertCompanyUniqueness(
      {
        name: nextName,
        phone: nextPhone,
        address: nextAddress,
        email: nextEmail,
      },
      company.id,
    );

    const previousCompanyName = company.name;
    company.name = nextName;
    company.phone = nextPhone;
    company.address = nextAddress;
    company.email = nextEmail;

    this.data.hrProfiles.forEach((profile) => {
      if (!this.isLinkedToCompany(profile, { ...company, name: previousCompanyName })) {
        return;
      }

      profile.companyId = company.id;
      profile.companyName = company.name;
      profile.updatedAt = new Date().toISOString();
    });

    return company;
  }

  remove(id: string): CompanyEntity {
    const company = this.findOne(id);
    if (company.archivedAt) return company;

    company.archivedAt = new Date().toISOString();
    this.removeLinkedAccounts(company);
    this.cancelLinkedSubscriptions(company);

    return company;
  }

  removeForRollback(id: string): void {
    const companyIndex = this.data.companies.findIndex((entry) => entry.id === id);
    if (companyIndex >= 0) {
      this.data.companies.splice(companyIndex, 1);
    }
  }

  private prepareCompanyInput(createCompanyDto: CreateCompanyDto) {
    const name = cleanText(createCompanyDto.name);
    const phone = formatIndianPhoneNumber(createCompanyDto.phone);
    const address = cleanText(createCompanyDto.address);
    const email = normalizeEmail(createCompanyDto.email);

    if (!name) {
      throw new BadRequestException('Enter a company name.');
    }

    if (!phone) {
      throw new BadRequestException('Enter a valid Indian phone number.');
    }

    if (!address) {
      throw new BadRequestException('Enter the company address.');
    }

    if (!email || !isValidEmailAddress(email)) {
      throw new BadRequestException('Enter a valid company email address.');
    }

    return { name, phone, address, email };
  }

  private assertCompanyUniqueness(
    company: Pick<CompanyEntity, 'name' | 'phone' | 'address' | 'email'>,
    ignoreCompanyId?: string,
  ): void {
    const companies = this.findAll().filter(
      (entry) => entry.id !== cleanText(ignoreCompanyId),
    );

    if (
      companies.some(
        (entry) =>
          normalizeLookupValue(entry.name) === normalizeLookupValue(company.name),
      )
    ) {
      throw new BadRequestException('A company with this name already exists.');
    }

    if (
      companies.some(
        (entry) =>
          normalizeLookupValue(entry.email) === normalizeLookupValue(company.email),
      )
    ) {
      throw new BadRequestException(
        'This company email is already used by another company.',
      );
    }

    if (
      companies.some(
        (entry) =>
          normalizeLookupValue(
            formatIndianPhoneNumber(entry.phone) ?? entry.phone,
          ) === normalizeLookupValue(company.phone),
      )
    ) {
      throw new BadRequestException(
        'This phone number is already linked to another company.',
      );
    }
  }

  private removeLinkedAccounts(company: CompanyEntity): void {
    const accountCollections = [
      this.data.hrProfiles,
      this.data.employees,
      this.data.experts,
    ];

    accountCollections.forEach((accounts) => {
      for (let index = accounts.length - 1; index >= 0; index -= 1) {
        if (this.isLinkedToCompany(accounts[index], company)) {
          accounts.splice(index, 1);
        }
      }
    });
  }

  private cancelLinkedSubscriptions(company: CompanyEntity): void {
    this.data.subscriptions.forEach((subscription) => {
      if (this.isLinkedToCompany(subscription, company)) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date().toISOString();
      }
    });
  }

  private isLinkedToCompany(
    record: { companyId?: string; companyName?: string },
    company: CompanyEntity,
  ): boolean {
    const recordCompanyId = cleanText(record.companyId);
    if (recordCompanyId) return recordCompanyId === cleanText(company.id);

    return (
      normalizeLookupValue(record.companyName) ===
      normalizeLookupValue(company.name)
    );
  }
}
