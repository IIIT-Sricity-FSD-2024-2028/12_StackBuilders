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
import { ConsultationsService } from './consultations.service';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';
import { CreateFollowUpConsultationDto } from './dto/create-follow-up-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ConsultationFollowUpResultEntity } from './entities/consultation-follow-up-result.entity';
import { ConsultationLookupResultEntity } from './entities/consultation-lookup-result.entity';
import { ConsultationEntity } from './entities/consultation.entity';

@ApiTags('consultations')
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List consultations' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'expertId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'createdByExpert', required: false })
  @ApiQuery({ name: 'sourceCheckinId', required: false })
  @ApiOkResponse({ type: ConsultationEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('expertId') expertId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
    @Query('status') status?: string,
    @Query('createdByExpert') createdByExpert?: string,
    @Query('sourceCheckinId') sourceCheckinId?: string,
  ) {
    return this.consultationsService.findAll({
      employeeId,
      expertId,
      companyId,
      companyName,
      status,
      createdByExpert,
      sourceCheckinId,
    });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a consultation by id' })
  @ApiOkResponse({ type: ConsultationEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Consultation not found.' })
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Get('open-latest/search')
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({
    summary:
      'Get the latest open consultation for a given employee and wellness expert pair',
  })
  @ApiQuery({ name: 'employeeId', required: true })
  @ApiQuery({ name: 'expertId', required: true })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'companyName', required: false })
  @ApiOkResponse({ type: ConsultationLookupResultEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  getLatestOpen(
    @Query('employeeId') employeeId?: string,
    @Query('expertId') expertId?: string,
    @Query('companyId') companyId?: string,
    @Query('companyName') companyName?: string,
  ) {
    return {
      consultation: this.consultationsService.getLatestOpenConsultationForExpertEmployee({
        employeeId,
        expertId,
        companyId,
        companyName,
      }),
    };
  }

  @Post()
  @Roles(Role.Employee)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a consultation request' })
  @ApiCreatedResponse({ type: ConsultationEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed or the expert/employee record is invalid.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  createRequest(@Body() createConsultationRequestDto: CreateConsultationRequestDto) {
    return this.consultationsService.createRequest(createConsultationRequestDto);
  }

  @Post('follow-up')
  @Roles(Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({
    summary:
      'Create or reuse an expert follow-up consultation from an employee check-in workflow',
  })
  @ApiCreatedResponse({ type: ConsultationFollowUpResultEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed or the employee/expert record is invalid.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  createFollowUp(@Body() createFollowUpConsultationDto: CreateFollowUpConsultationDto) {
    return this.consultationsService.createExpertFollowUp(
      createFollowUpConsultationDto,
    );
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({
    summary:
      'Update a consultation status or add/edit accepted consultation session details',
  })
  @ApiOkResponse({ type: ConsultationEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed for consultation status or session details.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Consultation not found.' })
  update(
    @Param('id') id: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ) {
    return this.consultationsService.update(id, updateConsultationDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a consultation' })
  @ApiOkResponse({ type: ConsultationEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Consultation not found.' })
  remove(@Param('id') id: string) {
    return this.consultationsService.remove(id);
  }
}

