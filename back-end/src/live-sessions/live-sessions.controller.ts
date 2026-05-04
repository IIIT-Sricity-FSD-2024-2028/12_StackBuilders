import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
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
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { LiveSessionEntity } from './entities/live-session.entity';
import { LiveSessionsService } from './live-sessions.service';

@ApiTags('live-sessions')
@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private readonly liveSessionsService: LiveSessionsService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List live sessions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'expertId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: LiveSessionEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('status') status?: string,
    @Query('expertId') expertId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return this.liveSessionsService.findAll({
      status,
      expertId,
      companyId,
      companyName,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a live session by id' })
  @ApiOkResponse({ type: LiveSessionEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Live session not found.' })
  findOne(@Param('id') id: string) {
    return this.liveSessionsService.findOne(id);
  }

  @Post()
  @Roles(Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a live session' })
  @ApiCreatedResponse({ type: LiveSessionEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted live session payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createLiveSessionDto: CreateLiveSessionDto) {
    return this.liveSessionsService.create(createLiveSessionDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.WellnessExpert, Role.Employee)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a live session' })
  @ApiOkResponse({ type: LiveSessionEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted live session payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Live session not found.' })
  update(
    @Param('id') id: string,
    @Body() updateLiveSessionDto: UpdateLiveSessionDto,
    @Headers('role') role?: string,
  ) {
    if (role === Role.Employee) {
      const allowedKeys = ['status'];
      const requestedKeys = Object.keys(updateLiveSessionDto ?? {});

      if (
        requestedKeys.some((key) => !allowedKeys.includes(key)) ||
        updateLiveSessionDto.status !== 'completed'
      ) {
        throw new ForbiddenException(
          'Employees can only mark an ongoing live session as completed.',
        );
      }
    }

    return this.liveSessionsService.update(id, updateLiveSessionDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a live session' })
  @ApiOkResponse({ type: LiveSessionEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Live session not found.' })
  remove(@Param('id') id: string) {
    return this.liveSessionsService.remove(id);
  }
}
