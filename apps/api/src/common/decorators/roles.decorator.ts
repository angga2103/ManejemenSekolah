import { SetMetadata } from '@nestjs/common';
import { SystemRoleSlug } from '@edusaas/shared-types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (SystemRoleSlug | string)[]) =>
  SetMetadata(ROLES_KEY, roles);
