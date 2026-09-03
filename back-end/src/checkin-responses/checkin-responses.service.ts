import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { cleanText, normalizeLookupValue } from '../common/utils/record.utils';
import { ExpertsService } from '../experts/experts.service';
import { WellnessCheckinsService } from '../wellness-checkins/wellness-checkins.service';
import { CheckinResponseEntity } from './entities/checkin-response.entity';
import { CreateCheckinResponseDto } from './dto/create-checkin-response.dto';
import { UpdateCheckinResponseDto } from './dto/update-checkin-response.dto';

@Injectable()
export class CheckinResponsesService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly expertsService: ExpertsService,
    private readonly wellnessCheckinsService: WellnessCheckinsService,
  ) {}

  findAll(filters?: {
    checkinId?: string;
    employeeId?: string;
    expertId?: string;
    companyId?: string;
    companyName?: string;
  }): CheckinResponseEntity[] {
    let records = [...this.data.checkinResponses];

    if (filters?.checkinId) {
      const normalizedCheckinId = cleanText(filters.checkinId);
      records = records.filter(
        (record) => cleanText(record.checkinId) === normalizedCheckinId,
      );
    }

    if (filters?.employeeId) {
      const normalizedEmployeeId = cleanText(filters.employeeId);
      records = records.filter(
        (record) => cleanText(record.employeeId) === normalizedEmployeeId,
      );
    }

    if (filters?.expertId) {
      const normalizedExpertId = cleanText(filters.expertId);
      records = records.filter(
        (record) => cleanText(record.expertId) === normalizedExpertId,
      );
    }

    if (filters?.companyId || filters?.companyName) {
      const companyContext = this.createCompanyContext(filters);
      records = records.filter((record) =>
        this.matchesCompanyContext(record, companyContext),
      );
    }

    return this.sortByNewest(records);
  }

  findOne(id: string): CheckinResponseEntity {
    const normalizedId = cleanText(id);
    const record =
      this.data.checkinResponses.find((entry) => entry.id === normalizedId) ?? null;

    if (!record) {
      throw new NotFoundException('Check-in response not found.');
    }

    return record;
  }

  create(createCheckinResponseDto: CreateCheckinResponseDto): CheckinResponseEntity {
    const checkin = this.wellnessCheckinsService.findOne(
      createCheckinResponseDto.checkinId,
    );
    const expert = this.resolveExpert(createCheckinResponseDto.expertId);
    const message = cleanText(createCheckinResponseDto.message);

    if (!expert) {
      throw new BadRequestException('Expert session not found.');
    }

    if (!message) {
      throw new BadRequestException(
        'Please enter a message before sending your response.',
      );
    }

    const record = this.normalizeResponseRecord({
      ...createCheckinResponseDto,
      checkinId: checkin.id,
      checkinType: cleanText(createCheckinResponseDto.checkinType) || checkin.checkinType,
      employeeId: cleanText(createCheckinResponseDto.employeeId) || checkin.employeeId,
      employeeName:
        cleanText(createCheckinResponseDto.employeeName) || checkin.employeeName,
      expertId: cleanText(createCheckinResponseDto.expertId) || expert.id,
      expertName: cleanText(createCheckinResponseDto.expertName) || expert.name,
      companyId: cleanText(createCheckinResponseDto.companyId) || checkin.companyId,
      companyName:
        cleanText(createCheckinResponseDto.companyName) || checkin.companyName,
      createdAt: new Date().toISOString(),
      message,
    });

    this.data.checkinResponses.unshift(record);
    return record;
  }

  update(id: string, updateCheckinResponseDto: UpdateCheckinResponseDto): CheckinResponseEntity {
    const currentRecord = this.findOne(id);
    const nextMessage = Object.prototype.hasOwnProperty.call(
      updateCheckinResponseDto,
      'message',
    )
      ? cleanText(updateCheckinResponseDto.message)
      : currentRecord.message;

    if (!nextMessage) {
      throw new BadRequestException(
        'Please enter a message before sending your response.',
      );
    }

    const mergedRecord = this.normalizeResponseRecord({
      ...currentRecord,
      ...updateCheckinResponseDto,
      id: currentRecord.id,
      createdAt: currentRecord.createdAt,
      message: nextMessage,
    });

    const recordIndex = this.data.checkinResponses.findIndex(
      (entry) => entry.id === currentRecord.id,
    );
    this.data.checkinResponses[recordIndex] = mergedRecord;

    return mergedRecord;
  }

  remove(id: string): CheckinResponseEntity {
    const record = this.findOne(id);
    const recordIndex = this.data.checkinResponses.findIndex(
      (entry) => entry.id === record.id,
    );

    this.data.checkinResponses.splice(recordIndex, 1);
    return record;
  }

  private normalizeResponseRecord(
    record: Partial<CheckinResponseEntity>,
  ): CheckinResponseEntity {
    return {
      id: cleanText(record.id) || `response-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      checkinId: cleanText(record.checkinId),
      checkinType: cleanText(record.checkinType),
      employeeId: cleanText(record.employeeId),
      employeeName: cleanText(record.employeeName) || 'Employee',
      expertId: cleanText(record.expertId),
      expertName: cleanText(record.expertName) || 'Wellness Expert',
      companyId: cleanText(record.companyId),
      companyName: cleanText(record.companyName),
      message: cleanText(record.message),
      createdAt: cleanText(record.createdAt) || new Date().toISOString(),
    };
  }

  private resolveExpert(expertId?: string) {
    const normalizedExpertId = cleanText(expertId);
    if (!normalizedExpertId) {
      return null;
    }

    try {
      return this.expertsService.findOne(normalizedExpertId);
    } catch (error) {
      return null;
    }
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

  private matchesCompanyContext(
    record: { companyId?: string; companyName?: string },
    companyContext: { companyId?: string; companyName?: string },
  ): boolean {
    const normalizedContext = this.createCompanyContext(companyContext);
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

  private sortByNewest(records: CheckinResponseEntity[]) {
    return [...records].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }
}

