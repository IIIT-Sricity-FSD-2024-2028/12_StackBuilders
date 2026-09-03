import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { cleanText, normalizeLookupValue } from '../common/utils/record.utils';
import { EmployeesService } from '../employees/employees.service';
import { CreateWellnessCheckinDto } from './dto/create-wellness-checkin.dto';
import { UpdateWellnessCheckinDto } from './dto/update-wellness-checkin.dto';
import { WellnessCheckinEntity } from './entities/wellness-checkin.entity';
import {
  ALL_TRACK_FIELD_NAMES,
  TRACK_CONFIG,
  TrackDefinition,
  TrackField,
  TrackKey,
} from './constants/track-config';

@Injectable()
export class WellnessCheckinsService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly employeesService: EmployeesService,
  ) {}

  findAll(filters?: {
    checkinType?: string;
    employeeId?: string;
    companyId?: string;
    companyName?: string;
  }): WellnessCheckinEntity[] {
    let records = [...this.data.wellnessCheckins];

    if (filters?.checkinType) {
      const track = this.normalizeTrackKey(filters.checkinType);
      records = records.filter(
        (record) => this.normalizeTrackKey(record.checkinType) === track,
      );
    }

    if (filters?.employeeId) {
      const normalizedEmployeeId = cleanText(filters.employeeId);
      records = records.filter(
        (record) => cleanText(record.employeeId) === normalizedEmployeeId,
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

  findOne(id: string): WellnessCheckinEntity {
    const normalizedId = cleanText(id);
    const record =
      this.data.wellnessCheckins.find((entry) => entry.id === normalizedId) ?? null;

    if (!record) {
      throw new NotFoundException('Wellness check-in not found.');
    }

    return record;
  }

  create(createWellnessCheckinDto: CreateWellnessCheckinDto): WellnessCheckinEntity {
    const currentEmployee = this.resolveEmployee(createWellnessCheckinDto.employeeId);
    if (!currentEmployee) {
      throw new BadRequestException('Employee session not found.');
    }

    const track = this.normalizeTrackKey(createWellnessCheckinDto.checkinType);
    const config = this.getTrackConfig(track);

    if (!config) {
      throw new BadRequestException('Unsupported check-in type.');
    }

    this.validateCheckinPayload(config, createWellnessCheckinDto);

    const record = this.normalizeCheckinRecord({
      ...createWellnessCheckinDto,
      checkinType: track,
      employeeId: cleanText(createWellnessCheckinDto.employeeId) || currentEmployee.id,
      employeeName:
        cleanText(createWellnessCheckinDto.employeeName) || currentEmployee.name,
      employeeEmail:
        cleanText(createWellnessCheckinDto.employeeEmail) || currentEmployee.email,
      companyId:
        cleanText(createWellnessCheckinDto.companyId) || currentEmployee.companyId,
      companyName:
        cleanText(createWellnessCheckinDto.companyName) || currentEmployee.companyName,
      submittedAt: new Date().toISOString(),
    });

    this.data.wellnessCheckins.unshift(record);
    return record;
  }

  update(id: string, updateWellnessCheckinDto: UpdateWellnessCheckinDto): WellnessCheckinEntity {
    const currentRecord = this.findOne(id);
    const nextTrack = Object.prototype.hasOwnProperty.call(
      updateWellnessCheckinDto,
      'checkinType',
    )
      ? this.normalizeTrackKey(updateWellnessCheckinDto.checkinType)
      : this.normalizeTrackKey(currentRecord.checkinType);
    const config = this.getTrackConfig(nextTrack);

    if (!config) {
      throw new BadRequestException('Unsupported check-in type.');
    }

    const mergedRecord = {
      ...currentRecord,
      ...updateWellnessCheckinDto,
      id: currentRecord.id,
      submittedAt: currentRecord.submittedAt,
      checkinType: nextTrack,
    };

    this.validateCheckinPayload(config, mergedRecord);

    const normalizedRecord = this.normalizeCheckinRecord(mergedRecord);
    const recordIndex = this.data.wellnessCheckins.findIndex(
      (entry) => entry.id === currentRecord.id,
    );
    this.data.wellnessCheckins[recordIndex] = normalizedRecord;

    return normalizedRecord;
  }

  remove(id: string): WellnessCheckinEntity {
    const record = this.findOne(id);
    const recordIndex = this.data.wellnessCheckins.findIndex(
      (entry) => entry.id === record.id,
    );

    this.data.wellnessCheckins.splice(recordIndex, 1);
    return record;
  }

  private normalizeTrackKey(value: unknown): TrackKey | string {
    const raw = cleanText(value).toLowerCase();
    if (raw === 'diet' || raw === 'diet plan' || raw === 'dietplan') {
      return 'nutrition';
    }

    return raw;
  }

  private getTrackConfig(type: string) {
    return TRACK_CONFIG[type as TrackKey] || null;
  }

  private normalizeFieldValue(fieldName: string, value: unknown): string {
    const field = this.getField(fieldName);
    const raw = cleanText(value);

    if (!raw) {
      return '';
    }

    if (field?.inputType === 'number') {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        return '';
      }

      return String(parsed);
    }

    return raw;
  }

  private validateCheckinPayload(
    config: TrackDefinition,
    payload: Partial<WellnessCheckinEntity>,
  ): void {
    for (const field of config.fields) {
      const validation = this.validateFieldValue(field, payload[field.name]);
      if (!validation.ok) {
        throw new BadRequestException(validation.error);
      }
    }
  }

  private validateFieldValue(
    field: TrackField,
    value: unknown,
  ): { ok: boolean; error?: string } {
    const raw = cleanText(value);

    if (!raw) {
      if (field.required) {
        return {
          ok: false,
          error: `Please complete the ${field.label.toLowerCase()} field before saving.`,
        };
      }

      return { ok: true };
    }

    if (field.inputType === 'select') {
      const allowedOptions = Array.isArray(field.options) ? field.options : [];
      if (!allowedOptions.includes(raw)) {
        return {
          ok: false,
          error: `Please choose a valid option for ${field.label.toLowerCase()}.`,
        };
      }

      return { ok: true };
    }

    if (field.inputType === 'number') {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        return {
          ok: false,
          error: `${field.label} must be a valid number.`,
        };
      }

      if (typeof field.min === 'number' && parsed < field.min) {
        return {
          ok: false,
          error: `${field.label} must be at least ${field.min}.`,
        };
      }

      if (typeof field.max === 'number' && parsed > field.max) {
        return {
          ok: false,
          error: `${field.label} must be ${field.max} or less.`,
        };
      }

      if (typeof field.step === 'number' && field.step > 0) {
        const stepBase = typeof field.min === 'number' ? field.min : 0;
        const stepDelta = (parsed - stepBase) / field.step;
        if (Math.abs(stepDelta - Math.round(stepDelta)) > 1e-9) {
          return {
            ok: false,
            error: `${field.label} must use increments of ${field.step}.`,
          };
        }
      }
    }

    return { ok: true };
  }

  private normalizeCheckinRecord(
    record: Partial<WellnessCheckinEntity>,
  ): WellnessCheckinEntity {
    const track = this.normalizeTrackKey(record.checkinType);
    const submittedAt = cleanText(record.submittedAt) || new Date().toISOString();
    const employee = this.resolveEmployee(record.employeeId);
    const companyContext = this.resolveCheckinCompanyContext(record, employee);

    const normalizedRecord: WellnessCheckinEntity = {
      id: cleanText(record.id) || `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      checkinType: track,
      employeeId: cleanText(record.employeeId),
      employeeName: cleanText(record.employeeName) || employee?.name || 'Employee',
      employeeEmail: cleanText(record.employeeEmail) || employee?.email || '',
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      notes: cleanText(record.notes),
      submittedAt,
      moodScore: '',
      stressScore: '',
      sleepHours: '',
      focusScore: '',
      anxietyTrigger: '',
      supportNeeded: '',
      mealConsistency: '',
      waterIntakeLiters: '',
      energyScore: '',
      servingsCount: '',
      nutritionGoal: '',
      dietChallenge: '',
      activityMinutes: '',
      stepCount: '',
      painScore: '',
      mobilityScore: '',
      recoveryScore: '',
      workoutFocus: '',
    };

    ALL_TRACK_FIELD_NAMES.forEach((fieldName) => {
      normalizedRecord[fieldName as keyof WellnessCheckinEntity] =
        this.normalizeFieldValue(fieldName, record[fieldName as keyof WellnessCheckinEntity]) as never;
    });

    return normalizedRecord;
  }

  private resolveEmployee(employeeId?: string) {
    const normalizedEmployeeId = cleanText(employeeId);
    if (!normalizedEmployeeId) {
      return null;
    }

    try {
      return this.employeesService.findOne(normalizedEmployeeId);
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

  private resolveCheckinCompanyContext(
    record: Partial<WellnessCheckinEntity>,
    employee: { companyId?: string; companyName?: string } | null,
  ) {
    const explicitCompanyContext = this.createCompanyContext(record);
    if (this.hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const employeeCompanyContext = this.createCompanyContext(employee ?? {});
    if (this.hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    return this.createCompanyContext({});
  }

  private sortByNewest(records: WellnessCheckinEntity[]) {
    return [...records].sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
    );
  }

  private getField(fieldName: string) {
    const fields: TrackField[] = Object.values(TRACK_CONFIG).flatMap(
      (track) => track.fields,
    );

    return fields.find((field) => field.name === fieldName);
  }
}
