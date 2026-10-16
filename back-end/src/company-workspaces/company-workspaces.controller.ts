import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../common/constants/roles';
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCompanyWorkspaceDto } from './dto/create-company-workspace.dto';
import { CompanyWorkspacesService } from './company-workspaces.service';

@ApiTags('company-workspaces')
@Controller('companies')
export class CompanyWorkspacesController {
  constructor(private readonly companyWorkspacesService: CompanyWorkspacesService) {}

  @Post('with-hr')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({
    summary: 'Create a company and its initial HR account together',
  })
  @ApiCreatedResponse({
    description: 'The company and linked HR profile were created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Company or HR details are invalid or conflict with existing records.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  create(@Body() dto: CreateCompanyWorkspaceDto) {
    return this.companyWorkspacesService.create(dto);
  }
}
