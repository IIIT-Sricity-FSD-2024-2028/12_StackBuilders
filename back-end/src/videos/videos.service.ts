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
import { ExpertsService } from '../experts/experts.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoEntity } from './entities/video.entity';

const ALLOWED_VIDEO_CATEGORIES = new Set([
  'Health Related',
  'Mind Relaxation',
  'Physical Wellness',
]);

@Injectable()
export class VideosService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
    private readonly expertsService: ExpertsService,
  ) {}

  findAll(filters?: {
    creatorExpertId?: string;
    companyId?: string;
    companyName?: string;
    category?: string;
  }): VideoEntity[] {
    let videos = [...this.data.videos];

    if (filters?.creatorExpertId) {
      const normalizedCreatorExpertId = cleanText(filters.creatorExpertId);
      videos = videos.filter(
        (video) => cleanText(video.creatorExpertId) === normalizedCreatorExpertId,
      );
    }

    if (filters?.category) {
      const normalizedCategory = normalizeLookupValue(filters.category);
      videos = videos.filter(
        (video) => normalizeLookupValue(video.category) === normalizedCategory,
      );
    }

    if (filters?.companyId || filters?.companyName) {
      const companyContext = this.createCompanyContext(filters);
      videos = videos.filter((video) =>
        this.matchesCompanyContext(video, companyContext),
      );
    }

    return this.sortByNewest(videos);
  }

  findOne(id: string): VideoEntity {
    const normalizedId = cleanText(id);
    const video =
      this.data.videos.find((entry) => cleanText(entry.id) === normalizedId) ??
      null;

    if (!video) {
      throw new NotFoundException('Video not found.');
    }

    return video;
  }

  create(createVideoDto: CreateVideoDto): VideoEntity {
    const expert = this.resolveExpertReference(createVideoDto.creatorExpertId);
    const company = this.resolveCompanyReference(
      createVideoDto.companyId,
      createVideoDto.companyName,
      expert?.id,
    );

    const preparedVideo = this.prepareVideoInput(createVideoDto, expert, company);

    const video: VideoEntity = {
      id: createPrefixedRecordId('video'),
      title: preparedVideo.title,
      category: preparedVideo.category,
      duration: preparedVideo.duration,
      videoLink: preparedVideo.videoLink,
      thumbnailLink: preparedVideo.thumbnailLink,
      description: preparedVideo.description,
      createdAt: preparedVideo.createdAt,
      creatorExpertId: preparedVideo.creatorExpertId,
      creatorExpertName: preparedVideo.creatorExpertName,
      companyId: preparedVideo.companyId,
      companyName: preparedVideo.companyName,
    };

    this.data.videos.unshift(video);
    return video;
  }

  update(id: string, updateVideoDto: UpdateVideoDto): VideoEntity {
    const currentVideo = this.findOne(id);
    const hasCreatorExpertId = Object.prototype.hasOwnProperty.call(
      updateVideoDto,
      'creatorExpertId',
    );
    const nextCreatorExpertId = hasCreatorExpertId
      ? cleanText(updateVideoDto.creatorExpertId)
      : currentVideo.creatorExpertId;
    const expert = this.resolveExpertReference(nextCreatorExpertId, true);
    const hasCompanyId =
      Object.prototype.hasOwnProperty.call(updateVideoDto, 'companyId');
    const hasCompanyName =
      Object.prototype.hasOwnProperty.call(updateVideoDto, 'companyName');
    const company = hasCompanyId || hasCompanyName || hasCreatorExpertId
      ? this.resolveCompanyReference(
          hasCompanyId ? updateVideoDto.companyId : currentVideo.companyId,
          hasCompanyName ? updateVideoDto.companyName : currentVideo.companyName,
          nextCreatorExpertId,
        )
      : this.resolveCompanyReference(
          currentVideo.companyId,
          currentVideo.companyName,
          currentVideo.creatorExpertId,
        );

    const nextTitle = Object.prototype.hasOwnProperty.call(updateVideoDto, 'title')
      ? cleanText(updateVideoDto.title)
      : currentVideo.title;
    const nextCategory = Object.prototype.hasOwnProperty.call(
      updateVideoDto,
      'category',
    )
      ? cleanText(updateVideoDto.category)
      : currentVideo.category;
    const nextDuration = Object.prototype.hasOwnProperty.call(
      updateVideoDto,
      'duration',
    )
      ? cleanText(updateVideoDto.duration)
      : currentVideo.duration;
    const nextVideoLink = Object.prototype.hasOwnProperty.call(
      updateVideoDto,
      'videoLink',
    )
      ? cleanText(updateVideoDto.videoLink)
      : currentVideo.videoLink;
    const nextThumbnailLink = Object.prototype.hasOwnProperty.call(
      updateVideoDto,
      'thumbnailLink',
    )
      ? cleanText(updateVideoDto.thumbnailLink)
      : currentVideo.thumbnailLink;
    const nextDescription = Object.prototype.hasOwnProperty.call(
      updateVideoDto,
      'description',
    )
      ? cleanText(updateVideoDto.description)
      : currentVideo.description;

    this.assertVideoFields({
      title: nextTitle,
      category: nextCategory,
      duration: nextDuration,
      videoLink: nextVideoLink,
      thumbnailLink: nextThumbnailLink,
      description: nextDescription,
    });

    currentVideo.title = nextTitle;
    currentVideo.category = nextCategory;
    currentVideo.duration = nextDuration;
    currentVideo.videoLink = nextVideoLink;
    currentVideo.thumbnailLink = nextThumbnailLink;
    currentVideo.description = nextDescription;
    currentVideo.creatorExpertId = cleanText(expert?.id || nextCreatorExpertId);
    currentVideo.creatorExpertName = cleanText(expert?.name) || 'Wellness Expert';
    currentVideo.companyId = company.id;
    currentVideo.companyName = company.name;

    return currentVideo;
  }

  remove(id: string): VideoEntity {
    const video = this.findOne(id);
    const videoIndex = this.data.videos.findIndex(
      (entry) => cleanText(entry.id) === cleanText(video.id),
    );

    this.data.videos.splice(videoIndex, 1);
    return video;
  }

  private prepareVideoInput(
    createVideoDto: CreateVideoDto,
    expert: ReturnType<VideosService['resolveExpertReference']>,
    company: { id: string; name: string },
  ) {
    const title = cleanText(createVideoDto.title);
    const category = cleanText(createVideoDto.category);
    const duration = cleanText(createVideoDto.duration);
    const videoLink = cleanText(createVideoDto.videoLink);
    const thumbnailLink = cleanText(createVideoDto.thumbnailLink);
    const description = cleanText(createVideoDto.description);
    const creatorExpertId = cleanText(createVideoDto.creatorExpertId || expert?.id);
    const createdAt = new Date().toISOString();

    this.assertVideoFields({
      title,
      category,
      duration,
      videoLink,
      thumbnailLink,
      description,
    });

    return {
      title,
      category,
      duration,
      videoLink,
      thumbnailLink,
      description,
      createdAt,
      creatorExpertId,
      creatorExpertName: cleanText(expert?.name) || 'Wellness Expert',
      companyId: company.id,
      companyName: company.name,
    };
  }

  private assertVideoFields(fields: {
    title: string;
    category: string;
    duration: string;
    videoLink: string;
    thumbnailLink: string;
    description: string;
  }): void {
    if (
      !fields.title ||
      !fields.category ||
      !fields.duration ||
      !fields.videoLink ||
      !fields.thumbnailLink ||
      !fields.description
    ) {
      throw new BadRequestException(
        'Please complete all video fields before saving.',
      );
    }

    if (!ALLOWED_VIDEO_CATEGORIES.has(fields.category)) {
      throw new BadRequestException(
        'Choose Health Related, Mind Relaxation, or Physical Wellness for the video category.',
      );
    }

    if (!this.isValidHttpUrl(fields.videoLink)) {
      throw new BadRequestException(
        'Enter a valid video link that starts with http:// or https://.',
      );
    }

    if (!this.isValidHttpUrl(fields.thumbnailLink)) {
      throw new BadRequestException(
        'Enter a valid thumbnail link that starts with http:// or https://.',
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

  private resolveExpertReference(
    creatorExpertId?: string,
    allowMissing = false,
  ) {
    const normalizedCreatorExpertId = cleanText(creatorExpertId);

    if (!normalizedCreatorExpertId) {
      return null;
    }

    try {
      return this.expertsService.findOne(normalizedCreatorExpertId);
    } catch (error) {
      if (allowMissing && error instanceof NotFoundException) {
        return null;
      }

      throw new BadRequestException('Select a valid wellness expert for the video.');
    }
  }

  private resolveCompanyReference(
    companyId?: string,
    companyName?: string,
    creatorExpertId?: string,
  ) {
    const normalizedCompanyId = cleanText(companyId);
    const normalizedCompanyName = normalizeLookupValue(companyName);
    const normalizedCreatorExpertId = cleanText(creatorExpertId);
    const companies = this.companiesService.findAll();

    const companyFromRequest =
      companies.find(
        (entry) => normalizedCompanyId && cleanText(entry.id) === normalizedCompanyId,
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

    if (normalizedCreatorExpertId) {
      const expert =
        this.data.experts.find(
          (entry) => cleanText(entry.id) === normalizedCreatorExpertId,
        ) ?? null;

      if (!expert) {
        throw new BadRequestException('Select a valid wellness expert for the video.');
      }

      const companyFromExpert =
        companies.find((entry) => cleanText(entry.id) === cleanText(expert.companyId)) ??
        companies.find(
          (entry) =>
            normalizeLookupValue(entry.name) ===
            normalizeLookupValue(expert.companyName),
        ) ??
        null;

      if (companyFromExpert) {
        return companyFromExpert;
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

  private sortByNewest(records: VideoEntity[]) {
    return [...records].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }
}
