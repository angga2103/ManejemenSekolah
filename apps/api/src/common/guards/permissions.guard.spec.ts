import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { SystemRoleSlug } from '@edusaas/shared-types';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ id: 'user-1' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should grant access to Super Admin unconditionally', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      { module: 'FINANCE', action: 'MANAGE' },
    ]);
    const context = createMockContext({
      id: 'super-admin-1',
      roles: [{ slug: SystemRoleSlug.SUPER_ADMIN }],
      activeRole: { slug: SystemRoleSlug.SUPER_ADMIN, permissions: [] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should grant access if user has wildcard * permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      { module: 'STUDENTS', action: 'CREATE' },
    ]);
    const context = createMockContext({
      id: 'admin-1',
      activeRole: { permissions: ['*'] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should grant access if user has exact permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      { module: 'STUDENTS', action: 'VIEW' },
    ]);
    const context = createMockContext({
      id: 'teacher-1',
      activeRole: { permissions: ['STUDENTS:VIEW'] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should grant access if user has MODULE:MANAGE permission for the module', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      { module: 'STUDENTS', action: 'DELETE' },
    ]);
    const context = createMockContext({
      id: 'principal-1',
      activeRole: { permissions: ['STUDENTS:MANAGE'] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject access if user lacks the required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      { module: 'FINANCE', action: 'MANAGE' },
    ]);
    const context = createMockContext({
      id: 'student-1',
      activeRole: { permissions: ['STUDENTS:VIEW', 'ATTENDANCE:VIEW'] },
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
