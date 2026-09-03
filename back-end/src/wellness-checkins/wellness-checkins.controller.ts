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
import { CreateWellnessCheckinDto } from './dto/create-wellness-checkin.dto';
import { UpdateWellnessCheckinDto } from './dto/update-wellness-checkin.dto';
import { WellnessCheckinEntity } from './entities/wellness-checkin.entity';
import { WellnessCheckinsService } from './wellness-checkins.service';

@ApiTags('wellness-checkins')
@Controller('wellness-checkins')
export class WellnessCheckinsController {
  constructor(
    private readonly wellnessCheckinsService: WellnessCheckinsService,
  ) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List wellness check-ins' })
  @ApiQuery({ name: 'checkinType', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: WellnessCheckinEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('checkinType') checkinType?: string,
    @Query('employeeId') employeeId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return this.wellnessCheckinsService.findAll({
      checkinType,
      employeeId,
      companyId,
      companyName,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a wellness check-in by id' })
  @ApiOkResponse({ type: WellnessCheckinEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Wellness check-in not found.' })
  findOne(@Param('id') id: string) {
    return this.wellnessCheckinsService.findOne(id);
  }

  @Post()
  @Roles(Role.Employee)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a wellness check-in' })
  @ApiCreatedResponse({ type: WellnessCheckinEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted check-in values.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createWellnessCheckinDto: CreateWellnessCheckinDto) {
    return this.wellnessCheckinsService.create(createWellnessCheckinDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Employee)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a wellness check-in' })
  @ApiOkResponse({ type: WellnessCheckinEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for the submitted check-in values.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Wellness check-in not found.' })
  update(
    @Param('id') id: string,
    @Body() updateWellnessCheckinDto: UpdateWellnessCheckinDto,
  ) {
    return this.wellnessCheckinsService.update(id, updateWellnessCheckinDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a wellness check-in' })
  @ApiOkResponse({ type: WellnessCheckinEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Wellness check-in not found.' })
  remove(@Param('id') id: string) {
    return this.wellnessCheckinsService.remove(id);
  }
}

