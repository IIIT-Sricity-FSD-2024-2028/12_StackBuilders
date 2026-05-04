import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/role-permission-defaults';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    example: DEFAULT_ROLE_PERMISSIONS.hr,
    description:
      'Permission flags keyed by the existing frontend permission identifiers.',
  })
  @IsObject()
  permissions: Record<string, boolean>;
}
