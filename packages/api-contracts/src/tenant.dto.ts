import { SubscriptionTier, TenantStatus } from '@edusaas/shared-types';
import { AuthTokens } from './auth.dto.js';

export interface RegisterTenantRequestDto {
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
  tier?: SubscriptionTier;
  isFormalEnabled?: boolean;
  isPesantrenEnabled?: boolean;
}

export interface RegisterTenantResponseData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    status: TenantStatus;
    createdAt: string | Date;
  };
  adminUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  tokens: AuthTokens;
}

export interface TenantPublicInfoResponseData {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  timezone: string;
  currency: string;
  isFormalEnabled: boolean;
  isPesantrenEnabled: boolean;
}

export interface UpdateTenantSettingsRequestDto {
  logoUrl?: string;
  primaryColor?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  isFormalEnabled?: boolean;
  isPesantrenEnabled?: boolean;
}

export interface TenantDetailResponseData {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string | null;
  status: TenantStatus;
  settings?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    timezone: string;
    dateFormat: string;
    currency: string;
    isFormalEnabled: boolean;
    isPesantrenEnabled: boolean;
  } | null;
  subscription?: {
    tier: SubscriptionTier;
    maxStudents: number;
    enabledModules: string[];
    startDate: string | Date;
    endDate: string | Date;
    isActive: boolean;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
