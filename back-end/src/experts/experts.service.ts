import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HARDCODED_SUPER_ADMIN_EMAIL } from '../common/constants/super-admin';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import {
  cleanText,
  createPrefixedRecordId,
  formatIndianPhoneNumber,
  isValidGmailAddress,
  isValidPassword,
  normalizeEmail,
  normalizeLookupValue,
} from '../common/utils/record.utils';
import { CompaniesService } from '../companies/companies.service';
import { CreateExpertDto } from './dto/create-expert.dto';
import { UpdateExpertDto } from './dto/update-expert.dto';
import { ExpertEntity } from './entities/expert.entity';

@Injectable()
export class ExpertsService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
  ) {}

  findAll(filters?: {
    email?: string;
    companyId?: string;
    companyName?: string;
    status?: string;
    specialization?: string;
  }): ExpertEntity[] {
    let experts = [...this.data.experts];

    if (filters?.email) {
      const normalizedEmail = normalizeEmail(filters.email);
      experts = experts.filter((expert) => expert.email === normalizedEmail);
    }

    if (filters?.companyId) {
      const normalizedCompanyId = cleanText(filters.companyId);
      experts = experts.filter(
        (expert) => cleanText(expert.companyId) === normalizedCompanyId,
      );
    }

    if (filters?.companyName) {
      const normalizedCompanyName = normalizeLookupValue(filters.companyName);
      experts = experts.filter(
        (expert) =>
          normalizeLookupValue(expert.companyName) === normalizedCompanyName,
      );
    }

    if (filters?.status) {
      const normalizedStatus = normalizeLookupValue(filters.status);
      experts = experts.filter(
        (expert) => normalizeLookupValue(expert.status) === normalizedStatus,
      );
    }

    if (filters?.specialization) {
      const normalizedSpecialization = normalizeLookupValue(
        filters.specialization,
      );
      experts = experts.filter(
        (expert) =>
          normalizeLookupValue(expert.specialization) ===
          normalizedSpecialization,
      );
    }

    return experts;
  }

  findOne(id: string): ExpertEntity {
    const normalizedId = cleanText(id);
    const expert =
      this.data.experts.find((entry) => entry.id === normalizedId) ?? null;

    if (!expert) {
      throw new NotFoundException('Wellness expert not found.');
    }

    return expert;
  }

  create(createExpertDto: CreateExpertDto): ExpertEntity {
    const company = this.resolveCompanyReference(
      createExpertDto.companyId,
      createExpertDto.companyName,
    );
    const preparedExpert = this.prepareCreateInput(createExpertDto, company);
    this.assertEmailIsAvailable(preparedExpert.email);

    const expert: ExpertEntity = {
      id: createPrefixedRecordId('expert'),
      name: preparedExpert.name,
      email: preparedExpert.email,
      username: preparedExpert.email,
      password: preparedExpert.password,
      specialization: preparedExpert.specialization,
      experience: preparedExpert.experience,
      phoneNumber: preparedExpert.phoneNumber,
      companyId: preparedExpert.companyId,
      companyName: preparedExpert.companyName,
      status: preparedExpert.status,
      createdAt: preparedExpert.createdAt,
      updatedAt: preparedExpert.updatedAt,
    };

    this.data.experts.unshift(expert);
    return expert;
  }

  update(id: string, updateExpertDto: UpdateExpertDto): ExpertEntity {
    const currentExpert = this.findOne(id);
    const hasCompanyId =
      Object.prototype.hasOwnProperty.call(updateExpertDto, 'companyId');
    const hasCompanyName =
      Object.prototype.hasOwnProperty.call(updateExpertDto, 'companyName');
    const nextCompany = hasCompanyId || hasCompanyName
      ? this.resolveCompanyReference(
          hasCompanyId ? updateExpertDto.companyId : currentExpert.companyId,
          hasCompanyName ? updateExpertDto.companyName : currentExpert.companyName,
        )
      : this.resolveCompanyReference(
          currentExpert.companyId,
          currentExpert.companyName,
        );
    const nextEmail = Object.prototype.hasOwnProperty.call(updateExpertDto, 'email')
      ? normalizeEmail(updateExpertDto.email)
      : currentExpert.email;
    const nextName = Object.prototype.hasOwnProperty.call(updateExpertDto, 'name')
      ? cleanText(updateExpertDto.name)
      : currentExpert.name;
    const nextSpecialization = Object.prototype.hasOwnProperty.call(
      updateExpertDto,
      'specialization',
    )
      ? cleanText(updateExpertDto.specialization)
      : currentExpert.specialization;
    const nextExperience = Object.prototype.hasOwnProperty.call(
      updateExpertDto,
      'experience',
    )
      ? this.normalizeExperience(updateExpertDto.experience)
      : currentExpert.experience;
    const nextPassword = Object.prototype.hasOwnProperty.call(
      updateExpertDto,
      'password',
    )
      ? cleanText(updateExpertDto.password)
      : currentExpert.password;
    const nextPhoneNumber = Object.prototype.hasOwnProperty.call(
      updateExpertDto,
      'phoneNumber',
    )
      ? this.normalizeOptionalPhoneNumber(updateExpertDto.phoneNumber)
      : currentExpert.phoneNumber;
    const nextStatus = Object.prototype.hasOwnProperty.call(updateExpertDto, 'status')
      ? cleanText(updateExpertDto.status)
      : currentExpert.status;

    if (!nextName) {
      throw new BadRequestException('Wellness expert name cannot be blank.');
    }

    if (!nextSpecialization) {
      throw new BadRequestException(
        'Choose a specialization for the wellness expert.',
      );
    }

    if (!nextEmail || !isValidGmailAddress(nextEmail)) {
      throw new BadRequestException(
        'Enter a valid Gmail address for the wellness expert.',
      );
    }

    if (!nextPassword || !isValidPassword(nextPassword)) {
      throw new BadRequestException(
        'Wellness expert password must be at least 6 characters long.',
      );
    }

    if (
      this.data.experts.some(
        (expert) => expert.id !== currentExpert.id && expert.email === nextEmail,
      )
    ) {
      throw new BadRequestException(
        'Another wellness expert already uses that email address.',
      );
    }

    this.assertEmailIsAvailable(nextEmail, currentExpert.id);

    currentExpert.name = nextName;
    currentExpert.email = nextEmail;
    currentExpert.username = nextEmail;
    currentExpert.password = nextPassword;
    currentExpert.specialization = nextSpecialization;
    currentExpert.experience = nextExperience;
    currentExpert.phoneNumber = nextPhoneNumber;
    currentExpert.companyId = nextCompany.id;
    currentExpert.companyName = nextCompany.name;
    currentExpert.status = nextStatus || 'Active';
    currentExpert.updatedAt = new Date().toISOString();

    return currentExpert;
  }

  remove(id: string): ExpertEntity {
    const expert = this.findOne(id);
    const expertIndex = this.data.experts.findIndex(
      (entry) => entry.id === expert.id,
    );

    this.data.experts.splice(expertIndex, 1);
    return expert;
  }

  private prepareCreateInput(
    createExpertDto: CreateExpertDto,
    company: { id: string; name: string },
  ) {
    const name = cleanText(createExpertDto.name);
    const specialization = cleanText(createExpertDto.specialization);
    const experience = this.normalizeExperience(createExpertDto.experience);
    const email = normalizeEmail(createExpertDto.email);
    const password = cleanText(createExpertDto.password);
    const phoneNumber = this.normalizeOptionalPhoneNumber(
      createExpertDto.phoneNumber,
    );
    const status = cleanText(createExpertDto.status) || 'Active';
    const now = new Date().toISOString();

    if (!name || !specialization || !experience || !email || !password) {
      throw new BadRequestException(
        'Please complete all wellness expert fields before saving.',
      );
    }

    if (!isValidGmailAddress(email)) {
      throw new BadRequestException(
        'Enter a valid Gmail address for the wellness expert.',
      );
    }

    if (!isValidPassword(password)) {
      throw new BadRequestException(
        'Wellness expert password must be at least 6 characters long.',
      );
    }

    return {
      name,
      specialization,
      experience,
      email,
      password,
      phoneNumber,
      companyId: company.id,
      companyName: company.name,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }

  private resolveCompanyReference(companyId?: string, companyName?: string) {
    const normalizedCompanyId = cleanText(companyId);
    const normalizedCompanyName = normalizeLookupValue(companyName);
    const companies = this.companiesService.findAll();
    const company =
      companies.find(
        (entry) => normalizedCompanyId && entry.id === normalizedCompanyId,
      ) ??
      companies.find(
        (entry) =>
          normalizedCompanyName &&
          normalizeLookupValue(entry.name) === normalizedCompanyName,
      ) ??
      null;

    if (!company) {
      throw new BadRequestException(
        'Select a valid company name that already exists.',
      );
    }

    return company;
  }

  private assertEmailIsAvailable(email: string, ignoreExpertId?: string): void {
    if (email === normalizeEmail(HARDCODED_SUPER_ADMIN_EMAIL)) {
      throw new BadRequestException(
        'That email address is already assigned to the super user account.',
      );
    }

    if (this.data.hrProfiles.some((profile) => profile.email === email)) {
      throw new BadRequestException(
        'That email address is already assigned to an HR account.',
      );
    }

    if (this.data.employees.some((employee) => employee.email === email)) {
      throw new BadRequestException(
        'That email address is already assigned to an employee account.',
      );
    }

    if (
      this.data.experts.some(
        (expert) =>
          expert.id !== cleanText(ignoreExpertId) && expert.email === email,
      )
    ) {
      throw new BadRequestException(
        'A wellness expert with that email already exists.',
      );
    }
  }

  private normalizeExperience(value: unknown): string {
    const raw = cleanText(value);
    if (!raw) {
      return '';
    }

    const match = raw.match(/^(\d+(?:\.\d+)?)(?:\s*(?:years?|yrs?))?$/i);
    const parsed = match ? Number(match[1]) : Number.NaN;

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 60) {
      throw new BadRequestException(
        'Experience must be a number between 0 and 60 years.',
      );
    }

    return raw;
  }

  private normalizeOptionalPhoneNumber(value: unknown): string {
    const rawPhoneNumber = cleanText(value);
    if (!rawPhoneNumber) {
      return '';
    }

    const formattedPhoneNumber = formatIndianPhoneNumber(rawPhoneNumber);
    if (!formattedPhoneNumber) {
      throw new BadRequestException('Enter a valid Indian phone number.');
    }

    return formattedPhoneNumber;
  }
}

