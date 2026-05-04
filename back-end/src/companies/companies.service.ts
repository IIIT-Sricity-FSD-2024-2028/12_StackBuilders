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
    return [...this.data.companies];
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
      const profileCompanyMatches =
        profile.companyId === company.id ||
        normalizeLookupValue(profile.companyName) ===
          normalizeLookupValue(previousCompanyName);

      if (!profileCompanyMatches) {
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
    const companyIndex = this.data.companies.findIndex(
      (entry) => entry.id === company.id,
    );

    this.removeLinkedHrProfiles(company);
    this.data.companies.splice(companyIndex, 1);

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
    const companies = this.data.companies.filter(
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

  private removeLinkedHrProfiles(company: CompanyEntity): void {
    for (let index = this.data.hrProfiles.length - 1; index >= 0; index -= 1) {
      const profile = this.data.hrProfiles[index];
      const linkedById = cleanText(profile.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(profile.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.hrProfiles.splice(index, 1);
      }
    }

    for (let index = this.data.employees.length - 1; index >= 0; index -= 1) {
      const employee = this.data.employees[index];
      const linkedById = cleanText(employee.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(employee.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.employees.splice(index, 1);
      }
    }

    for (let index = this.data.experts.length - 1; index >= 0; index -= 1) {
      const expert = this.data.experts[index];
      const linkedById = cleanText(expert.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(expert.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.experts.splice(index, 1);
      }
    }

    for (let index = this.data.consultations.length - 1; index >= 0; index -= 1) {
      const consultation = this.data.consultations[index];
      const linkedById =
        cleanText(consultation.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(consultation.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.consultations.splice(index, 1);
      }
    }

    for (let index = this.data.wellnessCheckins.length - 1; index >= 0; index -= 1) {
      const checkin = this.data.wellnessCheckins[index];
      const linkedById = cleanText(checkin.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(checkin.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.wellnessCheckins.splice(index, 1);
      }
    }

    for (let index = this.data.checkinResponses.length - 1; index >= 0; index -= 1) {
      const response = this.data.checkinResponses[index];
      const linkedById = cleanText(response.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(response.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.checkinResponses.splice(index, 1);
      }
    }

    for (let index = this.data.liveSessions.length - 1; index >= 0; index -= 1) {
      const session = this.data.liveSessions[index];
      const linkedById = cleanText(session.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(session.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.liveSessions.splice(index, 1);
      }
    }

    for (let index = this.data.videos.length - 1; index >= 0; index -= 1) {
      const video = this.data.videos[index];
      const linkedById = cleanText(video.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(video.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.videos.splice(index, 1);
      }
    }

    for (let index = this.data.challenges.length - 1; index >= 0; index -= 1) {
      const challenge = this.data.challenges[index];
      const linkedById = cleanText(challenge.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(challenge.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.challenges.splice(index, 1);
      }
    }

    for (let index = this.data.rewards.length - 1; index >= 0; index -= 1) {
      const reward = this.data.rewards[index];
      const linkedById = cleanText(reward.companyId) === cleanText(company.id);
      const linkedByName =
        normalizeLookupValue(reward.companyName) ===
        normalizeLookupValue(company.name);

      if (linkedById || linkedByName) {
        this.data.rewards.splice(index, 1);
      }
    }
  }
}
