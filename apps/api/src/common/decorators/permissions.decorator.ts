import { SetMetadata } from '@nestjs/common';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  module: PermissionModule | string;
  action: PermissionAction | string;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
