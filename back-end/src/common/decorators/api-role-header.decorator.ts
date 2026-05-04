import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { ROLE_HEADER_NAME, Role } from '../constants/roles';

export function ApiRoleHeader() {
  return applyDecorators(
    ApiSecurity('role'),
    ApiHeader({
      name: ROLE_HEADER_NAME,
      required: true,
      description: `Role used for RBAC. Allowed values: ${Object.values(Role).join(', ')}`,
    }),
  );
}

