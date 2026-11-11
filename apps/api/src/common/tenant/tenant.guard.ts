import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from './tenant-context';

export const IS_PUBLIC_TENANT_KEY = 'isPublicTenant';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const tenantId = TenantContext.getTenantId();
    const isSuperAdmin = TenantContext.isSuperAdmin();

    if (!tenantId && !isSuperAdmin) {
      throw new ForbiddenException('Tenant identification missing. Provide X-Tenant-ID header or access via institution subdomain.');
    }

    return true;
  }
}
