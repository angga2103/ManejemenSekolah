import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginRequestDto, LoginResponseData } from '@edusaas/api-contracts';
import { SystemRoleSlug } from '@edusaas/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateAndLogin(dto: LoginRequestDto): Promise<LoginResponseData> {
    // Infrastructure level baseline validation (Full DB password verification connected in Phase 1)
    if (!dto.identifier || !dto.password) {
      throw new UnauthorizedException('Identifier and password are required');
    }

    const mockUserId = '11111111-1111-1111-1111-111111111111';
    const mockTenantId = '99999999-9999-9999-9999-999999999999';

    const payload = {
      sub: mockUserId,
      tenantId: mockTenantId,
      email: dto.identifier.includes('@') ? dto.identifier : undefined,
      phone: !dto.identifier.includes('@') ? dto.identifier : undefined,
      roles: [SystemRoleSlug.PRINCIPAL],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'dev_refresh_secret_do_not_use_in_production_min_length_32_chars_67890',
      expiresIn: '7d',
    });

    return {
      user: {
        id: mockUserId,
        tenantId: mockTenantId,
        email: payload.email,
        phone: payload.phone,
        fullName: 'Administrator Yayasan',
        roles: [
          {
            id: 'role-1',
            name: 'Principal / Head of Pesantren',
            slug: SystemRoleSlug.PRINCIPAL,
          },
        ],
        activeRole: {
          id: 'role-1',
          name: 'Principal / Head of Pesantren',
          slug: SystemRoleSlug.PRINCIPAL,
          permissions: ['*'],
        },
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'dev_refresh_secret_do_not_use_in_production_min_length_32_chars_67890',
      });
      const newAccessToken = this.jwtService.sign({
        sub: decoded.sub,
        tenantId: decoded.tenantId,
        roles: decoded.roles,
      });
      return {
        accessToken: newAccessToken,
        expiresIn: 900,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
