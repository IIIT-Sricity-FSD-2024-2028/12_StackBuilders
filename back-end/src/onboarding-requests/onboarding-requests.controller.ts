import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../common/constants/roles';
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOnboardingRequestDto } from './dto/create-onboarding-request.dto';
import { OnboardingRequestEntity } from './entities/onboarding-request.entity';
import { OnboardingRequestsService } from './onboarding-requests.service';
import { ApproveOnboardingResultEntity } from './entities/approve-onboarding-result.entity';

@ApiTags('company-onboarding-requests')
@Controller('company-onboarding-requests')
export class OnboardingRequestsController {
  constructor(
    private readonly onboardingRequestsService: OnboardingRequestsService,
  ) {}

  @Get()
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List pending company onboarding requests' })
  @ApiOkResponse({ type: OnboardingRequestEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll() {
    return this.onboardingRequestsService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a company onboarding request by id' })
  @ApiOkResponse({ type: OnboardingRequestEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({
    description: 'Company onboarding request not found.',
  })
  findOne(@Param('id') id: string) {
    return this.onboardingRequestsService.findOne(id);
  }

  @Post()
  @ApiHeader({
    name: 'role',
    required: false,
    description:
      'Role header is optional for public company request submission. Logged-in users may still send it.',
  })
  @ApiOperation({ summary: 'Create a public company onboarding request' })
  @ApiCreatedResponse({ type: OnboardingRequestEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed or the request conflicts with existing records.',
  })
  create(@Body() createOnboardingRequestDto: CreateOnboardingRequestDto) {
    return this.onboardingRequestsService.create(createOnboardingRequestDto);
  }

  @Post(':id/approve')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({
    summary: 'Approve a company onboarding request and create the company + HR profile',
  })
  @ApiCreatedResponse({ type: ApproveOnboardingResultEntity })
  @ApiBadRequestResponse({
    description: 'The request conflicts with existing company or HR data.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({
    description: 'Company onboarding request not found.',
  })
  approve(@Param('id') id: string) {
    return this.onboardingRequestsService.approve(id);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a pending company onboarding request' })
  @ApiOkResponse({ type: OnboardingRequestEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({
    description: 'Company onboarding request not found.',
  })
  remove(@Param('id') id: string) {
    return this.onboardingRequestsService.remove(id);
  }
}
