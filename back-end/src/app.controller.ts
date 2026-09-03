import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiRoleHeader } from './common/decorators/api-role-header.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { Role } from './common/constants/roles';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Employee, Role.WellnessExpert)
  @ApiRoleHeader()
  @ApiOkResponse({
    description: 'Basic backend readiness endpoint.',
    schema: {
      example: {
        message: 'NestJS backend scaffold is ready',
        docsPath: '/api/docs',
      },
    },
  })
  getStatus() {
    return this.appService.getStatus();
  }
}
