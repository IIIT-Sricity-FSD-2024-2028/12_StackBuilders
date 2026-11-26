import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
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
    private readonly authService: AuthService,
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
    void this.notifyRequestReceived(request);
    return request;
  }

  remove(id: string): OnboardingRequestEntity {
    const request = this.findOne(id);
    this.removePendingRequest(request.id);
    void this.notifyRequestDecision(request, false);
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
      this.removePendingRequest(request.id);
      void this.notifyRequestDecision(request, true);

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

  private removePendingRequest(id: string): void {
    const requestIndex = this.data.onboardingRequests.findIndex(
      (entry) => entry.id === id,
    );
    if (requestIndex >= 0) this.data.onboardingRequests.splice(requestIndex, 1);
  }

  private async notifyRequestReceived(
    request: OnboardingRequestEntity,
  ): Promise<void> {
    const frontendUrl = this.getFrontendUrl();
    const recipients = new Set(
      [request.companyEmail, request.hrEmail]
        .map((email) => normalizeEmail(email))
        .filter(Boolean),
    );

    await Promise.all(
      [...recipients].map((recipient) => {
        const isHrContact = recipient === normalizeEmail(request.hrEmail);
        const greeting = isHrContact ? request.hrName : request.companyName;
        const message = `Hello ${greeting}, your company onboarding request for ${request.companyName} has been received and is pending review. We will email you when a decision is made.`;
        return this.authService.sendTransactionalEmail({
          to: recipient,
          subject: 'Company request received - Stack Builders',
          text: `${message}\n\nRequest reference: ${request.id}\n\nStack Builders: ${frontendUrl}`,
          html: `<p>Hello ${this.escapeHtml(greeting)},</p><p>Your company onboarding request for <strong>${this.escapeHtml(request.companyName)}</strong> has been received and is pending review. We will email you when a decision is made.</p><p>Request reference: <strong>${this.escapeHtml(request.id)}</strong></p><p><a href="${this.escapeHtml(frontendUrl)}">Visit Stack Builders</a></p>`,
        });
      }),
    );

    const configuredReviewerEmail = normalizeEmail(
      process.env.ONBOARDING_REVIEW_EMAIL || '',
    );
    const reviewerEmail = isValidEmailAddress(configuredReviewerEmail)
      ? configuredReviewerEmail
      : 'raju@gmail.com';

    await this.authService.sendTransactionalEmail({
      to: reviewerEmail,
      subject: 'A company onboarding request needs review - Stack Builders',
      text: [
        `A new company onboarding request is waiting for review.`,
        `Company: ${request.companyName}`,
        `Company email: ${request.companyEmail}`,
        `HR contact: ${request.hrName} (${request.hrEmail})`,
        `Request reference: ${request.id}`,
        `Review dashboard: ${frontendUrl}`,
      ].join('\n'),
      html: `<p>A new company onboarding request is waiting for review.</p><ul><li><strong>Company:</strong> ${this.escapeHtml(request.companyName)}</li><li><strong>Company email:</strong> ${this.escapeHtml(request.companyEmail)}</li><li><strong>HR contact:</strong> ${this.escapeHtml(request.hrName)} (${this.escapeHtml(request.hrEmail)})</li><li><strong>Request reference:</strong> ${this.escapeHtml(request.id)}</li></ul><p><a href="${this.escapeHtml(frontendUrl)}">Open the review dashboard</a></p>`,
    });
  }

  private async notifyRequestDecision(
    request: OnboardingRequestEntity,
    approved: boolean,
  ): Promise<void> {
    const frontendUrl = this.getFrontendUrl();
    const recipients = new Set(
      [request.companyEmail, request.hrEmail]
        .map((email) => normalizeEmail(email))
        .filter(Boolean),
    );
    const hrEmail = normalizeEmail(request.hrEmail);

    await Promise.all(
      [...recipients].map((recipient) => {
        const isHrContact = recipient === hrEmail;
        const subject = approved
          ? isHrContact
            ? 'Your Stack Builders HR account invitation'
            : 'Company request approved - Stack Builders'
          : 'Company request update - Stack Builders';
        const text = approved
          ? isHrContact
            ? `Hello ${request.hrName}, the company request for ${request.companyName} has been approved. Your HR account is ready. Sign in at ${frontendUrl} with the HR email and password you provided when you submitted the request. If you need to choose a new password, use Forgot password on the sign-in page.`
            : `The company onboarding request for ${request.companyName} has been approved. The HR account is ready for sign-in at ${frontendUrl}.`
          : `The company onboarding request for ${request.companyName} was not approved. If you have questions or would like to submit updated information, please contact the Stack Builders administrator.`;
        const html = approved
          ? isHrContact
            ? `<p>Hello ${this.escapeHtml(request.hrName)},</p><p>Your request to manage HR for <strong>${this.escapeHtml(request.companyName)}</strong> has been approved. This is your invitation to access Stack Builders; your HR account is ready.</p><p>Sign in with <strong>${this.escapeHtml(request.hrEmail)}</strong> and the password you provided when you submitted the request. If you need to choose a new password, use <strong>Forgot password?</strong> on the sign-in page.</p><p><a href="${this.escapeHtml(frontendUrl)}">Sign in to Stack Builders</a></p>`
            : `<p>The company onboarding request for <strong>${this.escapeHtml(request.companyName)}</strong> has been approved. The HR account is ready for sign-in.</p><p><a href="${this.escapeHtml(frontendUrl)}">Visit Stack Builders</a></p>`
          : `<p>The company onboarding request for <strong>${this.escapeHtml(request.companyName)}</strong> was not approved.</p><p>If you have questions or would like to submit updated information, please contact the Stack Builders administrator.</p>`;

        return this.authService.sendTransactionalEmail({
          to: recipient,
          subject,
          text,
          html,
        });
      }),
    );
  }

  private getFrontendUrl(): string {
    const configuredUrl = process.env.FRONTEND_URL?.trim() ||
      'http://127.0.0.1:5173';
    try {
      const url = new URL(configuredUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'http://127.0.0.1:5173';
      }
      return url.toString().replace(/\/+$/, '');
    } catch {
      return 'http://127.0.0.1:5173';
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[character] || character;
    });
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
