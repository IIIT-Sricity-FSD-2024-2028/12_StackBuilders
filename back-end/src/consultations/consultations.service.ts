import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import {
  cleanText,
  createPrefixedRecordId,
  isValidEmailAddress,
  normalizeEmail,
  normalizeLookupValue,
} from '../common/utils/record.utils';
import { EmployeesService } from '../employees/employees.service';
import { ExpertsService } from '../experts/experts.service';
import { BookConsultationSlotDto } from './dto/book-consultation-slot.dto';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';
import { CreateFollowUpConsultationDto } from './dto/create-follow-up-consultation.dto';
import { RequestConsultationRescheduleDto } from './dto/request-consultation-reschedule.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ConsultationFollowUpResultEntity } from './entities/consultation-follow-up-result.entity';
import { ConsultationEntity } from './entities/consultation.entity';

const FALLBACK_CATEGORY_MAP: Record<string, string> = {
  'Dr. Sarah Mitchell': 'Wellness Coaching',
  'Dr. James Peterson': 'Nutritional Guidance',
  'Dr. Emily Chen': 'Mental Health Support',
};

const SCHEDULED_NOTIFICATION_INTERVAL_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class ConsultationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsultationsService.name);
  private scheduledNotificationTimer?: NodeJS.Timeout;
  private processingScheduledNotifications = false;

  constructor(
    private readonly data: InMemoryDataService,
    private readonly employeesService: EmployeesService,
    private readonly expertsService: ExpertsService,
    private readonly authService: AuthService,
  ) {}

  onModuleInit(): void {
    this.runScheduledNotificationCheck();
    this.scheduledNotificationTimer = setInterval(
      () => this.runScheduledNotificationCheck(),
      SCHEDULED_NOTIFICATION_INTERVAL_MS,
    );
    this.scheduledNotificationTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.scheduledNotificationTimer) {
      clearInterval(this.scheduledNotificationTimer);
    }
  }

  private runScheduledNotificationCheck(): void {
    void this.processScheduledNotifications().catch((error: unknown) => {
      this.logger.error(
        'Could not process scheduled consultation notifications.',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  private async processScheduledNotifications(): Promise<void> {
    if (this.processingScheduledNotifications) return;
    this.processingScheduledNotifications = true;

    try {
      const now = Date.now();
      for (const consultation of this.data.consultations) {
        const interval = this.getScheduleInterval(
          consultation.sessionDate,
          consultation.sessionTime,
          consultation.sessionDuration,
        );
        if (!interval) continue;

        const status = normalizeLookupValue(consultation.status);
        if (interval.end <= now && ['accepted', 'completed'].includes(status)) {
          consultation.status = 'completed';
          if (!consultation.feedbackRequestSentAt) {
            await this.notifyFeedbackRequested(consultation);
            consultation.feedbackRequestSentAt = new Date(now).toISOString();
          }
          continue;
        }

        if (status !== 'accepted' || interval.start <= now) continue;
        const timeUntilStart = interval.start - now;

        if (timeUntilStart <= HOUR_MS && !consultation.reminder1hSentAt) {
          await this.notifySessionReminder(consultation, 'one hour');
          consultation.reminder1hSentAt = new Date(now).toISOString();
        } else if (timeUntilStart <= DAY_MS && !consultation.reminder24hSentAt) {
          await this.notifySessionReminder(consultation, '24 hours');
          consultation.reminder24hSentAt = new Date(now).toISOString();
        }
      }
    } finally {
      this.processingScheduledNotifications = false;
    }
  }

  private async notifyConsultationRequested(
    consultation: ConsultationEntity,
  ): Promise<void> {
    await this.sendConsultationNotice(consultation, (participant) =>
      participant.role === 'employee'
        ? {
            subject: 'Consultation request received - Stack Builders',
            message: `Your consultation request with ${consultation.expertName} has been received and is waiting for review.`,
          }
        : {
            subject: 'New consultation request - Stack Builders',
            message: `A consultation request from ${consultation.employeeName} is waiting for your review.`,
          },
    );
  }

  private async notifyBookingConfirmed(
    consultation: ConsultationEntity,
  ): Promise<void> {
    await this.sendConsultationNotice(
      consultation,
      (participant) => ({
        subject:
          participant.role === 'employee'
            ? 'Your consultation booking is confirmed - Stack Builders'
            : 'A consultation has been booked with you - Stack Builders',
        message:
          participant.role === 'employee'
            ? `Your consultation with ${consultation.expertName} is confirmed.`
            : `A consultation with ${consultation.employeeName} has been booked and confirmed.`,
      }),
      true,
    );
  }

  private async notifyConsultationStatus(
    consultation: ConsultationEntity,
    status: string,
  ): Promise<void> {
    const normalizedStatus = normalizeLookupValue(status);
    const accepted = normalizedStatus === 'accepted';
    const rejected = normalizedStatus === 'rejected';
    const cancelled = ['cancelled', 'canceled'].includes(normalizedStatus);
    if (!accepted && !rejected && !cancelled) return;

    await this.sendConsultationNotice(
      consultation,
      (participant) => ({
        subject: accepted
          ? 'Consultation request accepted - Stack Builders'
          : rejected
            ? 'Consultation request update - Stack Builders'
            : 'Consultation cancelled - Stack Builders',
        message: accepted
          ? participant.role === 'employee'
            ? `Your consultation request with ${consultation.expertName} has been accepted.`
            : `Your consultation request from ${consultation.employeeName} has been accepted.`
          : rejected
            ? `The consultation request ${participant.role === 'employee' ? `with ${consultation.expertName}` : `from ${consultation.employeeName}`} was not accepted.${consultation.rejectionReason ? ` Reason: ${consultation.rejectionReason}` : ''}`
            : `The consultation ${participant.role === 'employee' ? `with ${consultation.expertName}` : `with ${consultation.employeeName}`} has been cancelled.`,
      }),
      true,
    );
  }

  private async notifyConsultationSchedule(
    consultation: ConsultationEntity,
    isChange: boolean,
  ): Promise<void> {
    await this.sendConsultationNotice(
      consultation,
      () => ({
        subject: isChange
          ? 'Consultation schedule updated - Stack Builders'
          : 'Consultation session scheduled - Stack Builders',
        message: isChange
          ? 'The schedule for your consultation has changed. Please use the updated details below.'
          : 'Your consultation session has been scheduled. The session details are below.',
      }),
      true,
    );
  }

  private async notifySessionReminder(
    consultation: ConsultationEntity,
    timeUntilStart: '24 hours' | 'one hour',
  ): Promise<void> {
    await this.sendConsultationNotice(
      consultation,
      () => ({
        subject: 'Upcoming consultation reminder - Stack Builders',
        message: `Your consultation session is coming up in about ${timeUntilStart}. Please review the session details below.`,
      }),
      true,
    );
  }

  private async notifyFeedbackRequested(
    consultation: ConsultationEntity,
  ): Promise<void> {
    await this.sendConsultationNotice(
      consultation,
      () => ({
        subject: 'How was your consultation? - Stack Builders',
        message:
          'Your consultation session has ended. We would appreciate your feedback. Please reply to this email with any comments about your experience, and avoid including sensitive medical information.',
      }),
      true,
    );
  }

  private async notifyEmployeeAvailability(
    consultation: ConsultationEntity,
  ): Promise<void> {
    const employee = this.resolveEmployeeRecord(consultation);
    const employeeEmail = normalizeEmail(employee?.email);
    const expertMessage = [
      `${consultation.employeeName} is unavailable for the scheduled consultation.`,
      `Message: ${consultation.employeeAvailabilityMessage}`,
      isValidEmailAddress(employeeEmail)
        ? `Please contact them at ${employeeEmail} to arrange another time.`
        : 'Please contact them to arrange another time.',
    ].join(' ');
    const employeeMessage = [
      `Your message has been sent to ${consultation.expertName}.`,
      'They will follow up with you about another session time.',
      `Message: ${consultation.employeeAvailabilityMessage}`,
    ].join(' ');
    await this.sendConsultationNotice(
      consultation,
      (participant) => ({
        subject: participant.role === 'expert'
          ? 'Employee requested a different consultation time - Stack Builders'
          : 'Your availability message was sent - Stack Builders',
        message: participant.role === 'expert' ? expertMessage : employeeMessage,
      }),
      true,
    );
  }

  private async sendConsultationNotice(
    consultation: ConsultationEntity,
    getMessage: (participant: { role: 'employee' | 'expert'; name: string }) => {
      subject: string;
      message: string;
    },
    includeSchedule = false,
  ): Promise<void> {
    const participants = this.getConsultationParticipants(consultation);
    await Promise.all(
      participants.map(async (participant) => {
        const { subject, message } = getMessage(participant);
        const scheduleText = includeSchedule
          ? this.getConsultationScheduleText(consultation)
          : [];
        const scheduleHtml = includeSchedule
          ? this.getConsultationScheduleHtml(consultation)
          : '';
        const text = [
          `Hello ${participant.name},`,
          '',
          message,
          ...scheduleText,
          '',
          'Stack Builders',
        ].join('\n');
        const html = [
          `<p>Hello ${this.escapeHtml(participant.name)},</p>`,
          `<p>${this.escapeHtml(message)}</p>`,
          scheduleHtml,
          '<p>Stack Builders</p>',
        ].join('');

        await this.authService.sendTransactionalEmail({
          to: participant.email,
          subject,
          text,
          html,
        });
      }),
    );
  }

  private getConsultationParticipants(consultation: ConsultationEntity): Array<{
    role: 'employee' | 'expert';
    name: string;
    email: string;
  }> {
    const employee = this.resolveEmployeeRecord(consultation);
    const expert = this.resolveExpertRecord(consultation);
    const recipients = new Map<
      string,
      { role: 'employee' | 'expert'; name: string; email: string }
    >();

    if (employee) {
      const email = normalizeEmail(employee.email);
      if (isValidEmailAddress(email)) {
        recipients.set(email, {
          role: 'employee',
          name: cleanText(employee.name) || consultation.employeeName,
          email,
        });
      }
    }
    if (expert) {
      const email = normalizeEmail(expert.email);
      if (isValidEmailAddress(email) && !recipients.has(email)) {
        recipients.set(email, {
          role: 'expert',
          name: cleanText(expert.name) || consultation.expertName,
          email,
        });
      }
    }

    return [...recipients.values()];
  }

  private getConsultationScheduleText(
    consultation: ConsultationEntity,
  ): string[] {
    if (!consultation.sessionDate || !consultation.sessionTime) return [];
    return [
      '',
      `Session: ${consultation.sessionTitle || 'Consultation'}`,
      `Date and time: ${consultation.sessionDate} at ${consultation.sessionTime}`,
      ...(consultation.sessionDuration
        ? [`Duration: ${consultation.sessionDuration}`]
        : []),
      ...(consultation.sessionMeetingLink
        ? [`Meeting link: ${consultation.sessionMeetingLink}`]
        : []),
    ];
  }

  private getConsultationScheduleHtml(
    consultation: ConsultationEntity,
  ): string {
    if (!consultation.sessionDate || !consultation.sessionTime) return '';
    return [
      '<p><strong>Session details</strong></p><ul>',
      `<li>Session: ${this.escapeHtml(consultation.sessionTitle || 'Consultation')}</li>`,
      `<li>Date and time: ${this.escapeHtml(consultation.sessionDate)} at ${this.escapeHtml(consultation.sessionTime)}</li>`,
      ...(consultation.sessionDuration
        ? [`<li>Duration: ${this.escapeHtml(consultation.sessionDuration)}</li>`]
        : []),
      ...(consultation.sessionMeetingLink
        ? [
            `<li>Meeting link: <a href="${this.escapeHtml(consultation.sessionMeetingLink)}">Join session</a></li>`,
          ]
        : []),
      '</ul>',
    ].join('');
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const replacements: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return replacements[character];
    });
  }

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
    void this.notifyConsultationRequested(consultation);
    return consultation;
  }

  bookSlot(bookConsultationSlotDto: BookConsultationSlotDto): ConsultationEntity {
    const employee = this.resolveEmployeeRecord({
      employeeId: bookConsultationSlotDto.employeeId,
    });
    const expert = this.resolveExpertRecord({
      expertId: bookConsultationSlotDto.expertId,
      expertName: bookConsultationSlotDto.expertName,
    });
    const purpose = cleanText(bookConsultationSlotDto.purpose);
    const slotTime = cleanText(bookConsultationSlotDto.slotTime);
    const companyContext = this.resolveConsultationCompanyContext(
      {},
      employee,
      expert,
    );

    if (!expert) {
      throw new BadRequestException('Selected wellness expert is no longer available.');
    }

    if (!employee) {
      throw new BadRequestException('Employee details are missing for this request.');
    }

    if (!purpose) {
      throw new BadRequestException('Please enter the purpose of your consultation request.');
    }

    // Verify the expert's slot before making any changes.
    const slotIndex = (expert.availableSlots || []).findIndex(s => s === slotTime);
    if (slotIndex === -1) {
      throw new BadRequestException('This slot is no longer available. Please select another time.');
    }

    const now = new Date();
    const slotDate = new Date(slotTime);
    if (Number.isNaN(slotDate.getTime())) {
      throw new BadRequestException('This consultation slot has an invalid date and time.');
    }

    const sessionDate = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
    const sessionTime = `${String(slotDate.getHours()).padStart(2, '0')}:${String(slotDate.getMinutes()).padStart(2, '0')}`;
    this.assertNoScheduleConflict(
      employee.id,
      expert.id,
      sessionDate,
      sessionTime,
      '15 min',
    );

    // Do not consume the expert's slot until every booking validation passes.
    expert.availableSlots!.splice(slotIndex, 1);

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
      sessionTitle: `Consultation with ${employee.name}`,
      sessionDate,
      sessionTime,
      sessionDuration: '15 min',
      sessionMeetingLink: `https://meet.stackbuilders.com/${createPrefixedRecordId('meet')}`,
      sessionCreatedAt: now.toISOString(),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt: now.toISOString(),
    });

    this.data.consultations.unshift(consultation);
    void this.notifyBookingConfirmed(consultation);
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
    void this.notifyConsultationStatus(consultation, 'accepted');

    return {
      consultation,
      reused: false,
    };
  }

  requestReschedule(
    id: string,
    requestDto: RequestConsultationRescheduleDto,
  ): ConsultationEntity {
    const consultation = this.findOne(id);
    if (cleanText(requestDto.employeeId) !== cleanText(consultation.employeeId)) {
      throw new ForbiddenException(
        'You can only send an availability message for your own consultation.',
      );
    }
    if (
      !['accepted', 'approved'].includes(normalizeLookupValue(consultation.status)) ||
      !consultation.sessionDate ||
      !consultation.sessionTime
    ) {
      throw new BadRequestException(
        'You can request a different time after the consultation has been scheduled.',
      );
    }

    const message = cleanText(requestDto.message);
    if (!message) {
      throw new BadRequestException('Please enter a message for your expert.');
    }

    consultation.employeeAvailabilityMessage = message;
    consultation.employeeAvailabilityRequestedAt = new Date().toISOString();
    void this.notifyEmployeeAvailability(consultation);
    return consultation;
  }

  update(id: string, updateConsultationDto: UpdateConsultationDto): ConsultationEntity {
    const consultation = this.findOne(id);
    const previousStatus = normalizeLookupValue(consultation.status);
    const previousSchedule = {
      sessionTitle: consultation.sessionTitle,
      sessionDate: consultation.sessionDate,
      sessionTime: consultation.sessionTime,
      sessionDuration: consultation.sessionDuration,
      sessionMeetingLink: consultation.sessionMeetingLink,
    };
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

    let normalizedNextStatus = previousStatus;
    if (nextStatus) {
      normalizedNextStatus = normalizeLookupValue(nextStatus);
      if (
        !['requested', 'accepted', 'rejected', 'cancelled', 'canceled'].includes(
          normalizedNextStatus,
        )
      ) {
        throw new BadRequestException(
          'Consultation status must be requested, accepted, rejected, or cancelled.',
        );
      }
    }

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
    const scheduleChanged = includesSessionField && [
      nextSessionTitle !== previousSchedule.sessionTitle,
      nextSessionDate !== previousSchedule.sessionDate,
      nextSessionTime !== previousSchedule.sessionTime,
      nextSessionDuration !== previousSchedule.sessionDuration,
      nextSessionMeetingLink !== previousSchedule.sessionMeetingLink,
    ].some(Boolean);

    if (includesSessionField) {
      if (normalizeLookupValue(normalizedNextStatus) !== 'accepted') {
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
      this.assertNoScheduleConflict(
        consultation.employeeId,
        consultation.expertId,
        nextSessionDate,
        nextSessionTime,
        nextSessionDuration,
        consultation.id,
      );
    }

    if (nextStatus) {
      consultation.status = normalizedNextStatus;
    }

    if (Object.prototype.hasOwnProperty.call(updateConsultationDto, 'purpose')) {
      consultation.purpose = nextPurpose;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateConsultationDto, 'rejectionReason') ||
      normalizeLookupValue(normalizedNextStatus) === 'accepted'
    ) {
      consultation.rejectionReason =
        normalizeLookupValue(normalizedNextStatus) === 'accepted'
          ? ''
          : nextRejectionReason;
    }

    consultation.createdByExpert = nextCreatedByExpert;
    consultation.sourceCheckinId = nextSourceCheckinId;
    consultation.followUpPriority = nextFollowUpPriority;

    if (includesSessionField) {
      consultation.sessionTitle = nextSessionTitle;
      consultation.sessionDate = nextSessionDate;
      consultation.sessionTime = nextSessionTime;
      consultation.sessionDuration = nextSessionDuration;
      consultation.sessionMeetingLink = nextSessionMeetingLink;
      consultation.sessionCreatedAt =
        nextSessionCreatedAt || new Date().toISOString();
    }

    if (scheduleChanged) {
      consultation.reminder24hSentAt = '';
      consultation.reminder1hSentAt = '';
      consultation.feedbackRequestSentAt = '';
    }
    if (
      nextSessionDate !== previousSchedule.sessionDate ||
      nextSessionTime !== previousSchedule.sessionTime
    ) {
      consultation.employeeAvailabilityMessage = '';
      consultation.employeeAvailabilityRequestedAt = '';
    }

    const statusChanged = previousStatus !== normalizedNextStatus;
    if (statusChanged) {
      void this.notifyConsultationStatus(consultation, normalizedNextStatus);
    }
    if (scheduleChanged && !statusChanged) {
      const hadSchedule = Boolean(
        previousSchedule.sessionDate && previousSchedule.sessionTime,
      );
      void this.notifyConsultationSchedule(consultation, hadSchedule);
    }

    return consultation;
  }

  remove(id: string): ConsultationEntity {
    const consultation = this.findOne(id);
    if (['requested', 'accepted'].includes(normalizeLookupValue(consultation.status))) {
      void this.notifyConsultationStatus(consultation, 'cancelled');
    }
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
      employeeAvailabilityMessage: cleanText(record.employeeAvailabilityMessage),
      employeeAvailabilityRequestedAt: cleanText(record.employeeAvailabilityRequestedAt),
      sessionCreatedAt: cleanText(record.sessionCreatedAt),
      createdByExpert: Boolean(record.createdByExpert),
      sourceCheckinId: cleanText(record.sourceCheckinId),
      followUpPriority: cleanText(record.followUpPriority),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt,
      reminder24hSentAt: cleanText(record.reminder24hSentAt),
      reminder1hSentAt: cleanText(record.reminder1hSentAt),
      feedbackRequestSentAt: cleanText(record.feedbackRequestSentAt),
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

  private assertNoScheduleConflict(
    employeeId: string,
    expertId: string,
    sessionDate: string,
    sessionTime: string,
    sessionDuration: string,
    ignoredConsultationId?: string,
  ): void {
    const normalizedEmployeeId = cleanText(employeeId);
    const normalizedExpertId = cleanText(expertId);
    const proposedInterval = this.getScheduleInterval(
      sessionDate,
      sessionTime,
      sessionDuration,
    );

    if (!proposedInterval || (!normalizedEmployeeId && !normalizedExpertId)) {
      return;
    }

    const terminalStatuses = new Set([
      'completed',
      'rejected',
      'cancelled',
      'canceled',
    ]);
    const overlaps = (consultation: ConsultationEntity): boolean => {
      if (
        cleanText(consultation.id) === cleanText(ignoredConsultationId) ||
        terminalStatuses.has(normalizeLookupValue(consultation.status))
      ) {
        return false;
      }

      const existingInterval = this.getScheduleInterval(
        consultation.sessionDate,
        consultation.sessionTime,
        consultation.sessionDuration,
      );
      return Boolean(
        existingInterval &&
          proposedInterval.start < existingInterval.end &&
          proposedInterval.end > existingInterval.start,
      );
    };
    const conflictingEmployeeSchedule = normalizedEmployeeId &&
      this.data.consultations.some((consultation) =>
        cleanText(consultation.employeeId) === normalizedEmployeeId && overlaps(consultation),
      );
    const conflictingExpertSchedule = normalizedExpertId &&
      this.data.consultations.some((consultation) =>
        cleanText(consultation.expertId) === normalizedExpertId && overlaps(consultation),
      );

    if (conflictingEmployeeSchedule) {
      throw new BadRequestException(
        'You already have a consultation booked for this time slot or an overlapping time. Please choose another time.',
      );
    }

    if (conflictingExpertSchedule) {
      throw new BadRequestException(
        'This wellness expert already has a consultation booked during this time. Please choose another time.',
      );
    }
  }

  private getScheduleInterval(
    sessionDate: string,
    sessionTime: string,
    sessionDuration: string,
  ): { start: number; end: number } | null {
    const date = this.parseDateOnly(cleanText(sessionDate));
    const time = this.parseTimeOnly(this.normalizeTimeKey(sessionTime));
    if (!date || !time) {
      return null;
    }

    const start = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.hours,
      time.minutes,
    ).getTime();
    const durationMinutes = this.getSessionDurationMinutes(sessionDuration);
    return {
      start,
      end: start + durationMinutes * 60 * 1000,
    };
  }

  private getSessionDurationMinutes(value: string): number {
    const normalized = cleanText(value).toLowerCase();
    const hourDuration = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)$/);
    if (hourDuration) {
      return Math.max(1, Math.ceil(Number(hourDuration[1]) * 60));
    }

    const clockDuration = normalized.match(/^(\d+):([0-5]\d)$/);
    if (clockDuration) {
      return Math.max(1, Number(clockDuration[1]) * 60 + Number(clockDuration[2]));
    }

    const minuteDuration = normalized.match(/\d+/);
    return minuteDuration ? Math.max(1, Number(minuteDuration[0])) : 15;
  }

  private normalizeTimeKey(value?: string): string {
    const parsedTime = this.parseTimeOnly(cleanText(value));
    return parsedTime
      ? `${String(parsedTime.hours).padStart(2, '0')}:${String(parsedTime.minutes).padStart(2, '0')}`
      : '';
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
