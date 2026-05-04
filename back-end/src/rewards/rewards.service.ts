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
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardEntity } from './entities/reward.entity';

@Injectable()
export class RewardsService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
  ) {}

  findAll(filters?: {
    creatorHrId?: string;
    companyId?: string;
    companyName?: string;
  }): RewardEntity[] {
    let records = [...this.data.rewards];

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

  findOne(id: string): RewardEntity {
    const normalizedId = cleanText(id);
    const record =
      this.data.rewards.find((entry) => entry.id === normalizedId) ?? null;

    if (!record) {
      throw new NotFoundException('Reward not found.');
    }

    return record;
  }

  create(createRewardDto: CreateRewardDto): RewardEntity {
    const company = this.resolveCompanyReference(
      createRewardDto.companyId,
      createRewardDto.companyName,
      createRewardDto.creatorHrId,
    );
    const preparedInput = this.prepareRewardInput(createRewardDto, company);

    const reward: RewardEntity = {
      id: createPrefixedRecordId('reward'),
      imageUrl: preparedInput.imageUrl,
      name: preparedInput.name,
      description: preparedInput.description,
      points: preparedInput.points,
      claimableCount: preparedInput.claimableCount,
      claimedCount: preparedInput.claimedCount,
      createdAt: preparedInput.createdAt,
      creatorHrId: preparedInput.creatorHrId,
      companyId: preparedInput.companyId,
      companyName: preparedInput.companyName,
    };

    this.data.rewards.unshift(reward);
    return reward;
  }

  update(id: string, updateRewardDto: UpdateRewardDto): RewardEntity {
    const currentReward = this.findOne(id);
    const hasCompanyId =
      Object.prototype.hasOwnProperty.call(updateRewardDto, 'companyId');
    const hasCompanyName =
      Object.prototype.hasOwnProperty.call(updateRewardDto, 'companyName');
    const hasCreatorHrId =
      Object.prototype.hasOwnProperty.call(updateRewardDto, 'creatorHrId');
    const company = hasCompanyId || hasCompanyName || hasCreatorHrId
      ? this.resolveCompanyReference(
          hasCompanyId ? updateRewardDto.companyId : currentReward.companyId,
          hasCompanyName ? updateRewardDto.companyName : currentReward.companyName,
          hasCreatorHrId
            ? updateRewardDto.creatorHrId
            : currentReward.creatorHrId,
        )
      : this.resolveCompanyReference(
          currentReward.companyId,
          currentReward.companyName,
          currentReward.creatorHrId,
        );

    const nextImageUrl = Object.prototype.hasOwnProperty.call(
      updateRewardDto,
      'imageUrl',
    )
      ? cleanText(updateRewardDto.imageUrl)
      : currentReward.imageUrl;
    const nextName = Object.prototype.hasOwnProperty.call(updateRewardDto, 'name')
      ? cleanText(updateRewardDto.name)
      : currentReward.name;
    const nextDescription = Object.prototype.hasOwnProperty.call(
      updateRewardDto,
      'description',
    )
      ? cleanText(updateRewardDto.description)
      : currentReward.description;
    const nextPoints = Object.prototype.hasOwnProperty.call(
      updateRewardDto,
      'points',
    )
      ? cleanText(updateRewardDto.points)
      : currentReward.points;
    const nextClaimableCount = Object.prototype.hasOwnProperty.call(
      updateRewardDto,
      'claimableCount',
    )
      ? cleanText(updateRewardDto.claimableCount)
      : currentReward.claimableCount;
    const nextClaimedCount = Object.prototype.hasOwnProperty.call(
      updateRewardDto,
      'claimedCount',
    )
      ? cleanText(updateRewardDto.claimedCount)
      : currentReward.claimedCount;
    const nextCreatorHrId = Object.prototype.hasOwnProperty.call(
      updateRewardDto,
      'creatorHrId',
    )
      ? cleanText(updateRewardDto.creatorHrId)
      : currentReward.creatorHrId;

    this.assertRewardFields({
      imageUrl: nextImageUrl,
      name: nextName,
      description: nextDescription,
      points: nextPoints,
      claimableCount: nextClaimableCount,
      claimedCount: nextClaimedCount,
    });

    currentReward.imageUrl = nextImageUrl;
    currentReward.name = nextName;
    currentReward.description = nextDescription;
    currentReward.points = nextPoints;
    currentReward.claimableCount = nextClaimableCount;
    currentReward.claimedCount = nextClaimedCount;
    currentReward.creatorHrId = nextCreatorHrId;
    currentReward.companyId = company.id;
    currentReward.companyName = company.name;

    return currentReward;
  }

  remove(id: string): RewardEntity {
    const reward = this.findOne(id);
    const rewardIndex = this.data.rewards.findIndex(
      (entry) => entry.id === reward.id,
    );

    this.data.rewards.splice(rewardIndex, 1);
    return reward;
  }

  claimReward(id: string, employeeId: string) {
    const reward = this.findOne(id);
    const normalizedEmployeeId = cleanText(employeeId);
    const employee =
      this.data.employees.find((entry) => entry.id === normalizedEmployeeId) ??
      null;

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    if (
      !this.matchesCompanyContext(reward, {
        companyId: employee.companyId,
        companyName: employee.companyName,
      })
    ) {
      throw new BadRequestException(
        'This reward does not belong to the employee company.',
      );
    }

    const employeeBalance = this.parseNonNegativeInteger(
      employee.rewardPointsBalance || '500',
      'Reward points balance',
    );
    const rewardCost = this.parsePositiveInteger(
      reward.points,
      'Points needed',
    );
    const claimableCount = this.parsePositiveInteger(
      reward.claimableCount,
      'Claimable count',
    );
    const claimedCount = this.parseNonNegativeInteger(
      reward.claimedCount,
      'Claimed count',
    );
    const claimedRewardIds = Array.isArray(employee.claimedRewardIds)
      ? [...new Set(employee.claimedRewardIds.map((entry) => cleanText(entry)).filter(Boolean))]
      : [];

    if (claimedRewardIds.includes(reward.id)) {
      throw new BadRequestException('This reward has already been claimed.');
    }

    if (claimedCount >= claimableCount) {
      throw new BadRequestException('This reward is no longer available to claim.');
    }

    if (rewardCost > employeeBalance) {
      throw new BadRequestException(
        'You do not have enough points to claim this reward.',
      );
    }

    claimedRewardIds.push(reward.id);
    employee.rewardPointsBalance = String(employeeBalance - rewardCost);
    employee.claimedRewardIds = claimedRewardIds;
    employee.updatedAt = new Date().toISOString();
    reward.claimedCount = String(claimedCount + 1);

    return {
      reward,
      employee,
    };
  }

  private prepareRewardInput(
    createRewardDto: CreateRewardDto,
    company: { id: string; name: string },
  ) {
    const imageUrl = cleanText(createRewardDto.imageUrl);
    const name = cleanText(createRewardDto.name);
    const description = cleanText(createRewardDto.description);
    const points = cleanText(createRewardDto.points);
    const claimableCount = cleanText(createRewardDto.claimableCount);
    const claimedCount = cleanText(createRewardDto.claimedCount) || '0';
    const creatorHrId = cleanText(createRewardDto.creatorHrId);
    const createdAt = new Date().toISOString();

    this.assertRewardFields({
      imageUrl,
      name,
      description,
      points,
      claimableCount,
      claimedCount,
    });

    return {
      imageUrl,
      name,
      description,
      points,
      claimableCount,
      claimedCount,
      creatorHrId,
      companyId: company.id,
      companyName: company.name,
      createdAt,
    };
  }

  private assertRewardFields(fields: {
    imageUrl: string;
    name: string;
    description: string;
    points: string;
    claimableCount: string;
    claimedCount: string;
  }): void {
    if (
      !fields.imageUrl ||
      !fields.name ||
      !fields.description ||
      !fields.points ||
      !fields.claimableCount
    ) {
      throw new BadRequestException(
        'Please complete all reward fields before saving.',
      );
    }

    if (!this.isPositiveIntegerValue(fields.points)) {
      throw new BadRequestException(
        'Points needed must be a positive whole number.',
      );
    }

    if (!this.isValidHttpUrl(fields.imageUrl)) {
      throw new BadRequestException(
        'Enter a valid reward image URL that starts with http:// or https://.',
      );
    }

    const claimableCount = Number(fields.claimableCount);
    if (!Number.isInteger(claimableCount) || claimableCount < 1) {
      throw new BadRequestException(
        'The number of people who can claim the reward must be at least 1.',
      );
    }

    const claimedCount = Number(fields.claimedCount);
    if (!Number.isInteger(claimedCount) || claimedCount < 0) {
      throw new BadRequestException(
        'The claimed reward count must be 0 or a positive whole number.',
      );
    }

    if (claimedCount > claimableCount) {
      throw new BadRequestException(
        'The claimed reward count cannot exceed the claimable reward count.',
      );
    }
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  private isPositiveIntegerValue(value: string): boolean {
    const raw = cleanText(value);
    if (!raw) {
      return false;
    }

    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0;
  }

  private parsePositiveInteger(value: string, label: string): number {
    const parsed = Number(cleanText(value));
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${label} must be a positive whole number.`);
    }

    return parsed;
  }

  private parseNonNegativeInteger(value: string, label: string): number {
    const parsed = Number(cleanText(value));
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(`${label} must be 0 or a positive whole number.`);
    }

    return parsed;
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
        throw new BadRequestException('Select a valid HR profile for the reward.');
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

  private sortByNewest(records: RewardEntity[]) {
    return [...records].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }
}
