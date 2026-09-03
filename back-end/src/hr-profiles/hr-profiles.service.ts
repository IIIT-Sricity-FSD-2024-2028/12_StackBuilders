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
import { CreateHrProfileDto } from './dto/create-hr-profile.dto';
import { UpdateHrProfileDto } from './dto/update-hr-profile.dto';
import { HrProfileEntity } from './entities/hr-profile.entity';

const HR_PROFILE_DEFAULTS = {
  phoneNumber: '',
  department: 'HR',
  designation: 'HR Admin',
  location: '',
  companyId: '',
  companyName: '',
  status: 'Active',
  createdBySuperUser: true,
};

@Injectable()
export class HrProfilesService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
  ) {}

  findAll(filters?: {
    email?: string;
    companyId?: string;
    companyName?: string;
  }): HrProfileEntity[] {
    let profiles = [...this.data.hrProfiles];

    if (filters?.email) {
      const normalizedEmail = normalizeEmail(filters.email);
      profiles = profiles.filter((profile) => profile.email === normalizedEmail);
    }

    if (filters?.companyId) {
      const normalizedCompanyId = cleanText(filters.companyId);
      profiles = profiles.filter(
        (profile) => cleanText(profile.companyId) === normalizedCompanyId,
      );
    }

    if (filters?.companyName) {
      const normalizedCompanyName = normalizeLookupValue(filters.companyName);
      profiles = profiles.filter(
        (profile) =>
          normalizeLookupValue(profile.companyName) === normalizedCompanyName,
      );
    }

    return profiles.map((profile) => this.applyLockedRoleDetails(profile));
  }

  findOne(id: string): HrProfileEntity {
    const normalizedId = cleanText(id);
    const profile =
      this.data.hrProfiles.find((entry) => entry.id === normalizedId) ?? null;

    if (!profile) {
      throw new NotFoundException('HR profile not found.');
    }

    return this.applyLockedRoleDetails(profile);
  }

  create(createHrProfileDto: CreateHrProfileDto): {
    hrProfile: HrProfileEntity;
    replacedProfiles: HrProfileEntity[];
  } {
    const company = this.resolveCompanyReference(
      createHrProfileDto.companyId,
      createHrProfileDto.companyName,
    );
    const preparedProfile = this.prepareCreateInput(createHrProfileDto, company);
    this.assertEmailIsAvailable(preparedProfile.email);

    const replacedProfiles = this.removeProfilesLinkedToCompany(
      preparedProfile.companyId,
      preparedProfile.companyName,
    );

    const hrProfile: HrProfileEntity = {
      id: createPrefixedRecordId('hr'),
      name: preparedProfile.name,
      email: preparedProfile.email,
      username: preparedProfile.email,
      phoneNumber: preparedProfile.phoneNumber,
      department: preparedProfile.department,
      designation: preparedProfile.designation,
      location: preparedProfile.location,
      companyId: preparedProfile.companyId,
      companyName: preparedProfile.companyName,
      status: preparedProfile.status,
      createdBySuperUser: preparedProfile.createdBySuperUser,
      password: preparedProfile.password,
      createdAt: preparedProfile.createdAt,
      updatedAt: preparedProfile.updatedAt,
    };

    this.data.hrProfiles.unshift(hrProfile);

    return {
      hrProfile,
      replacedProfiles,
    };
  }

  update(id: string, updateHrProfileDto: UpdateHrProfileDto): HrProfileEntity {
    const currentProfile = this.findOne(id);
    const hasCompanyId =
      Object.prototype.hasOwnProperty.call(updateHrProfileDto, 'companyId');
    const hasCompanyName =
      Object.prototype.hasOwnProperty.call(updateHrProfileDto, 'companyName');

    const nextCompany = hasCompanyId || hasCompanyName
      ? this.resolveCompanyReference(
          hasCompanyId ? updateHrProfileDto.companyId : currentProfile.companyId,
          hasCompanyName
            ? updateHrProfileDto.companyName
            : currentProfile.companyName,
        )
      : this.resolveCompanyReference(
          currentProfile.companyId,
          currentProfile.companyName,
        );

    const nextEmail = Object.prototype.hasOwnProperty.call(updateHrProfileDto, 'email')
      ? normalizeEmail(updateHrProfileDto.email)
      : currentProfile.email;
    const nextName = Object.prototype.hasOwnProperty.call(updateHrProfileDto, 'name')
      ? cleanText(updateHrProfileDto.name)
      : currentProfile.name;
    const nextPassword = Object.prototype.hasOwnProperty.call(
      updateHrProfileDto,
      'password',
    )
      ? cleanText(updateHrProfileDto.password)
      : currentProfile.password;
    const nextPhoneNumber = Object.prototype.hasOwnProperty.call(
      updateHrProfileDto,
      'phoneNumber',
    )
      ? this.normalizeOptionalPhoneNumber(updateHrProfileDto.phoneNumber)
      : currentProfile.phoneNumber;
    const nextDepartment = HR_PROFILE_DEFAULTS.department;
    const nextDesignation = HR_PROFILE_DEFAULTS.designation;
    const nextLocation = Object.prototype.hasOwnProperty.call(
      updateHrProfileDto,
      'location',
    )
      ? cleanText(updateHrProfileDto.location)
      : currentProfile.location;
    const nextStatus = Object.prototype.hasOwnProperty.call(
      updateHrProfileDto,
      'status',
    )
      ? cleanText(updateHrProfileDto.status)
      : currentProfile.status;
    const nextCreatedBySuperUser = Object.prototype.hasOwnProperty.call(
      updateHrProfileDto,
      'createdBySuperUser',
    )
      ? Boolean(updateHrProfileDto.createdBySuperUser)
      : currentProfile.createdBySuperUser;

    if (!nextName) {
      throw new BadRequestException(
        'Please fill in the required HR details before submitting your request.',
      );
    }

    if (!nextEmail || !isValidGmailAddress(nextEmail)) {
      throw new BadRequestException(
        'Use a valid Gmail address for the HR login email.',
      );
    }

    if (nextEmail === normalizeEmail(HARDCODED_SUPER_ADMIN_EMAIL)) {
      throw new BadRequestException(
        'That HR email is already used by another account.',
      );
    }

    if (!nextPassword || !isValidPassword(nextPassword)) {
      throw new BadRequestException(
        'HR password must be at least 6 characters long.',
      );
    }

    if (
      this.data.hrProfiles.some(
        (profile) => profile.id !== currentProfile.id && profile.email === nextEmail,
      )
    ) {
      throw new BadRequestException(
        'That HR email is already used by another account.',
      );
    }

    if (
      this.data.hrProfiles.some(
        (profile) =>
          profile.id !== currentProfile.id &&
          profile.companyId === nextCompany.id,
      )
    ) {
      throw new BadRequestException(
        'Another HR account already has access to this company.',
      );
    }

    currentProfile.name = nextName;
    currentProfile.email = nextEmail;
    currentProfile.username = nextEmail;
    currentProfile.password = nextPassword;
    currentProfile.phoneNumber = nextPhoneNumber;
    currentProfile.department = nextDepartment;
    currentProfile.designation = nextDesignation;
    currentProfile.location = nextLocation;
    currentProfile.companyId = nextCompany.id;
    currentProfile.companyName = nextCompany.name;
    currentProfile.status = nextStatus || HR_PROFILE_DEFAULTS.status;
    currentProfile.createdBySuperUser = nextCreatedBySuperUser;
    currentProfile.updatedAt = new Date().toISOString();

    return currentProfile;
  }

  remove(id: string): HrProfileEntity {
    const profile = this.findOne(id);
    const profileIndex = this.data.hrProfiles.findIndex(
      (entry) => entry.id === profile.id,
    );

    this.data.hrProfiles.splice(profileIndex, 1);
    return profile;
  }

  private prepareCreateInput(
    createHrProfileDto: CreateHrProfileDto,
    company: { id: string; name: string },
  ) {
    const name = cleanText(createHrProfileDto.name);
    const email = normalizeEmail(createHrProfileDto.email);
    const password = cleanText(createHrProfileDto.password);
    const phoneNumber = this.normalizeOptionalPhoneNumber(
      createHrProfileDto.phoneNumber,
    );
    const department = HR_PROFILE_DEFAULTS.department;
    const designation = HR_PROFILE_DEFAULTS.designation;
    const location = cleanText(createHrProfileDto.location);
    const status = cleanText(createHrProfileDto.status) || HR_PROFILE_DEFAULTS.status;
    const createdBySuperUser =
      createHrProfileDto.createdBySuperUser !== false;
    const now = new Date().toISOString();

    if (!name || !email || !password) {
      throw new BadRequestException(
        'Please fill in the required HR details before submitting your request.',
      );
    }

    if (!isValidGmailAddress(email)) {
      throw new BadRequestException(
        'Use a valid Gmail address for the HR login email.',
      );
    }

    if (!isValidPassword(password)) {
      throw new BadRequestException(
        'HR password must be at least 6 characters long.',
      );
    }

    return {
      name,
      email,
      password,
      phoneNumber,
      department,
      designation,
      location,
      companyId: company.id,
      companyName: company.name,
      status,
      createdBySuperUser,
      createdAt: now,
      updatedAt: now,
    };
  }

  private normalizeOptionalPhoneNumber(value: unknown): string {
    const rawPhoneNumber = cleanText(value);
    if (!rawPhoneNumber) {
      return HR_PROFILE_DEFAULTS.phoneNumber;
    }

    const formattedPhoneNumber = formatIndianPhoneNumber(rawPhoneNumber);
    if (!formattedPhoneNumber) {
      throw new BadRequestException(
        'Enter a valid Indian phone number for the HR contact.',
      );
    }

    return formattedPhoneNumber;
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

  private assertEmailIsAvailable(email: string): void {
    if (email === normalizeEmail(HARDCODED_SUPER_ADMIN_EMAIL)) {
      throw new BadRequestException(
        'That HR email is already used by another account.',
      );
    }

    if (this.data.hrProfiles.some((profile) => profile.email === email)) {
      throw new BadRequestException(
        'That HR email is already used by another account.',
      );
    }
  }

  private removeProfilesLinkedToCompany(
    companyId: string,
    companyName: string,
  ): HrProfileEntity[] {
    const replacedProfiles: HrProfileEntity[] = [];

    for (let index = this.data.hrProfiles.length - 1; index >= 0; index -= 1) {
      const currentProfile = this.data.hrProfiles[index];
      const linkedById =
        cleanText(currentProfile.companyId) === cleanText(companyId);
      const linkedByName =
        normalizeLookupValue(currentProfile.companyName) ===
        normalizeLookupValue(companyName);

      if (!linkedById && !linkedByName) {
        continue;
      }

      replacedProfiles.unshift(currentProfile);
      this.data.hrProfiles.splice(index, 1);
    }

    return replacedProfiles;
  }

  private applyLockedRoleDetails(profile: HrProfileEntity): HrProfileEntity {
    profile.department = HR_PROFILE_DEFAULTS.department;
    profile.designation = HR_PROFILE_DEFAULTS.designation;
    return profile;
  }
}
