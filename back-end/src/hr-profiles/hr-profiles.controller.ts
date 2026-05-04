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
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CreateHrProfileDto } from './dto/create-hr-profile.dto';
import { UpdateHrProfileDto } from './dto/update-hr-profile.dto';
import { HrProfileEntity } from './entities/hr-profile.entity';
import { HrProfilesService } from './hr-profiles.service';

@ApiTags('hr-profiles')
@Controller('hr-profiles')
export class HrProfilesController {
  constructor(private readonly hrProfilesService: HrProfilesService) {}

  @Get()
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List HR profiles' })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: HrProfileEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('email') email?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return this.hrProfilesService.findAll({ email, companyId, companyName });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get an HR profile by id' })
  @ApiOkResponse({ type: HrProfileEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'HR profile not found.' })
  findOne(@Param('id') id: string) {
    return this.hrProfilesService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({
    summary: 'Create an HR profile and replace any existing HR mapped to the same company',
  })
  @ApiCreatedResponse({
    schema: {
      example: {
        hrProfile: {
          id: 'hr-1777718400000-a1b2c3d4',
          name: 'Priya Sharma',
          email: 'priya.sharma@gmail.com',
          username: 'priya.sharma@gmail.com',
          phoneNumber: '+91 98765 43210',
          department: 'HR',
          designation: 'HR Admin',
          location: '',
          companyId: 'CMP-1001',
          companyName: 'Stack Builders Pvt Ltd',
          status: 'Active',
          createdBySuperUser: true,
          password: 'secure123',
          createdAt: '2026-05-02T12:30:00.000Z',
          updatedAt: '2026-05-02T12:30:00.000Z',
        },
        replacedProfiles: [],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or company reference is invalid.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createHrProfileDto: CreateHrProfileDto) {
    return this.hrProfilesService.create(createHrProfileDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update an HR profile' })
  @ApiOkResponse({ type: HrProfileEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed or conflicting company/email details.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'HR profile not found.' })
  update(
    @Param('id') id: string,
    @Body() updateHrProfileDto: UpdateHrProfileDto,
  ) {
    return this.hrProfilesService.update(id, updateHrProfileDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete an HR profile' })
  @ApiOkResponse({ type: HrProfileEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'HR profile not found.' })
  remove(@Param('id') id: string) {
    return this.hrProfilesService.remove(id);
  }
}
