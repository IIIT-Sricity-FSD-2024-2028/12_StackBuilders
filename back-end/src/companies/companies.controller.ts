import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesService } from './companies.service';
import { CompanyEntity } from './entities/company.entity';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'List companies' })
  @ApiOkResponse({ type: CompanyEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get a company by id' })
  @ApiOkResponse({ type: CompanyEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Company not found.' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Create a company' })
  @ApiCreatedResponse({ type: CompanyEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed or company already exists.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update a company' })
  @ApiOkResponse({ type: CompanyEntity })
  @ApiBadRequestResponse({
    description: 'Validation failed or conflicting company details.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Company not found.' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Delete a company and linked HR profile records' })
  @ApiOkResponse({ type: CompanyEntity })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  @ApiNotFoundResponse({ description: 'Company not found.' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}

