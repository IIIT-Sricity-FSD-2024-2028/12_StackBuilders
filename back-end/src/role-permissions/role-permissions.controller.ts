import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ROLE_HEADER_NAME, Role } from '../common/constants/roles';
import { ApiRoleHeader } from '../common/decorators/api-role-header.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RolePermissionsService } from './role-permissions.service';

@ApiTags('role-permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Get(':group')
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Get permissions for a role group' })
  @ApiParam({
    name: 'group',
    example: 'hr',
    description: 'Role group: hr, employee, or wellness-expert.',
  })
  @ApiOkResponse({ type: RolePermissionEntity })
  @ApiBadRequestResponse({ description: 'Unsupported permission group.' })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  findOne(
    @Param('group') group: string,
    @Headers(ROLE_HEADER_NAME) role: Role,
  ) {
    this.rolePermissionsService.assertGroupReadableByRole(group, role);
    return this.rolePermissionsService.findOne(group);
  }

  @Put(':group')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Update permissions for a role group' })
  @ApiParam({
    name: 'group',
    example: 'hr',
    description: 'Role group: hr, employee, or wellness-expert.',
  })
  @ApiOkResponse({ type: RolePermissionEntity })
  @ApiBadRequestResponse({
    description: 'Unsupported permission group or permission key.',
  })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  update(
    @Param('group') group: string,
    @Body() updateRolePermissionsDto: UpdateRolePermissionsDto,
  ) {
    return this.rolePermissionsService.update(group, updateRolePermissionsDto);
  }

  @Delete(':group')
  @Roles(Role.Admin)
  @ApiRoleHeader()
  @ApiOperation({ summary: 'Reset a role group back to default permissions' })
  @ApiParam({
    name: 'group',
    example: 'hr',
    description: 'Role group: hr, employee, or wellness-expert.',
  })
  @ApiOkResponse({ type: RolePermissionEntity })
  @ApiBadRequestResponse({ description: 'Unsupported permission group.' })
  @ApiForbiddenResponse({ description: 'Missing or invalid role header.' })
  reset(@Param('group') group: string) {
    return this.rolePermissionsService.reset(group);
  }
}
