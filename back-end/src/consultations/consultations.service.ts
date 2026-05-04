import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import {
  cleanText,
  createPrefixedRecordId,
  normalizeLookupValue,
} from '../common/utils/record.utils';
import { EmployeesService } from '../employees/employees.service';
import { ExpertsService } from '../experts/experts.service';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';
import { CreateFollowUpConsultationDto } from './dto/create-follow-up-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ConsultationFollowUpResultEntity } from './entities/consultation-follow-up-result.entity';
import { ConsultationEntity } from './entities/consultation.entity';

const FALLBACK_CATEGORY_MAP: Record<string, string> = {
  'Dr. Sarah Mitchell': 'Wellness Coaching',
  'Dr. James Peterson': 'Nutritional Guidance',
  'Dr. Emily Chen': 'Mental Health Support',
};

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly employeesService: EmployeesService,
    private readonly expertsService: ExpertsService,
  ) {}

  findAll(filters?: {
    employeeId?: string;
    expertId?: string;
    companyId?: string;
    companyName?: string;
    status?: string;
    createdByExpert?: string;
    sourceCheckinId?: string;
  }): ConsultationEntity[] {
    let consultations = [...this.data.consultations];

    if (filters?.employeeId) {
      const normalizedEmployeeId = cleanText(filters.employeeId);
      consultations = consultations.filter(
        (consultation) =>
          cleanText(consultation.employeeId) === normalizedEmployeeId,
      );
    }

    if (filters?.expertId) {
      const normalizedExpertId = cleanText(filters.expertId);
      consultations = consultations.filter(
        (consultation) => cleanText(consultation.expertId) === normalizedExpertId,
      );
    }

    if (filters?.companyId || filters?.companyName) {
      const companyContext = this.createCompanyContext({
        companyId: filters.companyId,
        companyName: filters.companyName,
      });
      consultations = consultations.filter((consultation) =>
        this.matchesCompanyContext(consultation, companyContext),
      );
    }

    if (filters?.status) {
      const normalizedStatus = normalizeLookupValue(filters.status);
      consultations = consultations.filter(
        (consultation) =>
          normalizeLookupValue(consultation.status) === normalizedStatus,
      );
    }

    if (typeof filters?.createdByExpert === 'string') {
      const expectedValue =
        normalizeLookupValue(filters.createdByExpert) === 'true';
      consultations = consultations.filter(
        (consultation) => consultation.createdByExpert === expectedValue,
      );
    }

    if (filters?.sourceCheckinId) {
      const normalizedSourceCheckinId = cleanText(filters.sourceCheckinId);
      consultations = consultations.filter(
        (consultation) =>
          cleanText(consultation.sourceCheckinId) === normalizedSourceCheckinId,
      );
    }

    return consultations;
  }

  findOne(id: string): ConsultationEntity {
    const normalizedId = cleanText(id);
    const consultation =
      this.data.consultations.find((entry) => entry.id === normalizedId) ?? null;

    if (!consultation) {
      throw new NotFoundException('Consultation not found.');
    }

    return consultation;
  }

  createRequest(
    createConsultationRequestDto: CreateConsultationRequestDto,
  ): ConsultationEntity {
    const employee = this.resolveEmployeeRecord({
      employeeId: createConsultationRequestDto.employeeId,
    });
    const expert = this.resolveExpertRecord({
      expertId: createConsultationRequestDto.expertId,
      expertName: createConsultationRequestDto.expertName,
    });
    const purpose = cleanText(createConsultationRequestDto.purpose);
    const companyContext = this.resolveConsultationCompanyContext(
      {},
      employee,
      expert,
    );

    if (!expert) {
      throw new BadRequestException(
        'Selected wellness expert is no longer available.',
      );
    }

    if (!employee) {
      throw new BadRequestException('Employee details are missing for this request.');
    }

    if (!purpose) {
      throw new BadRequestException(
        'Please enter the purpose of your consultation request.',
      );
    }

    const now = new Date();
    const consultation = this.normalizeConsultationRecord({
      id: createPrefixedRecordId('consult'),
      employeeId: employee.id,
      employeeName: employee.name,
      expertId: expert.id,
      expertName: this.normalizeExpertName(expert.name),
      purpose,
      category: this.getExpertCategory({ expertId: expert.id, expertName: expert.name }),
      requestedOn: this.buildRequestedOn(now),
      status: 'requested',
      rejectionReason: '',
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt: now.toISOString(),
    });

    this.data.consultations.unshift(consultation);
    return consultation;
  }

  createExpertFollowUp(
    createFollowUpConsultationDto: CreateFollowUpConsultationDto,
  ): ConsultationFollowUpResultEntity {
    const employeeId = cleanText(createFollowUpConsultationDto.employeeId);
    const expert = this.resolveExpertRecord({
      expertId: createFollowUpConsultationDto.expertId,
      expertName: createFollowUpConsultationDto.expertName,
    });
    const employee = this.resolveEmployeeRecord({ employeeId });
    const purpose =
      cleanText(createFollowUpConsultationDto.purpose) ||
      'Follow-up consultation recommended by the wellness expert.';
    const companyContext = this.resolveConsultationCompanyContext(
      {},
      employee,
      expert,
    );

    if (!expert) {
      throw new BadRequestException(
        'Selected wellness expert is no longer available.',
      );
    }

    if (!employee) {
      throw new BadRequestException(
        'Employee details are missing for this follow-up consultation.',
      );
    }

    const existingOpenConsultation = this.getLatestOpenConsultationForExpertEmployee({
      employeeId,
      expertId: expert.id,
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    });

    if (existingOpenConsultation) {
      if (existingOpenConsultation.status === 'requested') {
        this.update(existingOpenConsultation.id, {
          status: 'accepted',
          rejectionReason: '',
          createdByExpert: true,
          sourceCheckinId:
            cleanText(createFollowUpConsultationDto.sourceCheckinId) ||
            existingOpenConsultation.sourceCheckinId,
          followUpPriority:
            cleanText(createFollowUpConsultationDto.followUpPriority) ||
            existingOpenConsultation.followUpPriority,
          purpose: existingOpenConsultation.purpose || purpose,
        });
      }

      return {
        consultation: this.findOne(existingOpenConsultation.id),
        reused: true,
      };
    }

    const now = new Date();
    const consultation = this.normalizeConsultationRecord({
      id: createPrefixedRecordId('consult'),
      employeeId: employee.id,
      employeeName: employee.name,
      expertId: expert.id,
      expertName: this.normalizeExpertName(expert.name),
      purpose,
      category: this.getExpertCategory({ expertId: expert.id, expertName: expert.name }),
      requestedOn: this.buildRequestedOn(now),
      status: 'accepted',
      rejectionReason: '',
      createdByExpert: true,
      sourceCheckinId: cleanText(createFollowUpConsultationDto.sourceCheckinId),
      followUpPriority: cleanText(createFollowUpConsultationDto.followUpPriority),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt: now.toISOString(),
    });

    this.data.consultations.unshift(consultation);

    return {
      consultation,
      reused: false,
    };
  }

  update(id: string, updateConsultationDto: UpdateConsultationDto): ConsultationEntity {
    const consultation = this.findOne(id);
    const nextStatus = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'status',
    )
      ? cleanText(updateConsultationDto.status)
      : consultation.status;
    const nextRejectionReason = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'rejectionReason',
    )
      ? cleanText(updateConsultationDto.rejectionReason)
      : consultation.rejectionReason;
    const nextPurpose = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'purpose',
    )
      ? cleanText(updateConsultationDto.purpose)
      : consultation.purpose;
    const nextCreatedByExpert = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'createdByExpert',
    )
      ? Boolean(updateConsultationDto.createdByExpert)
      : consultation.createdByExpert;
    const nextSourceCheckinId = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sourceCheckinId',
    )
      ? cleanText(updateConsultationDto.sourceCheckinId)
      : consultation.sourceCheckinId;
    const nextFollowUpPriority = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'followUpPriority',
    )
      ? cleanText(updateConsultationDto.followUpPriority)
      : consultation.followUpPriority;
    const nextSessionTitle = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sessionTitle',
    )
      ? cleanText(updateConsultationDto.sessionTitle)
      : consultation.sessionTitle;
    const nextSessionDate = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sessionDate',
    )
      ? cleanText(updateConsultationDto.sessionDate)
      : consultation.sessionDate;
    const nextSessionTime = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sessionTime',
    )
      ? cleanText(updateConsultationDto.sessionTime)
      : consultation.sessionTime;
    const nextSessionDuration = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sessionDuration',
    )
      ? cleanText(updateConsultationDto.sessionDuration)
      : consultation.sessionDuration;
    const nextSessionMeetingLink = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sessionMeetingLink',
    )
      ? cleanText(updateConsultationDto.sessionMeetingLink)
      : consultation.sessionMeetingLink;
    const nextSessionCreatedAt = Object.prototype.hasOwnProperty.call(
      updateConsultationDto,
      'sessionCreatedAt',
    )
      ? cleanText(updateConsultationDto.sessionCreatedAt)
      : consultation.sessionCreatedAt;

    if (nextStatus) {
      const normalizedStatus = normalizeLookupValue(nextStatus);
      if (!['requested', 'accepted', 'rejected'].includes(normalizedStatus)) {
        throw new BadRequestException(
          'Consultation status must be requested, accepted, or rejected.',
        );
      }
      consultation.status = normalizedStatus;
    }

    if (Object.prototype.hasOwnProperty.call(updateConsultationDto, 'purpose')) {
      consultation.purpose = nextPurpose;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateConsultationDto, 'rejectionReason') ||
      consultation.status === 'accepted'
    ) {
      consultation.rejectionReason =
        consultation.status === 'accepted' ? '' : nextRejectionReason;
    }

    consultation.createdByExpert = nextCreatedByExpert;
    consultation.sourceCheckinId = nextSourceCheckinId;
    consultation.followUpPriority = nextFollowUpPriority;

    const includesSessionField = [
      'sessionTitle',
      'sessionDate',
      'sessionTime',
      'sessionDuration',
      'sessionMeetingLink',
      'sessionCreatedAt',
    ].some((fieldName) =>
      Object.prototype.hasOwnProperty.call(updateConsultationDto, fieldName),
    );

    if (includesSessionField) {
      if (consultation.status !== 'accepted') {
        throw new BadRequestException(
          'Only accepted consultations can be scheduled here.',
        );
      }

      this.validateScheduledSession({
        sessionTitle: nextSessionTitle,
        sessionDate: nextSessionDate,
        sessionTime: nextSessionTime,
        sessionDuration: nextSessionDuration,
        sessionMeetingLink: nextSessionMeetingLink,
      });

      consultation.sessionTitle = nextSessionTitle;
      consultation.sessionDate = nextSessionDate;
      consultation.sessionTime = nextSessionTime;
      consultation.sessionDuration = nextSessionDuration;
      consultation.sessionMeetingLink = nextSessionMeetingLink;
      consultation.sessionCreatedAt =
        nextSessionCreatedAt || new Date().toISOString();
    }

    return consultation;
  }

  remove(id: string): ConsultationEntity {
    const consultation = this.findOne(id);
    const consultationIndex = this.data.consultations.findIndex(
      (entry) => entry.id === consultation.id,
    );

    this.data.consultations.splice(consultationIndex, 1);
    return consultation;
  }

  getLatestOpenConsultationForExpertEmployee({
    employeeId,
    expertId,
    companyId,
    companyName,
  }: {
    employeeId?: string;
    expertId?: string;
    companyId?: string;
    companyName?: string;
  }): ConsultationEntity | null {
    const normalizedEmployeeId = cleanText(employeeId);
    const normalizedExpertId = cleanText(expertId);
    const companyContext = this.createCompanyContext({ companyId, companyName });

    if (!normalizedEmployeeId || !normalizedExpertId) {
      return null;
    }

    return (
      this.data.consultations
        .filter(
          (consultation) =>
            cleanText(consultation.employeeId) === normalizedEmployeeId,
        )
        .filter(
          (consultation) => cleanText(consultation.expertId) === normalizedExpertId,
        )
        .filter(
          (consultation) =>
            consultation.status === 'requested' || consultation.status === 'accepted',
        )
        .filter((consultation) =>
          this.hasCompanyContext(companyContext)
            ? this.matchesCompanyContext(consultation, companyContext)
            : true,
        )
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )[0] ?? null
    );
  }

  private normalizeConsultationRecord(
    record: Partial<ConsultationEntity>,
  ): ConsultationEntity {
    const createdAt = cleanText(record.createdAt) || new Date().toISOString();
    const employee = this.resolveEmployeeRecord(record);
    const expert = this.resolveExpertRecord(record);
    const expertId = cleanText(record.expertId) || cleanText(expert?.id);
    const expertName =
      this.normalizeExpertName(record.expertName || expert?.name) ||
      'Wellness Expert';
    const companyContext = this.resolveConsultationCompanyContext(
      record,
      employee,
      expert,
    );

    return {
      id: cleanText(record.id) || createPrefixedRecordId('consult'),
      employeeId: cleanText(record.employeeId),
      employeeName: cleanText(record.employeeName) || employee?.name || 'Employee',
      expertId,
      expertName,
      purpose: cleanText(record.purpose),
      category:
        cleanText(record.category) ||
        this.getExpertCategory({ expertId, expertName }),
      requestedOn:
        cleanText(record.requestedOn) || this.buildRequestedOn(new Date(createdAt)),
      status: cleanText(record.status) || 'requested',
      rejectionReason: cleanText(record.rejectionReason),
      sessionTitle: cleanText(record.sessionTitle),
      sessionDate: cleanText(record.sessionDate),
      sessionTime: cleanText(record.sessionTime),
      sessionDuration: cleanText(record.sessionDuration),
      sessionMeetingLink: cleanText(record.sessionMeetingLink),
      sessionCreatedAt: cleanText(record.sessionCreatedAt),
      createdByExpert: Boolean(record.createdByExpert),
      sourceCheckinId: cleanText(record.sourceCheckinId),
      followUpPriority: cleanText(record.followUpPriority),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt,
    };
  }

  private resolveEmployeeRecord(record: {
    employeeId?: string;
  }): ReturnType<EmployeesService['findOne']> | null {
    const employeeId = cleanText(record.employeeId);
    if (!employeeId) {
      return null;
    }

    try {
      return this.employeesService.findOne(employeeId);
    } catch (error) {
      return null;
    }
  }

  private resolveExpertRecord(record: {
    expertId?: string;
    expertName?: string;
    name?: string;
  }): ReturnType<ExpertsService['findOne']> | null {
    const expertId = cleanText(record.expertId);
    const expertName = this.normalizeExpertName(
      record.expertName || record.name,
    ).toLowerCase();

    if (expertId) {
      try {
        return this.expertsService.findOne(expertId);
      } catch (error) {
        // Fall through to name lookup.
      }
    }

    if (!expertName) {
      return null;
    }

    return (
      this.data.experts.find(
        (expert) =>
          this.normalizeExpertName(expert.name).toLowerCase() === expertName,
      ) ?? null
    );
  }

  private normalizeExpertName(value: unknown): string {
    const raw = cleanText(value);
    if (!raw) {
      return '';
    }

    return raw.split('(')[0].trim();
  }

  private createCompanyContext(companyLike: {
    companyId?: string;
    id?: string;
    companyName?: string;
    name?: string;
  }) {
    return {
      companyId: cleanText(companyLike.companyId || companyLike.id),
      companyName: cleanText(companyLike.companyName || companyLike.name),
    };
  }

  private hasCompanyContext(companyContext: {
    companyId?: string;
    companyName?: string;
  }): boolean {
    return Boolean(
      cleanText(companyContext.companyId) || cleanText(companyContext.companyName),
    );
  }

  private matchesCompanyContext(
    record: {
      companyId?: string;
      companyName?: string;
    },
    companyContext: {
      companyId?: string;
      companyName?: string;
    },
  ): boolean {
    const normalizedContext = this.createCompanyContext(companyContext);

    if (!this.hasCompanyContext(normalizedContext)) {
      return true;
    }

    const recordCompanyId = cleanText(record.companyId);
    const recordCompanyName = normalizeLookupValue(record.companyName);

    if (
      normalizedContext.companyId &&
      recordCompanyId &&
      recordCompanyId === normalizedContext.companyId
    ) {
      return true;
    }

    return Boolean(
      normalizedContext.companyName &&
        recordCompanyName &&
        recordCompanyName ===
          normalizeLookupValue(normalizedContext.companyName),
    );
  }

  private resolveConsultationCompanyContext(
    record: Partial<ConsultationEntity>,
    employee: { companyId?: string; companyName?: string } | null,
    expert: { companyId?: string; companyName?: string } | null,
  ) {
    const explicitCompanyContext = this.createCompanyContext(record);
    if (this.hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const employeeCompanyContext = this.createCompanyContext(employee ?? {});
    const expertCompanyContext = this.createCompanyContext(expert ?? {});

    if (
      this.hasCompanyContext(employeeCompanyContext) &&
      this.hasCompanyContext(expertCompanyContext) &&
      employeeCompanyContext.companyId &&
      expertCompanyContext.companyId &&
      employeeCompanyContext.companyId !== expertCompanyContext.companyId
    ) {
      throw new BadRequestException(
        'Employee and wellness expert must belong to the same company.',
      );
    }

    if (this.hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    if (this.hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    return this.createCompanyContext({});
  }

  private buildRequestedOn(date: Date): string {
    const requestedDate = date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const requestedTime = date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${requestedDate} @ ${requestedTime}`;
  }

  private getExpertCategory(expertInput: {
    expertId?: string;
    expertName?: string;
  }): string {
    const expert = this.resolveExpertRecord(expertInput);

    if (cleanText(expert?.specialization)) {
      return cleanText(expert?.specialization);
    }

    const expertName = this.normalizeExpertName(expertInput.expertName);
    return FALLBACK_CATEGORY_MAP[expertName] || 'General Wellness';
  }

  private validateScheduledSession(session: {
    sessionTitle: string;
    sessionDate: string;
    sessionTime: string;
    sessionDuration: string;
    sessionMeetingLink: string;
  }): void {
    if (
      !session.sessionTitle ||
      !session.sessionDate ||
      !session.sessionTime ||
      !session.sessionDuration ||
      !session.sessionMeetingLink
    ) {
      throw new BadRequestException(
        'Session title, date, time, duration, and meeting link are all required.',
      );
    }

    const parsedDate = this.parseDateOnly(session.sessionDate);
    const today = this.parseDateOnly(this.getTodayDateInputValue());

    if (!parsedDate || (today && parsedDate < today)) {
      throw new BadRequestException(
        'Choose today or a future date for the consultation session.',
      );
    }

    const parsedTime = this.parseTimeOnly(session.sessionTime);
    if (!parsedTime) {
      throw new BadRequestException(
        'Choose a valid consultation time for the session.',
      );
    }

    const now = new Date();
    if (
      this.isSameCalendarDate(parsedDate, now) &&
      (
        parsedTime.hours < now.getHours() ||
        (parsedTime.hours === now.getHours() &&
          parsedTime.minutes < now.getMinutes())
      )
    ) {
      throw new BadRequestException(
        'Choose the current time or a future time for today’s consultation session.',
      );
    }

    if (!this.isValidHttpUrl(session.sessionMeetingLink)) {
      throw new BadRequestException(
        'Enter a valid meeting link that starts with http:// or https://.',
      );
    }
  }

  private getTodayDateInputValue(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateOnly(value: string): Date | null {
    const raw = cleanText(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parseTimeOnly(
    value: string,
  ): { hours: number; minutes: number } | null {
    const raw = cleanText(value);
    const match = raw.match(/^(\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return { hours, minutes };
  }

  private isSameCalendarDate(left: Date | null, right: Date | null): boolean {
    return Boolean(
      left &&
        right &&
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate(),
    );
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const url = new URL(cleanText(value));
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }
}
