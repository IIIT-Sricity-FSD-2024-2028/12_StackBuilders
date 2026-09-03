import { Role } from '../../common/constants/roles';
import { cleanText, normalizeLookupValue } from '../../common/utils/record.utils';

export const DEFAULT_ROLE_PERMISSIONS = {
  hr: {
    'user-management-create': true,
    'user-management-read': true,
    'user-management-update': true,
    'user-management-delete': true,
    'client-management-create': true,
    'client-management-read': true,
    'client-management-update': true,
    'client-management-delete': true,
    'reports-create': true,
    'reports-read': true,
    'reports-update': true,
    'reports-delete': true,
    'challenge-management-create': true,
    'challenge-management-read': true,
    'challenge-management-update': true,
    'challenge-management-delete': true,
  },
  employee: {
    'user-management-create': true,
    'user-management-read': true,
    'user-management-update': true,
    'user-management-delete': true,
    'client-management-create': true,
    'client-management-read': true,
    'client-management-update': true,
    'client-management-delete': true,
    'reports-create': true,
    'reports-read': true,
    'reports-update': true,
    'reports-delete': true,
    'challenge-management-create': true,
    'challenge-management-read': true,
    'challenge-management-update': true,
    'challenge-management-delete': true,
  },
  'wellness-expert': {
    'user-management-create': true,
    'user-management-read': true,
    'user-management-update': true,
    'user-management-delete': true,
    'client-management-create': true,
    'client-management-read': true,
    'client-management-update': true,
    'client-management-delete': true,
    'reports-create': true,
    'reports-read': true,
    'reports-update': true,
    'reports-delete': true,
    'challenge-management-create': true,
    'challenge-management-read': true,
    'challenge-management-update': true,
    'challenge-management-delete': true,
  },
} as const;

export type RolePermissionGroup = keyof typeof DEFAULT_ROLE_PERMISSIONS;

export const ROLE_PERMISSION_GROUP_ALIASES: Record<string, RolePermissionGroup> = {
  hr: 'hr',
  employee: 'employee',
  user: 'employee',
  expert: 'wellness-expert',
  wellness: 'wellness-expert',
  'wellness expert': 'wellness-expert',
  'wellness-expert': 'wellness-expert',
};

export const ROLE_PERMISSION_KEYS = Object.keys(
  DEFAULT_ROLE_PERMISSIONS.hr,
) as Array<keyof (typeof DEFAULT_ROLE_PERMISSIONS)['hr']>;

export function normalizePermissionGroup(
  value: unknown,
): RolePermissionGroup | null {
  const normalizedValue = normalizeLookupValue(value);
  return ROLE_PERMISSION_GROUP_ALIASES[normalizedValue] ?? null;
}

export function getDefaultRolePermissions(
  group: RolePermissionGroup,
): Record<string, boolean> {
  return { ...DEFAULT_ROLE_PERMISSIONS[group] };
}

export function mapRoleToPermissionGroup(
  role: unknown,
): RolePermissionGroup | null {
  const normalizedRole = cleanText(role);

  if (normalizedRole === Role.HR) {
    return 'hr';
  }

  if (normalizedRole === Role.Employee) {
    return 'employee';
  }

  if (normalizedRole === Role.WellnessExpert) {
    return 'wellness-expert';
  }

  return null;
}
