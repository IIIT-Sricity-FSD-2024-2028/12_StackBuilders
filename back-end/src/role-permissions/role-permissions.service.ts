import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '../common/constants/roles';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import {
  getDefaultRolePermissions,
  mapRoleToPermissionGroup,
  normalizePermissionGroup,
  ROLE_PERMISSION_KEYS,
  RolePermissionGroup,
} from './constants/role-permission-defaults';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RolePermissionEntity } from './entities/role-permission.entity';

@Injectable()
export class RolePermissionsService {
  constructor(private readonly data: InMemoryDataService) {}

  findOne(group: string): RolePermissionEntity {
    const normalizedGroup = this.assertValidGroup(group);
    const storedPermissions = this.data.rolePermissions[normalizedGroup] ?? {};

    return {
      group: normalizedGroup,
      permissions: {
        ...getDefaultRolePermissions(normalizedGroup),
        ...storedPermissions,
      },
    };
  }

  update(
    group: string,
    updateRolePermissionsDto: UpdateRolePermissionsDto,
  ): RolePermissionEntity {
    const normalizedGroup = this.assertValidGroup(group);
    const nextPermissions = this.normalizePermissionMap(
      updateRolePermissionsDto.permissions,
      normalizedGroup,
    );

    this.data.rolePermissions[normalizedGroup] = nextPermissions;
    return this.findOne(normalizedGroup);
  }

  reset(group: string): RolePermissionEntity {
    const normalizedGroup = this.assertValidGroup(group);
    delete this.data.rolePermissions[normalizedGroup];
    return this.findOne(normalizedGroup);
  }

  assertGroupReadableByRole(group: string, role: Role): RolePermissionGroup {
    const normalizedGroup = this.assertValidGroup(group);

    if (role === Role.Admin) {
      return normalizedGroup;
    }

    const allowedGroup = mapRoleToPermissionGroup(role);
    if (!allowedGroup || allowedGroup !== normalizedGroup) {
      throw new ForbiddenException(
        'You can only read permissions for your own role group.',
      );
    }

    return normalizedGroup;
  }

  private assertValidGroup(group: string): RolePermissionGroup {
    const normalizedGroup = normalizePermissionGroup(group);
    if (!normalizedGroup) {
      throw new BadRequestException('Unsupported permission group.');
    }

    return normalizedGroup;
  }

  private normalizePermissionMap(
    permissions: Record<string, boolean>,
    group: RolePermissionGroup,
  ): Record<string, boolean> {
    const defaults = getDefaultRolePermissions(group);
    const normalizedPermissions = { ...defaults };

    for (const [key, value] of Object.entries(permissions ?? {})) {
      if (!ROLE_PERMISSION_KEYS.includes(key as (typeof ROLE_PERMISSION_KEYS)[number])) {
        throw new BadRequestException(
          `Unsupported permission key: ${key}.`,
        );
      }

      normalizedPermissions[key] = Boolean(value);
    }

    return normalizedPermissions;
  }
}
