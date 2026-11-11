import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { SystemRoleSlug } from '@edusaas/shared-types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Super Admin bypass
    const isSuperAdmin =
      user.roles?.some((r: any) => (r.slug || r) === SystemRoleSlug.SUPER_ADMIN) ||
      user.activeRole?.slug === SystemRoleSlug.SUPER_ADMIN;

    if (isSuperAdmin) {
      return true;
    }

    const userPermissions: string[] = user.activeRole?.permissions || user.permissions || [];

    if (userPermissions.includes('*')) {
      return true;
    }

    // Check if every required permission is present in user's granted permissions
    return requiredPermissions.every((req) => {
      const requiredPermKey = `${req.module}:${req.action}`.toUpperCase();
      const moduleWildcard = `${req.module}:*`.toUpperCase();
      const moduleManage = `${req.module}:MANAGE`.toUpperCase();

      return (
        userPermissions.includes(requiredPermKey) ||
        userPermissions.includes(moduleWildcard) ||
        userPermissions.includes(moduleManage)
      );
    });
  }
}
