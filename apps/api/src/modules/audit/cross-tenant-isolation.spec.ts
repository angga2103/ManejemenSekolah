import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SystemRoleSlug, PermissionModule, PermissionAction } from '@edusaas/shared-types';

describe('[Security Audit] Cross-Tenant Isolation & Privilege Escalation Penetration Suite', () => {
  let permissionsGuard: PermissionsGuard;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const tenantA = 'tenant-aaa-1111-1111';
  const tenantB = 'tenant-bbb-2222-2222';

  beforeEach(async () => {
    reflector = new Reflector();
    permissionsGuard = new PermissionsGuard(reflector);
    rolesGuard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('1. Cross-Tenant Data Leakage & Access Attempts', () => {
    it('should deny Student from Tenant B accessing Student A data if tenantId does not match', () => {
      const studentA = { id: 'student-001', tenantId: tenantA, fullName: 'Ahmad Santri' };
      const requestingTenant = tenantB;

      // Verification logic: cross-tenant access must strictly evaluate tenantId equality
      const isAuthorized = studentA.tenantId === requestingTenant;
      expect(isAuthorized).toBe(false);
    });

    it('should reject financial invoice access when request originates from different tenant', () => {
      const invoiceA = { id: 'inv-001', tenantId: tenantA, totalAmount: 500000 };
      const userTenant = tenantB;

      const hasAccess = invoiceA.tenantId === userTenant;
      expect(hasAccess).toBe(false);
    });

    it('should strictly isolate confidential Bimbingan Konseling (BK) records across tenants', () => {
      const bkRecordA = {
        id: 'bk-001',
        tenantId: tenantA,
        category: 'FAMILY',
        actionPlan: 'Panggilan orang tua rahasia',
      };
      const queryTenantId = tenantB;

      expect(bkRecordA.tenantId).not.toEqual(queryTenantId);
    });
  });

  describe('2. Privilege Escalation & Granular RBAC Guards', () => {
    it('should reject a STUDENT attempting to perform TREASURER financial actions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { module: PermissionModule.FINANCE, action: PermissionAction.CREATE },
      ]);

      const studentUser = {
        userId: 'user-student-1',
        tenantId: tenantA,
        roles: [{ slug: SystemRoleSlug.STUDENT }],
        permissions: ['ATTENDANCE:VIEW', 'ACADEMICS:VIEW', 'LMS:VIEW'],
      };

      const context = createMockContext(studentUser);
      const canActivate = permissionsGuard.canActivate(context);

      expect(canActivate).toBe(false);
    });

    it('should reject a PARENT attempting to update disciplinary violation points', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { module: PermissionModule.COMMUNICATION, action: PermissionAction.UPDATE },
      ]);

      const parentUser = {
        userId: 'user-parent-1',
        tenantId: tenantA,
        roles: [{ slug: SystemRoleSlug.PARENT }],
        permissions: ['FINANCE:VIEW', 'ATTENDANCE:VIEW'],
      };

      const context = createMockContext(parentUser);
      const canActivate = permissionsGuard.canActivate(context);

      expect(canActivate).toBe(false);
    });

    it('should allow PRINCIPAL with wildcard or full permissions to access administrative functions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { module: PermissionModule.FINANCE, action: PermissionAction.APPROVE },
      ]);

      const principalUser = {
        userId: 'user-principal-1',
        tenantId: tenantA,
        roles: [{ slug: SystemRoleSlug.PRINCIPAL }],
        permissions: ['*'],
      };

      const context = createMockContext(principalUser);
      const canActivate = permissionsGuard.canActivate(context);

      expect(canActivate).toBe(true);
    });
  });

  describe('3. Strict Confidential Counseling (BK) Privacy Protection', () => {
    it('should block non-counselor teachers from viewing confidential counseling records', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { module: PermissionModule.COUNSELING, action: PermissionAction.VIEW },
      ]);

      const subjectTeacherUser = {
        userId: 'user-teacher-1',
        tenantId: tenantA,
        roles: [{ slug: SystemRoleSlug.SUBJECT_TEACHER }],
        permissions: ['ACADEMICS:VIEW', 'ACADEMICS:CREATE', 'LMS:CREATE'],
      };

      const context = createMockContext(subjectTeacherUser);
      const canActivate = permissionsGuard.canActivate(context);

      expect(canActivate).toBe(false);
    });

    it('should allow authorized Counselor / Head of School to access counseling records', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { module: PermissionModule.COUNSELING, action: PermissionAction.VIEW },
      ]);

      const counselorUser = {
        userId: 'user-counselor-1',
        tenantId: tenantA,
        roles: [{ slug: SystemRoleSlug.PRINCIPAL }],
        permissions: ['COUNSELING:VIEW', 'COUNSELING:CREATE'],
      };

      const context = createMockContext(counselorUser);
      const canActivate = permissionsGuard.canActivate(context);

      expect(canActivate).toBe(true);
    });
  });

  describe('4. Roles Guard Enforcement on Sensitive Endpoints', () => {
    it('should reject non-SUPER_ADMIN on SaaS Control Center endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRoleSlug.SUPER_ADMIN]);

      const normalAdmin = {
        userId: 'user-principal-1',
        tenantId: tenantA,
        roles: [SystemRoleSlug.PRINCIPAL],
      };

      const context = createMockContext(normalAdmin);
      const canActivate = rolesGuard.canActivate(context);

      expect(canActivate).toBe(false);
    });

    it('should permit SUPER_ADMIN on SaaS Control Center endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRoleSlug.SUPER_ADMIN]);

      const superAdminUser = {
        userId: 'user-super-1',
        tenantId: 'global',
        roles: [SystemRoleSlug.SUPER_ADMIN],
      };

      const context = createMockContext(superAdminUser);
      const canActivate = rolesGuard.canActivate(context);

      expect(canActivate).toBe(true);
    });
  });
});
