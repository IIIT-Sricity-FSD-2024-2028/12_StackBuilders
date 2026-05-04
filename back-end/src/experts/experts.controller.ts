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
import { CreateExpertDto } from './dto/create-expert.dto';
import { UpdateExpertDto } from './dto/update-expert.dto';
import { ExpertEntity } from './entities/expert.entity';
import { ExpertsService } from './experts.service';

@ApiTags('experts')
@Controller('experts')
export class ExpertsController {
  constructor(private readonly expertsService: ExpertsService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List wellness experts' })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'specialization', required: false })
  @ApiOkResponse({ type: ExpertEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('email') email?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
    @Query('status') status?: string,
    @Query('specialization') specialization?: string,
  ) {
    return this.expertsService.findAll({
      email,
      companyId,
      companyName,
      status,
      specialization,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a wellness expert by id' })
  @ApiOkResponse({ type: ExpertEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Wellness expert not found.' })
  findOne(@Param('id') id: string) {
    return this.expertsService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a wellness expert' })
  @ApiCreatedResponse({ type: ExpertEntity })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the wellness expert conflicts with existing users.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createExpertDto: CreateExpertDto) {
    return this.expertsService.create(createExpertDto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.HR, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a wellness expert' })
  @ApiOkResponse({ type: ExpertEntity })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the wellness expert conflicts with existing users.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Wellness expert not found.' })
  update(@Param('id') id: string, @Body() updateExpertDto: UpdateExpertDto) {
    return this.expertsService.update(id, updateExpertDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a wellness expert' })
  @ApiOkResponse({ type: ExpertEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Wellness expert not found.' })
  remove(@Param('id') id: string) {
    return this.expertsService.remove(id);
  }
}

