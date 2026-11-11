import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {};
  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', roles: ['principal'] }),
  };
  const mockConfig = {
    get: jest.fn().mockReturnValue('mock_secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
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
  });

  it('should refresh valid refresh token', async () => {
    const res = await service.refreshToken('valid_refresh_token');
    expect(res.accessToken).toBe('mock_token');
  });
});
