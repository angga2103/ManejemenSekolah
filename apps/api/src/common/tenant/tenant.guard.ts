import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from './tenant-context';
import { SystemRoleSlug } from '@edusaas/shared-types';

export const IS_PUBLIC_TENANT_KEY = 'isPublicTenant';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = TenantContext.getTenantId() || user?.tenantId;

    // Super Admin privilege bypass only if securely validated from authenticated JWT
    const isSuperAdmin =
      user?.roles?.some(
        (r: any) => (r.slug || r) === SystemRoleSlug.SUPER_ADMIN,
      ) || user?.activeRole?.slug === SystemRoleSlug.SUPER_ADMIN;

    if (!tenantId && !isSuperAdmin) {
      throw new ForbiddenException(
        'Tenant identification missing. Provide X-Tenant-ID header or access via institution subdomain.',
      );
    }

    return true;
  }
}
