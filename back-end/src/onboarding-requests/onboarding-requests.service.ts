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
  isValidEmailAddress,
  isValidGmailAddress,
  isValidPassword,
  normalizeEmail,
  normalizeLookupValue,
} from '../common/utils/record.utils';
import { CompaniesService } from '../companies/companies.service';
import { CreateCompanyDto } from '../companies/dto/create-company.dto';
import { CreateHrProfileDto } from '../hr-profiles/dto/create-hr-profile.dto';
import { HrProfilesService } from '../hr-profiles/hr-profiles.service';
import { ApproveOnboardingResultEntity } from './entities/approve-onboarding-result.entity';
import { OnboardingRequestEntity } from './entities/onboarding-request.entity';
import { CreateOnboardingRequestDto } from './dto/create-onboarding-request.dto';

@Injectable()
export class OnboardingRequestsService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
    private readonly hrProfilesService: HrProfilesService,
  ) {}

  findAll(): OnboardingRequestEntity[] {
    return [...this.data.onboardingRequests];
  }

  findOne(id: string): OnboardingRequestEntity {
    const normalizedId = cleanText(id);
    const request =
      this.data.onboardingRequests.find((entry) => entry.id === normalizedId) ??
      null;

    if (!request) {
      throw new NotFoundException('Company onboarding request not found.');
    }

    return request;
  }

  create(
    createOnboardingRequestDto: CreateOnboardingRequestDto,
  ): OnboardingRequestEntity {
    const preparedRequest = this.prepareRequestInput(createOnboardingRequestDto);
    this.assertRequestUniqueness(preparedRequest);

    const request: OnboardingRequestEntity = {
      id: createPrefixedRecordId('request'),
      companyName: preparedRequest.companyName,
      companyPhone: preparedRequest.companyPhone,
      companyAddress: preparedRequest.companyAddress,
      companyEmail: preparedRequest.companyEmail,
      hrName: preparedRequest.hrName,
      hrEmail: preparedRequest.hrEmail,
      hrPassword: preparedRequest.hrPassword,
      hrPhoneNumber: preparedRequest.hrPhoneNumber,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.onboardingRequests.unshift(request);
    return request;
  }

  remove(id: string): OnboardingRequestEntity {
    const request = this.findOne(id);
    const requestIndex = this.data.onboardingRequests.findIndex(
      (entry) => entry.id === request.id,
    );

    this.data.onboardingRequests.splice(requestIndex, 1);
    return request;
  }

  approve(id: string): ApproveOnboardingResultEntity {
    const request = this.findOne(id);
    const createCompanyDto: CreateCompanyDto = {
      name: request.companyName,
      phone: request.companyPhone,
      address: request.companyAddress,
      email: request.companyEmail,
    };
    const company = this.companiesService.create(createCompanyDto);

    try {
      const createHrProfileDto: CreateHrProfileDto = {
        name: request.hrName,
        email: request.hrEmail,
        password: request.hrPassword,
        phoneNumber: request.hrPhoneNumber || request.companyPhone,
        companyId: company.id,
        companyName: company.name,
        status: 'Active',
        createdBySuperUser: true,
      };

      const { hrProfile } = this.hrProfilesService.create(createHrProfileDto);
      this.remove(request.id);

      return {
        company,
        hrProfile,
        removedRequestId: request.id,
      };
    } catch (error) {
      this.companiesService.removeForRollback(company.id);
      throw error;
    }
  }

  private prepareRequestInput(
    createOnboardingRequestDto: CreateOnboardingRequestDto,
  ) {
    const companyName = cleanText(createOnboardingRequestDto.companyName);
    const companyPhone = formatIndianPhoneNumber(
      createOnboardingRequestDto.companyPhone,
    );
    const companyAddress = cleanText(createOnboardingRequestDto.companyAddress);
    const companyEmail = normalizeEmail(createOnboardingRequestDto.companyEmail);
    const hrName = cleanText(createOnboardingRequestDto.hrName);
    const hrEmail = normalizeEmail(createOnboardingRequestDto.hrEmail);
    const hrPassword = cleanText(createOnboardingRequestDto.hrPassword);
    const hrPhoneRaw = cleanText(createOnboardingRequestDto.hrPhoneNumber);
    const hrPhoneNumber = hrPhoneRaw
      ? formatIndianPhoneNumber(hrPhoneRaw) ?? ''
      : '';

    if (!companyName || !companyPhone || !companyAddress || !companyEmail) {
      throw new BadRequestException(
        'Please fill in all company details before submitting your request.',
      );
    }

    if (!isValidEmailAddress(companyEmail)) {
      throw new BadRequestException('Enter a valid company email address.');
    }

    if (!hrName || !hrEmail || !hrPassword) {
      throw new BadRequestException(
        'Please fill in the required HR details before submitting your request.',
      );
    }

    if (!isValidPassword(hrPassword)) {
      throw new BadRequestException(
        'HR password must be at least 6 characters long.',
      );
    }

    if (!isValidGmailAddress(hrEmail)) {
      throw new BadRequestException(
        'Use a valid Gmail address for the HR login email.',
      );
    }

    if (hrPhoneRaw && !hrPhoneNumber) {
      throw new BadRequestException(
        'Enter a valid Indian phone number for the HR contact.',
      );
    }

    return {
      companyName,
      companyPhone,
      companyAddress,
      companyEmail,
      hrName,
      hrEmail,
      hrPassword,
      hrPhoneNumber,
    };
  }

  private assertRequestUniqueness(
    request: Pick<
      OnboardingRequestEntity,
      | 'companyName'
      | 'companyPhone'
      | 'companyAddress'
      | 'companyEmail'
      | 'hrName'
      | 'hrEmail'
      | 'hrPassword'
      | 'hrPhoneNumber'
    >,
  ): void {
    const companies = this.companiesService.findAll();
    const existingHrProfiles = this.hrProfilesService.findAll();

    if (
      companies.some(
        (company) =>
          normalizeLookupValue(company.name) ===
          normalizeLookupValue(request.companyName),
      )
    ) {
      throw new BadRequestException(
        'A company with this name is already registered.',
      );
    }

    if (
      companies.some(
        (company) =>
          normalizeLookupValue(company.email) ===
          normalizeLookupValue(request.companyEmail),
      )
    ) {
      throw new BadRequestException(
        'A company with this email is already registered.',
      );
    }

    if (
      companies.some(
        (company) =>
          normalizeLookupValue(company.phone) ===
          normalizeLookupValue(request.companyPhone),
      )
    ) {
      throw new BadRequestException(
        'A company with this phone number is already registered.',
      );
    }

    if (
      existingHrProfiles.some(
        (profile) =>
          normalizeLookupValue(profile.email) ===
          normalizeLookupValue(request.hrEmail),
      ) ||
      normalizeLookupValue(request.hrEmail) ===
        normalizeLookupValue(HARDCODED_SUPER_ADMIN_EMAIL)
    ) {
      throw new BadRequestException(
        'That HR email is already used by another account.',
      );
    }

    if (
      this.data.onboardingRequests.some(
        (entry) =>
          normalizeLookupValue(entry.companyName) ===
          normalizeLookupValue(request.companyName),
      )
    ) {
      throw new BadRequestException(
        'A company request with this company name is already pending review.',
      );
    }

    if (
      this.data.onboardingRequests.some(
        (entry) =>
          normalizeLookupValue(entry.companyEmail) ===
          normalizeLookupValue(request.companyEmail),
      )
    ) {
      throw new BadRequestException(
        'A company request with this company email is already pending review.',
      );
    }

    if (
      this.data.onboardingRequests.some(
        (entry) =>
          normalizeLookupValue(entry.companyPhone) ===
          normalizeLookupValue(request.companyPhone),
      )
    ) {
      throw new BadRequestException(
        'A company request with this phone number is already pending review.',
      );
    }

    if (
      this.data.onboardingRequests.some(
        (entry) =>
          normalizeLookupValue(entry.hrEmail) ===
          normalizeLookupValue(request.hrEmail),
      )
    ) {
      throw new BadRequestException(
        'An onboarding request for this HR email is already pending review.',
      );
    }
  }
}
