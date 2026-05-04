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
import { CompaniesService } from '../companies/companies.service';
import { ChallengeEntity } from './entities/challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
  ) {}

  findAll(filters?: {
    type?: string;
    creatorHrId?: string;
    companyId?: string;
    companyName?: string;
  }): ChallengeEntity[] {
    let records = [...this.data.challenges];

    if (filters?.type) {
      const normalizedType = normalizeLookupValue(filters.type);
      records = records.filter(
        (record) => normalizeLookupValue(record.type) === normalizedType,
      );
    }

    if (filters?.creatorHrId) {
      const normalizedCreatorHrId = cleanText(filters.creatorHrId);
      records = records.filter(
        (record) => cleanText(record.creatorHrId) === normalizedCreatorHrId,
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

  findOne(id: string): ChallengeEntity {
    const normalizedId = cleanText(id);
    const record =
      this.data.challenges.find((entry) => entry.id === normalizedId) ?? null;

    if (!record) {
      throw new NotFoundException('Challenge not found.');
    }

    return record;
  }

  create(createChallengeDto: CreateChallengeDto): ChallengeEntity {
    const company = this.resolveCompanyReference(
      createChallengeDto.companyId,
      createChallengeDto.companyName,
      createChallengeDto.creatorHrId,
    );
    const preparedInput = this.prepareChallengeInput(createChallengeDto, company);

    const challenge: ChallengeEntity = {
      id: createPrefixedRecordId('challenge'),
      name: preparedInput.name,
      type: preparedInput.type,
      reward: preparedInput.reward,
      deadline: preparedInput.deadline,
      goal: preparedInput.goal,
      createdAt: preparedInput.createdAt,
      creatorHrId: preparedInput.creatorHrId,
      companyId: preparedInput.companyId,
      companyName: preparedInput.companyName,
    };

    this.data.challenges.unshift(challenge);
    return challenge;
  }

  update(id: string, updateChallengeDto: UpdateChallengeDto): ChallengeEntity {
    const currentChallenge = this.findOne(id);
    const hasCompanyId =
      Object.prototype.hasOwnProperty.call(updateChallengeDto, 'companyId');
    const hasCompanyName =
      Object.prototype.hasOwnProperty.call(updateChallengeDto, 'companyName');
    const hasCreatorHrId =
      Object.prototype.hasOwnProperty.call(updateChallengeDto, 'creatorHrId');
    const company = hasCompanyId || hasCompanyName || hasCreatorHrId
      ? this.resolveCompanyReference(
          hasCompanyId ? updateChallengeDto.companyId : currentChallenge.companyId,
          hasCompanyName
            ? updateChallengeDto.companyName
            : currentChallenge.companyName,
          hasCreatorHrId
            ? updateChallengeDto.creatorHrId
            : currentChallenge.creatorHrId,
        )
      : this.resolveCompanyReference(
          currentChallenge.companyId,
          currentChallenge.companyName,
          currentChallenge.creatorHrId,
        );

    const nextName = Object.prototype.hasOwnProperty.call(updateChallengeDto, 'name')
      ? cleanText(updateChallengeDto.name)
      : currentChallenge.name;
    const nextType = Object.prototype.hasOwnProperty.call(updateChallengeDto, 'type')
      ? cleanText(updateChallengeDto.type)
      : currentChallenge.type;
    const nextReward = Object.prototype.hasOwnProperty.call(
      updateChallengeDto,
      'reward',
    )
      ? cleanText(updateChallengeDto.reward)
      : currentChallenge.reward;
    const nextDeadline = Object.prototype.hasOwnProperty.call(
      updateChallengeDto,
      'deadline',
    )
      ? cleanText(updateChallengeDto.deadline)
      : currentChallenge.deadline;
    const nextGoal = Object.prototype.hasOwnProperty.call(updateChallengeDto, 'goal')
      ? cleanText(updateChallengeDto.goal)
      : currentChallenge.goal;
    const nextCreatorHrId = Object.prototype.hasOwnProperty.call(
      updateChallengeDto,
      'creatorHrId',
    )
      ? cleanText(updateChallengeDto.creatorHrId)
      : currentChallenge.creatorHrId;

    this.assertChallengeFields({
      name: nextName,
      type: nextType,
      reward: nextReward,
      deadline: nextDeadline,
      goal: nextGoal,
    });

    currentChallenge.name = nextName;
    currentChallenge.type = nextType;
    currentChallenge.reward = nextReward;
    currentChallenge.deadline = nextDeadline;
    currentChallenge.goal = nextGoal;
    currentChallenge.creatorHrId = nextCreatorHrId;
    currentChallenge.companyId = company.id;
    currentChallenge.companyName = company.name;

    return currentChallenge;
  }

  remove(id: string): ChallengeEntity {
    const challenge = this.findOne(id);
    const challengeIndex = this.data.challenges.findIndex(
      (entry) => entry.id === challenge.id,
    );

    this.data.challenges.splice(challengeIndex, 1);
    return challenge;
  }

  private prepareChallengeInput(
    createChallengeDto: CreateChallengeDto,
    company: { id: string; name: string },
  ) {
    const name = cleanText(createChallengeDto.name);
    const type = cleanText(createChallengeDto.type);
    const reward = cleanText(createChallengeDto.reward);
    const deadline = cleanText(createChallengeDto.deadline);
    const goal = cleanText(createChallengeDto.goal);
    const creatorHrId = cleanText(createChallengeDto.creatorHrId);
    const createdAt = new Date().toISOString();

    this.assertChallengeFields({
      name,
      type,
      reward,
      deadline,
      goal,
    });

    return {
      name,
      type,
      reward,
      deadline,
      goal,
      creatorHrId,
      companyId: company.id,
      companyName: company.name,
      createdAt,
    };
  }

  private assertChallengeFields(fields: {
    name: string;
    type: string;
    reward: string;
    deadline: string;
    goal: string;
  }): void {
    if (!fields.name || !fields.type || !fields.reward || !fields.goal) {
      throw new BadRequestException(
        'Please complete all challenge fields before saving.',
      );
    }

    if (!this.isPositiveIntegerValue(fields.reward)) {
      throw new BadRequestException(
        'Challenge reward must be a positive whole number.',
      );
    }

    if (fields.deadline && this.isPastDateValue(fields.deadline)) {
      throw new BadRequestException(
        'Challenge deadline must be today or a future date.',
      );
    }
  }

  private isPastDateValue(value: string): boolean {
    const raw = cleanText(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return true;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Number.isNaN(date.getTime()) || date < today;
  }

  private isPositiveIntegerValue(value: string): boolean {
    const raw = cleanText(value);
    if (!raw) {
      return false;
    }

    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0;
  }

  private resolveCompanyReference(
    companyId?: string,
    companyName?: string,
    creatorHrId?: string,
  ) {
    const normalizedCompanyId = cleanText(companyId);
    const normalizedCompanyName = normalizeLookupValue(companyName);
    const normalizedCreatorHrId = cleanText(creatorHrId);
    const companies = this.companiesService.findAll();

    const companyFromRequest =
      companies.find(
        (entry) => normalizedCompanyId && entry.id === normalizedCompanyId,
      ) ??
      companies.find(
        (entry) =>
          normalizedCompanyName &&
          normalizeLookupValue(entry.name) === normalizedCompanyName,
      ) ??
      null;

    if (companyFromRequest) {
      return companyFromRequest;
    }

    if (normalizedCreatorHrId) {
      const hrProfile =
        this.data.hrProfiles.find(
          (profile) => cleanText(profile.id) === normalizedCreatorHrId,
        ) ?? null;

      if (!hrProfile) {
        throw new BadRequestException('Select a valid HR profile for the challenge.');
      }

      const companyFromHr =
        companies.find((entry) => entry.id === cleanText(hrProfile.companyId)) ??
        companies.find(
          (entry) =>
            normalizeLookupValue(entry.name) ===
            normalizeLookupValue(hrProfile.companyName),
        ) ??
        null;

      if (companyFromHr) {
        return companyFromHr;
      }
    }

    throw new BadRequestException(
      'Select a valid company name that already exists.',
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

  private sortByNewest(records: ChallengeEntity[]) {
    return [...records].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }
}
