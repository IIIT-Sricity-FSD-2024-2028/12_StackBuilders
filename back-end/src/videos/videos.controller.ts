import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../common/constants/roles';
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoEntity } from './entities/video.entity';
import { VideosService } from './videos.service';
import { diskStorage } from 'multer';
import { mkdirSync, openSync, readSync, closeSync, rmSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_VIDEO_FILE_SIZE = 250 * 1024 * 1024;
const MAX_THUMBNAIL_FILE_SIZE = 10 * 1024 * 1024;
const VIDEO_UPLOAD_OPTIONS = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const directory = join(process.cwd(), 'uploads', file.fieldname === 'videoFile' ? 'videos' : 'thumbnails');
      mkdirSync(directory, { recursive: true });
      callback(null, directory);
    },
    filename: (req, file, callback) => {
      const extension = file.fieldname === 'videoFile'
        ? '.mp4'
        : file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: MAX_VIDEO_FILE_SIZE, files: 2 },
  fileFilter: (req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    const isMp4 = file.fieldname === 'videoFile' && file.mimetype === 'video/mp4' && extension === '.mp4';
    const isThumbnail = file.fieldname === 'thumbnailFile' && (
      (file.mimetype === 'image/jpeg' && ['.jpg', '.jpeg'].includes(extension)) ||
      (file.mimetype === 'image/png' && extension === '.png') ||
      (file.mimetype === 'image/webp' && extension === '.webp')
    );
    if (!isMp4 && !isThumbnail) {
      callback(new BadRequestException('Upload an MP4 video and/or a PNG, JPEG, or WebP thumbnail.') as unknown as Error, false);
      return;
    }
    callback(null, true);
  },
};

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List company video library records' })
  @ApiQuery({ name: 'creatorExpertId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiOkResponse({ type: VideoEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('creatorExpertId') creatorExpertId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
    @Query('category') category?: string,
  ) {
    return this.videosService.findAll({
      creatorExpertId,
      companyId,
      companyName,
      category,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a company video by id' })
  @ApiOkResponse({ type: VideoEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Video not found.' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnailFile', maxCount: 1 },
  ], VIDEO_UPLOAD_OPTIONS))
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a company video' })
  @ApiCreatedResponse({ type: VideoEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted video payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(
    @Body() createVideoDto: CreateVideoDto,
    @UploadedFiles() files: { videoFile?: Express.Multer.File[]; thumbnailFile?: Express.Multer.File[] },
  ) {
    const videoFile = files?.videoFile?.[0];
    const thumbnailFile = files?.thumbnailFile?.[0];
    try {
      if (videoFile) {
        if (videoFile.size < 12 || videoFile.size > MAX_VIDEO_FILE_SIZE || !hasMp4Signature(videoFile.path)) {
          throw new BadRequestException('The uploaded file is not a valid MP4 video.');
        }
        createVideoDto.videoLink = '';
        createVideoDto.videoFileUrl = `/media/videos/${videoFile.filename}`;
      }
      if (thumbnailFile) {
        if (thumbnailFile.size > MAX_THUMBNAIL_FILE_SIZE || !hasImageSignature(thumbnailFile.path, thumbnailFile.mimetype)) {
          throw new BadRequestException('The thumbnail must be a valid PNG, JPEG, or WebP image under 10 MB.');
        }
        createVideoDto.thumbnailLink = `/media/thumbnails/${thumbnailFile.filename}`;
      }
      return this.videosService.create(createVideoDto);
    } catch (error) {
      if (videoFile) rmSync(videoFile.path, { force: true });
      if (thumbnailFile) rmSync(thumbnailFile.path, { force: true });
      throw error;
    }
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a company video' })
  @ApiOkResponse({ type: VideoEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted video payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Video not found.' })
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a company video' })
  @ApiOkResponse({ type: VideoEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header, or the wellness expert does not own this video.' })
  @ApiNotFoundResponse({ description: 'Video not found.' })
  remove(
    @Param('id') id: string,
    @Headers('role') role: string,
    @Headers('x-expert-id') expertId?: string,
  ) {
    return this.videosService.remove(
      id,
      role === Role.WellnessExpert ? expertId ?? '' : undefined,
    );
  }
}

function readFileHeader(filePath: string): Buffer {
  const descriptor = openSync(filePath, 'r');
  const header = Buffer.alloc(12);
  try {
    readSync(descriptor, header, 0, header.length, 0);
    return header;
  } finally {
    closeSync(descriptor);
  }
}

function hasMp4Signature(filePath: string): boolean {
  return readFileHeader(filePath).toString('ascii', 4, 8) === 'ftyp';
}

function hasImageSignature(filePath: string, mimeType: string): boolean {
  const header = readFileHeader(filePath);
  if (mimeType === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  return mimeType === 'image/webp' && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
}
