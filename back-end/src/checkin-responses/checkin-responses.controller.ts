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
import { CheckinResponseEntity } from './entities/checkin-response.entity';
import { CheckinResponsesService } from './checkin-responses.service';
import { CreateCheckinResponseDto } from './dto/create-checkin-response.dto';
import { UpdateCheckinResponseDto } from './dto/update-checkin-response.dto';

@ApiTags('checkin-responses')
@Controller('checkin-responses')
export class CheckinResponsesController {
  constructor(
    private readonly checkinResponsesService: CheckinResponsesService,
  ) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List check-in responses' })
  @ApiQuery({ name: 'checkinId', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'expertId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: CheckinResponseEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('checkinId') checkinId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('expertId') expertId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return this.checkinResponsesService.findAll({
      checkinId,
      employeeId,
      expertId,
      companyId,
      companyName,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a check-in response by id' })
  @ApiOkResponse({ type: CheckinResponseEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Check-in response not found.' })
  findOne(@Param('id') id: string) {
    return this.checkinResponsesService.findOne(id);
  }

  @Post()
  @Roles(Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a check-in response' })
  @ApiCreatedResponse({ type: CheckinResponseEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the expert response payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createCheckinResponseDto: CreateCheckinResponseDto) {
    return this.checkinResponsesService.create(createCheckinResponseDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a check-in response' })
  @ApiOkResponse({ type: CheckinResponseEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the expert response payload.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Check-in response not found.' })
  update(
    @Param('id') id: string,
    @Body() updateCheckinResponseDto: UpdateCheckinResponseDto,
  ) {
    return this.checkinResponsesService.update(id, updateCheckinResponseDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a check-in response' })
  @ApiOkResponse({ type: CheckinResponseEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Check-in response not found.' })
  remove(@Param('id') id: string) {
    return this.checkinResponsesService.remove(id);
  }
}

