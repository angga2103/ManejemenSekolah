import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { SystemRoleSlug } from '@edusaas/shared-types';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    tenant: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn().mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      roles: [{ id: 'role-1', name: 'Principal', slug: 'principal' }],
      activeRole: { id: 'role-1', name: 'Principal', slug: 'principal', permissions: ['*'] },
    }),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('mock_secret'),
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should authenticate valid login request', async () => {
    const res = await service.validateAndLogin({
      identifier: 'admin@pesantren.id',
      password: 'SecurePassword123!',
    });

    expect(res).toBeDefined();
    expect(res.tokens.accessToken).toBe('mock_token');
    expect(res.user.fullName).toBe('Administrator Yayasan');
    expect(res.user.activeRole.slug).toBe(SystemRoleSlug.PRINCIPAL);
  });

  it('should refresh valid refresh token', async () => {
    const res = await service.refreshToken({ refreshToken: 'valid_refresh_token' });
    expect(res.accessToken).toBe('mock_token');
  });

  it('should logout and return success message', async () => {
    const res = await service.logout('user-1', 'some_refresh_token');
    expect(res.message).toBe('Logged out successfully');
  });
});
