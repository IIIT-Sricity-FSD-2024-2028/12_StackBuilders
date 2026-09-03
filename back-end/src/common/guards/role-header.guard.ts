import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_HEADER_NAME, Role } from '../constants/roles';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RoleHeaderGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!requiredRoles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const rawRoleHeader = request.headers[ROLE_HEADER_NAME];
    const roleHeaderValue = Array.isArray(rawRoleHeader)
      ? rawRoleHeader[0]
      : rawRoleHeader;

    if (!roleHeaderValue || !Object.values(Role).includes(roleHeaderValue as Role)) {
      throw new ForbiddenException(
        `Missing or invalid ${ROLE_HEADER_NAME} header.`,
      );
    }

    if (!requiredRoles.includes(roleHeaderValue as Role)) {
      throw new ForbiddenException(
        `Role ${roleHeaderValue} is not allowed to access this resource.`,
      );
    }

    request.role = roleHeaderValue;
    return true;
  }
}
