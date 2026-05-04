import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a company video' })
  @ApiCreatedResponse({ type: VideoEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted video payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
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
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Video not found.' })
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}
