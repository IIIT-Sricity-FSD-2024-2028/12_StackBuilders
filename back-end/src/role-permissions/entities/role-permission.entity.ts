import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/role-permission-defaults';

export class RolePermissionEntity {
  @ApiProperty({ example: 'hr' })
  group: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    example: DEFAULT_ROLE_PERMISSIONS.hr,
  })
  permissions: Record<string, boolean>;
}
