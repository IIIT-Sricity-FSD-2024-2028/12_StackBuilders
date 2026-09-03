import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { cleanText, normalizeLookupValue } from '../common/utils/record.utils';
import { ExpertsService } from '../experts/experts.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { LiveSessionEntity } from './entities/live-session.entity';

@Injectable()
export class LiveSessionsService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly expertsService: ExpertsService,
  ) {}

  findAll(filters?: {
    status?: string;
    expertId?: string;
    companyId?: string;
    companyName?: string;
  }): LiveSessionEntity[] {
    this.refreshDerivedStatuses();
    let sessions = [...this.data.liveSessions];

    if (filters?.status) {
      const normalizedStatus = normalizeLookupValue(filters.status);
      sessions = sessions.filter(
        (session) => normalizeLookupValue(session.status) === normalizedStatus,
      );
    }

    if (filters?.expertId) {
      const normalizedExpertId = cleanText(filters.expertId);
      sessions = sessions.filter(
        (session) => cleanText(session.expertId) === normalizedExpertId,
      );
    }

    if (filters?.companyId || filters?.companyName) {
      const companyContext = this.createCompanyContext(filters);
      sessions = sessions.filter((session) =>
        this.matchesCompanyContext(session, companyContext),
      );
    }

    return this.sortByNewest(sessions);
  }

  findOne(id: string): LiveSessionEntity {
    this.refreshDerivedStatuses();
    const normalizedId = cleanText(id);
    const session =
      this.data.liveSessions.find((entry) => entry.id === normalizedId) ?? null;

    if (!session) {
      throw new NotFoundException('Live session not found.');
    }

    return session;
  }

  create(createLiveSessionDto: CreateLiveSessionDto): LiveSessionEntity {
    this.validateLiveSessionPayload(createLiveSessionDto);
    const expert = this.resolveExpertRecord({
      expertId: createLiveSessionDto.expertId,
      hostName: createLiveSessionDto.hostName,
    });
    const companyContext = this.resolveLiveSessionCompanyContext(
      createLiveSessionDto,
      expert,
    );

    const session = this.normalizeLiveSessionRecord({
      ...createLiveSessionDto,
      id: `live-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      status: 'scheduled',
      expertId: cleanText(createLiveSessionDto.expertId) || cleanText(expert?.id),
      hostName: this.normalizeExpertName(createLiveSessionDto.hostName || expert?.name),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    });

    this.data.liveSessions.unshift(session);
    return session;
  }

  update(id: string, updateLiveSessionDto: UpdateLiveSessionDto): LiveSessionEntity {
    this.refreshDerivedStatuses();
    const currentSession = this.findOne(id);
    const mergedSession = {
      ...currentSession,
      ...updateLiveSessionDto,
      id: currentSession.id,
      createdAt: currentSession.createdAt,
    };

    this.validateLiveSessionPayload(mergedSession, {
      allowPastStartDateTime: true,
    });

    const nextStatus = Object.prototype.hasOwnProperty.call(
      updateLiveSessionDto,
      'status',
    )
      ? normalizeLookupValue(updateLiveSessionDto.status)
      : normalizeLookupValue(currentSession.status);

    if (
      nextStatus &&
      !['scheduled', 'ongoing', 'completed', 'cancelled'].includes(nextStatus)
    ) {
      throw new BadRequestException(
        'Live session status must be scheduled, ongoing, completed, or cancelled.',
      );
    }

    const normalizedSession = this.normalizeLiveSessionRecord({
      ...mergedSession,
      status: nextStatus || currentSession.status,
    });
    const sessionIndex = this.data.liveSessions.findIndex(
      (entry) => entry.id === currentSession.id,
    );
    this.data.liveSessions[sessionIndex] = normalizedSession;

    return normalizedSession;
  }

  remove(id: string): LiveSessionEntity {
    const session = this.findOne(id);
    const sessionIndex = this.data.liveSessions.findIndex(
      (entry) => entry.id === session.id,
    );

    this.data.liveSessions.splice(sessionIndex, 1);
    return session;
  }

  private validateLiveSessionPayload(
    payload: Partial<LiveSessionEntity>,
    options: { allowPastStartDateTime?: boolean } = {},
  ): void {
    const requiredFields: Array<[keyof LiveSessionEntity, string]> = [
      ['title', 'Enter a session title.'],
      ['category', 'Choose a session category.'],
      ['sessionType', 'Choose a session type.'],
      ['date', 'Choose a session date.'],
      ['startTime', 'Choose a start time.'],
      ['duration', 'Choose a session duration.'],
      ['maxParticipants', 'Enter the maximum participant count.'],
      ['meetingLink', 'Enter the meeting link.'],
      ['description', 'Enter a session description.'],
    ];

    for (const [fieldName, message] of requiredFields) {
      if (!cleanText(payload[fieldName])) {
        throw new BadRequestException(message);
      }
    }

    const participantCount = Number(cleanText(payload.maxParticipants));
    if (!Number.isInteger(participantCount) || participantCount < 1) {
      throw new BadRequestException(
        'Maximum participants must be a whole number greater than 0.',
      );
    }

    const sessionDate = this.parseDateOnly(payload.date);
    if (!sessionDate) {
      throw new BadRequestException('Choose a valid session date.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sessionDate < today) {
      throw new BadRequestException(
        'Live sessions cannot be scheduled in the past.',
      );
    }

    const sessionStartDateTime = this.buildSessionStartDateTime(
      payload.date,
      payload.startTime,
    );
    if (!sessionStartDateTime) {
      throw new BadRequestException('Choose a valid session start time.');
    }

    if (
      !options.allowPastStartDateTime &&
      sessionStartDateTime.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Live sessions cannot start earlier than the current time.',
      );
    }

    const durationMinutes = this.parseDurationMinutes(payload.duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new BadRequestException('Choose a valid session duration.');
    }

    if (!this.isValidHttpUrl(payload.meetingLink)) {
      throw new BadRequestException(
        'Enter a valid meeting link that starts with http:// or https://.',
      );
    }
  }

  private parseDateOnly(value: unknown): Date | null {
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

  private parseTimeParts(value: unknown): { hours: number; minutes: number } | null {
    const raw = cleanText(value);
    const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return null;
    }

    return {
      hours: Number(match[1]),
      minutes: Number(match[2]),
    };
  }

  private buildSessionStartDateTime(
    dateValue: unknown,
    timeValue: unknown,
  ): Date | null {
    const sessionDate = this.parseDateOnly(dateValue);
    const timeParts = this.parseTimeParts(timeValue);

    if (!sessionDate || !timeParts) {
      return null;
    }

    const dateTime = new Date(sessionDate);
    dateTime.setHours(timeParts.hours, timeParts.minutes, 0, 0);
    return Number.isNaN(dateTime.getTime()) ? null : dateTime;
  }

  private parseDurationMinutes(value: unknown): number {
    const raw = cleanText(value);
    const match = raw.match(/(\d+)/);
    if (!match) {
      return Number.NaN;
    }

    return Number(match[1]);
  }

  private buildSessionEndDateTime(record: Partial<LiveSessionEntity>): Date | null {
    const startDateTime = this.buildSessionStartDateTime(
      record.date,
      record.startTime,
    );
    const durationMinutes = this.parseDurationMinutes(record.duration);

    if (!startDateTime || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return null;
    }

    return new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
  }

  private deriveLiveSessionStatus(
    record: Partial<LiveSessionEntity>,
    now = new Date(),
  ): string {
    const explicitStatus = normalizeLookupValue(record.status);

    if (explicitStatus === 'cancelled' || explicitStatus === 'completed') {
      return explicitStatus;
    }

    const startDateTime = this.buildSessionStartDateTime(
      record.date,
      record.startTime,
    );
    const endDateTime = this.buildSessionEndDateTime(record);

    if (!startDateTime || !endDateTime) {
      return explicitStatus || 'scheduled';
    }

    if (now >= endDateTime) {
      return 'completed';
    }

    if (now >= startDateTime) {
      return 'ongoing';
    }

    return 'scheduled';
  }

  private isValidHttpUrl(value: unknown): boolean {
    try {
      const url = new URL(cleanText(value));
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  private normalizeExpertName(value: unknown): string {
    const raw = cleanText(value);
    if (!raw) {
      return '';
    }

    return raw.split('(')[0].trim();
  }

  private resolveExpertRecord(record: {
    expertId?: string;
    hostName?: string;
  }) {
    const normalizedExpertId = cleanText(record.expertId);
    const normalizedHostName = this.normalizeExpertName(record.hostName).toLowerCase();

    if (normalizedExpertId) {
      try {
        return this.expertsService.findOne(normalizedExpertId);
      } catch (error) {
        // Fall through to host name lookup.
      }
    }

    if (!normalizedHostName) {
      return null;
    }

    return (
      this.data.experts.find(
        (expert) =>
          this.normalizeExpertName(expert.name).toLowerCase() === normalizedHostName,
      ) ?? null
    );
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
    record: { companyId?: string; companyName?: string },
    companyContext: { companyId?: string; companyName?: string },
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

  private resolveLiveSessionCompanyContext(
    record: Partial<LiveSessionEntity>,
    expert: { companyId?: string; companyName?: string } | null,
  ) {
    const explicitCompanyContext = this.createCompanyContext(record);
    if (this.hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const expertCompanyContext = this.createCompanyContext(expert ?? {});
    if (this.hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    return this.createCompanyContext({});
  }

  private normalizeLiveSessionRecord(
    record: Partial<LiveSessionEntity>,
  ): LiveSessionEntity {
    const createdAt = cleanText(record.createdAt) || new Date().toISOString();
    const expert = this.resolveExpertRecord(record);
    const hostName =
      this.normalizeExpertName(record.hostName || expert?.name) || 'Wellness Expert';
    const companyContext = this.resolveLiveSessionCompanyContext(record, expert);

    return {
      id: cleanText(record.id) || `live-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: cleanText(record.title),
      category: cleanText(record.category),
      sessionType: cleanText(record.sessionType),
      date: cleanText(record.date),
      startTime: cleanText(record.startTime),
      duration: cleanText(record.duration),
      maxParticipants: cleanText(record.maxParticipants),
      meetingLink: cleanText(record.meetingLink),
      description: cleanText(record.description),
      createdAt,
      status: this.deriveLiveSessionStatus(record),
      expertId: cleanText(record.expertId) || cleanText(expert?.id),
      hostName,
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    };
  }

  private refreshDerivedStatuses(): void {
    const normalizedSessions = this.data.liveSessions.map((session) =>
      this.normalizeLiveSessionRecord(session),
    );

    this.data.liveSessions.splice(
      0,
      this.data.liveSessions.length,
      ...normalizedSessions,
    );
  }

  private sortByNewest(records: LiveSessionEntity[]) {
    return [...records].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }
}
