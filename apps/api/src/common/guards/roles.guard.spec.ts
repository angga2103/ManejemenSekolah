import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { SystemRoleSlug } from '@edusaas/shared-types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ id: 'user-1' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should grant access if user has one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([SystemRoleSlug.PRINCIPAL, SystemRoleSlug.SUPER_ADMIN]);
    const context = createMockContext({
      id: 'principal-1',
      roles: [{ slug: SystemRoleSlug.PRINCIPAL }],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject access if user does not have any required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([SystemRoleSlug.SUPER_ADMIN]);
    const context = createMockContext({
      id: 'student-1',
      roles: [{ slug: SystemRoleSlug.STUDENT }],
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
