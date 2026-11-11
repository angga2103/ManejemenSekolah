import { SystemRoleSlug } from '@edusaas/shared-types';

export interface LoginRequestDto {
  identifier: string; // Email or Phone number
  password: string;
  tenantSlug?: string; // Optional subdomain or slug
}

export interface AuthSessionUser {
  id: string;
  tenantId: string;
  email?: string | null;
  phone?: string | null;
  fullName: string;
  roles: Array<{
    id: string;
    name: string;
    slug: SystemRoleSlug | string;
  }>;
  activeRole: {
    id: string;
    name: string;
    slug: SystemRoleSlug | string;
    permissions: string[];
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds
}

export interface LoginResponseData {
  user: AuthSessionUser;
  tokens: AuthTokens;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface SwitchRoleRequestDto {
  roleId: string;
}
