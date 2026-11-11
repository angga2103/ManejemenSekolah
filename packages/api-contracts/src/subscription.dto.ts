import {
  SubscriptionTier,
  TenantStatus,
  SystemHealthStatus,
} from '@edusaas/shared-types';

export class UpdateTenantSubscriptionDto {
  tier?: SubscriptionTier;
  maxStudents?: number;
  enabledModules?: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export class RenewSubscriptionDto {
  months?: number;
  tier?: SubscriptionTier;
  maxStudents?: number;
}

export class UpdateTenantStatusDto {
  status!: TenantStatus;
  reason?: string;
}

export class UpdateTenantModulesDto {
  enabledModules!: string[];
}

export class GenerateLicenseKeyDto {
  notes?: string;
}

export interface MemoryMetric {
  rssMb: number;
  heapTotalMb: number;
  heapUsedMb: number;
  externalMb: number;
}

export interface SystemMetricsResponseData {
  status: SystemHealthStatus;
  uptimeSeconds: number;
  memory: MemoryMetric;
  database: {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
  };
  tenants: {
    total: number;
    byStatus: {
      active: number;
      trial: number;
      suspended: number;
      terminated: number;
    };
    byTier: {
      basic: number;
      standard: number;
      premium: number;
      enterprise: number;
    };
  };
  totals: {
    students: number;
    users: number;
    invoices: number;
    attendances: number;
  };
  tableCounts: Record<string, number>;
  timestamp: string;
}

export interface TenantSubscriptionInfo {
  id: string;
  tier: SubscriptionTier;
  maxStudents: number;
  enabledModules: string[];
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  daysRemaining: number;
}

export interface TenantControlSummaryResponseData {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  status: TenantStatus;
  studentCount: number;
  userCount: number;
  quotaUsagePercentage: number;
  subscription: TenantSubscriptionInfo | null;
  createdAt: Date | string;
}

export interface LicenseKeyResponseData {
  tenantId: string;
  tenantSlug: string;
  tier: SubscriptionTier;
  maxStudents: number;
  enabledModules: string[];
  validUntil: string;
  licenseKey: string;
  signature: string;
}
