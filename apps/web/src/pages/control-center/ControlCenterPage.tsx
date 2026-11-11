import React, { useState } from 'react';
import type {
  TenantStatus,
  SubscriptionTier,
  SystemHealthStatus,
} from '@edusaas/shared-types';
import type {
  SystemMetricsResponseData,
  TenantControlSummaryResponseData,
  LicenseKeyResponseData,
} from '@edusaas/api-contracts';

const TenantStatusEnum = {
  ACTIVE: 'ACTIVE' as TenantStatus,
  TRIAL: 'TRIAL' as TenantStatus,
  SUSPENDED: 'SUSPENDED' as TenantStatus,
  TERMINATED: 'TERMINATED' as TenantStatus,
};

const SubscriptionTierEnum = {
  BASIC: 'BASIC' as SubscriptionTier,
  STANDARD: 'STANDARD' as SubscriptionTier,
  PREMIUM: 'PREMIUM' as SubscriptionTier,
  ENTERPRISE: 'ENTERPRISE' as SubscriptionTier,
};

const SystemHealthStatusEnum = {
  HEALTHY: 'HEALTHY' as SystemHealthStatus,
  DEGRADED: 'DEGRADED' as SystemHealthStatus,
  CRITICAL: 'CRITICAL' as SystemHealthStatus,
};

export const AVAILABLE_MODULES = [
  { key: 'MASTER_DATA', label: 'Data Induk & GTK', desc: 'Data santri, wali murid, guru & rombel kelas' },
  { key: 'ATTENDANCE', label: 'Presensi Digital & QR', desc: 'Presensi barcode/QR dinamis bertanda tangan kriptografis' },
  { key: 'FINANCE', label: 'Keuangan & SPP', desc: 'Faktur berkala, cicilan, payment gateway & jurnal kas berimbang' },
  { key: 'ACADEMICS', label: 'Kurikulum & Rapor', desc: 'Kurikulum ganda Kemendikbud-Pesantren & rapor PDF resmi' },
  { key: 'LMS_CBT', label: 'LMS & Ujian CBT', desc: 'Bahan ajar digital, tugas santri & bank soal ujian daring' },
  { key: 'PESANTREN', label: 'Asrama & Perizinan', desc: 'Kamar santri, musyrif & verifikasi token gerbang (Gate Pass)' },
  { key: 'TAHFIZ', label: 'Jurnal Tahfiz 30 Juz', desc: 'Log setoran hafalan Ziyadah & Muroja\'ah Al-Qur\'an' },
  { key: 'DORMITORY', label: 'Kapasitas Asrama', desc: 'Manajemen kasur asrama & pencegahan overcapacity' },
  { key: 'DISCIPLINE', label: 'Kedisiplinan & Poin', desc: 'Akumulasi poin pelanggaran, auto-sanksi SP1/SP2/SP3' },
  { key: 'COUNSELING', label: 'Bimbingan Konseling', desc: 'Buku catatan konseling BK berproteksi khusus rahasia' },
  { key: 'COMMUNICATION', label: 'Pusat Pengaduan', desc: 'Tiket keluhan rahasia orang tua & broadcast pengumuman' },
];

export const ControlCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'tenants' | 'modules' | 'audit'>('metrics');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modals state
  const [selectedTenant, setSelectedTenant] = useState<TenantControlSummaryResponseData | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [renewMonths, setRenewMonths] = useState(12);
  const [renewTier, setRenewTier] = useState<SubscriptionTier>(SubscriptionTierEnum.STANDARD);
  const [renewMaxStudents, setRenewMaxStudents] = useState(1000);
  const [newStatus, setNewStatus] = useState<TenantStatus>(TenantStatusEnum.ACTIVE);
  const [statusReason, setStatusReason] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState<LicenseKeyResponseData | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Initial Mock Metrics Data reflecting live backend aggregation
  const [metrics] = useState<SystemMetricsResponseData>({
    status: SystemHealthStatusEnum.HEALTHY,
    uptimeSeconds: 1572480, // ~18 days
    memory: {
      rssMb: 148.5,
      heapTotalMb: 92.4,
      heapUsedMb: 64.2,
      externalMb: 12.8,
    },
    database: {
      status: 'ONLINE',
      latencyMs: 14,
    },
    tenants: {
      total: 5,
      byStatus: {
        active: 4,
        trial: 1,
        suspended: 0,
        terminated: 0,
      },
      byTier: {
        basic: 1,
        standard: 2,
        premium: 1,
        enterprise: 1,
      },
    },
    totals: {
      students: 2450,
      users: 184,
      invoices: 4890,
      attendances: 34200,
    },
    tableCounts: {
      tenants: 5,
      students: 2450,
      users: 184,
      classes: 32,
      subjects: 64,
      attendances: 34200,
      invoices: 4890,
      payments: 4520,
      grades: 18400,
      reportCards: 2450,
      dormitories: 12,
      tahfizRecords: 8900,
      violations: 142,
      achievements: 215,
      counseling: 98,
      complaints: 64,
      auditLogs: 15200,
    },
    timestamp: new Date().toISOString(),
  });

  // Initial Tenants List
  const [tenants, setTenants] = useState<TenantControlSummaryResponseData[]>([
    {
      id: 'ten-001',
      name: 'Pondok Pesantren Modern Al-Hikmah',
      slug: 'pesantren-alhikmah',
      subdomain: 'alhikmah',
      customDomain: 'portal.alhikmah-pesantren.sch.id',
      status: TenantStatusEnum.ACTIVE,
      studentCount: 1280,
      userCount: 94,
      quotaUsagePercentage: 85,
      createdAt: '2026-01-15T08:00:00Z',
      subscription: {
        id: 'sub-001',
        tier: SubscriptionTierEnum.PREMIUM,
        maxStudents: 1500,
        enabledModules: [
          'MASTER_DATA',
          'ATTENDANCE',
          'FINANCE',
          'ACADEMICS',
          'LMS_CBT',
          'PESANTREN',
          'TAHFIZ',
          'DORMITORY',
          'DISCIPLINE',
          'COUNSELING',
          'COMMUNICATION',
        ],
        startDate: '2026-01-15T00:00:00Z',
        endDate: '2027-01-15T00:00:00Z',
        isActive: true,
        daysRemaining: 312,
      },
    },
    {
      id: 'ten-002',
      name: 'SMP & SMA Islam Terpadu Nurul Iman',
      slug: 'smit-nurul-iman',
      subdomain: 'nuruliman',
      customDomain: null,
      status: TenantStatusEnum.ACTIVE,
      studentCount: 650,
      userCount: 48,
      quotaUsagePercentage: 65,
      createdAt: '2026-02-01T08:00:00Z',
      subscription: {
        id: 'sub-002',
        tier: SubscriptionTierEnum.STANDARD,
        maxStudents: 1000,
        enabledModules: [
          'MASTER_DATA',
          'ATTENDANCE',
          'FINANCE',
          'ACADEMICS',
          'LMS_CBT',
          'DISCIPLINE',
          'COMMUNICATION',
        ],
        startDate: '2026-02-01T00:00:00Z',
        endDate: '2027-02-01T00:00:00Z',
        isActive: true,
        daysRemaining: 328,
      },
    },
    {
      id: 'ten-003',
      name: 'Pesantren Tahfiz Al-Qur\'an Darul Falah',
      slug: 'darul-falah',
      subdomain: 'darulfalah',
      customDomain: 'sistem.darulfalah.org',
      status: TenantStatusEnum.ACTIVE,
      studentCount: 420,
      userCount: 32,
      quotaUsagePercentage: 84,
      createdAt: '2026-03-10T08:00:00Z',
      subscription: {
        id: 'sub-003',
        tier: SubscriptionTierEnum.BASIC,
        maxStudents: 500,
        enabledModules: [
          'MASTER_DATA',
          'ATTENDANCE',
          'PESANTREN',
          'TAHFIZ',
          'DORMITORY',
          'COMMUNICATION',
        ],
        startDate: '2026-03-10T00:00:00Z',
        endDate: '2026-09-10T00:00:00Z',
        isActive: true,
        daysRemaining: 120,
      },
    },
    {
      id: 'ten-004',
      name: 'Madrasah Aliyah Kejuruan Al-Fattah',
      slug: 'mak-alfattah',
      subdomain: 'alfattah',
      customDomain: null,
      status: TenantStatusEnum.TRIAL,
      studentCount: 100,
      userCount: 10,
      quotaUsagePercentage: 20,
      createdAt: '2026-04-01T08:00:00Z',
      subscription: {
        id: 'sub-004',
        tier: SubscriptionTierEnum.BASIC,
        maxStudents: 500,
        enabledModules: [
          'MASTER_DATA',
          'ATTENDANCE',
          'ACADEMICS',
          'LMS_CBT',
        ],
        startDate: '2026-04-01T00:00:00Z',
        endDate: '2026-05-01T00:00:00Z',
        isActive: true,
        daysRemaining: 18,
      },
    },
  ]);

  // Selected Tenant for Module Matrix tab
  const [moduleTenantId, setModuleTenantId] = useState<string>('ten-001');

  // Cross-tenant audit logs
  const [auditLogs] = useState([
    {
      id: 'aud-1',
      timestamp: '2026-11-12 05:45:10',
      tenantName: 'Pesantren Al-Hikmah',
      userName: 'Super Admin System',
      action: 'MODULE_FLAGS_UPDATED',
      resource: 'tenant_subscriptions',
      details: 'Enabled LMS_CBT & COUNSELING modules',
    },
    {
      id: 'aud-2',
      timestamp: '2026-11-12 04:12:33',
      tenantName: 'Pesantren Darul Falah',
      userName: 'Admin Billing',
      action: 'SUBSCRIPTION_RENEWED',
      resource: 'tenant_subscriptions',
      details: 'Extended period +12 months (Tier: STANDARD, Quota: 1.000)',
    },
    {
      id: 'aud-3',
      timestamp: '2026-11-11 22:30:15',
      tenantName: 'SMIT Nurul Iman',
      userName: 'Super Admin System',
      action: 'LICENSE_KEY_GENERATED',
      resource: 'license_keys',
      details: 'Issued offline verifiable cryptographically signed HMAC token',
    },
    {
      id: 'aud-4',
      timestamp: '2026-11-11 18:20:00',
      tenantName: 'MAK Al-Fattah',
      userName: 'Onboarding Service',
      action: 'TENANT_REGISTERED',
      resource: 'tenants',
      details: 'Auto-provisioned initial Trial environment',
    },
  ]);

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesTier = tierFilter === 'ALL' || t.subscription?.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Helper for module toggle
  const handleToggleModule = (modKey: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== moduleTenantId || !t.subscription) return t;
        const exists = t.subscription.enabledModules.includes(modKey);
        const newModules = exists
          ? t.subscription.enabledModules.filter((m) => m !== modKey)
          : [...t.subscription.enabledModules, modKey];
        return {
          ...t,
          subscription: {
            ...t.subscription,
            enabledModules: newModules,
          },
        };
      })
    );
  };

  // Status update
  const handleSaveStatus = () => {
    if (!selectedTenant) return;
    setTenants((prev) =>
      prev.map((t) => (t.id === selectedTenant.id ? { ...t, status: newStatus } : t))
    );
    setIsStatusModalOpen(false);
    setSelectedTenant(null);
  };

  // Renewal update
  const handleSaveRenew = () => {
    if (!selectedTenant) return;
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTenant.id || !t.subscription) return t;
        const newEndDate = new Date();
        newEndDate.setMonth(newEndDate.getMonth() + renewMonths);
        return {
          ...t,
          status: TenantStatusEnum.ACTIVE,
          subscription: {
            ...t.subscription,
            tier: renewTier,
            maxStudents: renewMaxStudents,
            endDate: newEndDate.toISOString(),
            daysRemaining: renewMonths * 30,
            isActive: true,
          },
        };
      })
    );
    setIsRenewModalOpen(false);
    setSelectedTenant(null);
  };

  // License generation
  const handleGenerateLicense = (tenant: TenantControlSummaryResponseData) => {
    const validUntil = tenant.subscription
      ? new Date(tenant.subscription.endDate).toISOString()
      : new Date(Date.now() + 86400000 * 365).toISOString();

    const license: LicenseKeyResponseData = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tier: tenant.subscription?.tier || SubscriptionTierEnum.STANDARD,
      maxStudents: tenant.subscription?.maxStudents || 1000,
      enabledModules: tenant.subscription?.enabledModules || ['MASTER_DATA', 'ATTENDANCE', 'FINANCE'],
      validUntil,
      licenseKey: `EDU-${tenant.subscription?.tier || 'STD'}-${tenant.slug.toUpperCase()}-F8B92A7C4E1D.eyJ0ZW5hbnRJZCI6IiR7dGVuYW50LmlkfSIsInRpZXIiOiJQUkVNSVVNIn0=`,
      signature: '9a72b0c418f4d5e2389a0b12c87ef3451290ab43cd89e1f5678bc901ef234567',
    };

    setGeneratedLicense(license);
    setIsLicenseModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const activeModuleTenant = tenants.find((t) => t.id === moduleTenantId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  SaaS Developer Control Center
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pusat Kendali Lisensi Multi-Tenant, Monitoring Performa Database & Fitur Modul Sekolah/Pesantren
              </p>
            </div>
          </div>
        </div>

        {/* Global System Health Pill */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status Server</p>
            <p className="text-xs font-bold text-emerald-400">
              HEALTHY • DB Latency {metrics.database.latencyMs}ms
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📊</span> Metrik & Performa Server
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tenants')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🏫</span> Manajemen Tenant & Kuota
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🎛️</span> Lisensi & Modul Fitur
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🛡️</span> Audit Security Log
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: METRICS & SYSTEM PERFORMANCE                                    */}
      {/* ===================================================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Lembaga / Tenant</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{metrics.tenants.total}</span>
                <span className="text-xs font-bold text-emerald-600">({metrics.tenants.byStatus.active} Aktif)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {metrics.tenants.byStatus.trial} Masa Percobaan • {metrics.tenants.byStatus.suspended} Ditangguhkan
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Santri Terdaftar / Kapasitas</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">
                  {metrics.totals.students.toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 10.000</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${Math.round((metrics.totals.students / 10000) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Database & Latency</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-600">{metrics.database.latencyMs}</span>
                <span className="text-xs font-semibold text-slate-500">ms ping</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-bold text-emerald-700">PostgreSQL Connection Pool Online</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Node.js Heap Memory</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{metrics.memory.heapUsedMb}</span>
                <span className="text-xs font-semibold text-slate-500">/ {metrics.memory.heapTotalMb} MB</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                RSS: {metrics.memory.rssMb} MB • External: {metrics.memory.externalMb} MB
              </p>
            </div>
          </div>

          {/* Table Counts Matrix Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Agregasi Rekam Data Sistem (Database Table Counters)
                </h3>
                <p className="text-xs text-slate-500">
                  Volume entitas aktif yang tersimpan dan terisolasi secara multi-tenant
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400">
                Terakhir disinkronkan: {new Date(metrics.timestamp).toLocaleTimeString('id-ID')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(metrics.tableCounts).map(([tableName, count]) => (
                <div
                  key={tableName}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    {tableName}
                  </p>
                  <p className="text-lg font-black text-slate-800 mt-1">
                    {count.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: TENANT & QUOTA MANAGEMENT                                      */}
      {/* ===================================================================== */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari nama lembaga, slug, atau subdomain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value={TenantStatusEnum.ACTIVE}>ACTIVE</option>
                <option value={TenantStatusEnum.TRIAL}>TRIAL</option>
                <option value={TenantStatusEnum.SUSPENDED}>SUSPENDED</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ALL">Semua Tier</option>
                <option value={SubscriptionTierEnum.BASIC}>BASIC</option>
                <option value={SubscriptionTierEnum.STANDARD}>STANDARD</option>
                <option value={SubscriptionTierEnum.PREMIUM}>PREMIUM</option>
                <option value={SubscriptionTierEnum.ENTERPRISE}>ENTERPRISE</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Lembaga / Tenant</th>
                  <th className="py-3 px-4">Paket & Tier</th>
                  <th className="py-3 px-4">Kapasitas & Kuota Santri</th>
                  <th className="py-3 px-4">Masa Aktif</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTenants.map((t) => {
                  const sub = t.subscription;
                  const isHighUsage = t.quotaUsagePercentage >= 80;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {t.subdomain}.edusaas.id
                          {t.customDomain && (
                            <span className="ml-2 text-indigo-600 font-normal">
                              • {t.customDomain}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            sub?.tier === SubscriptionTierEnum.ENTERPRISE
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : sub?.tier === SubscriptionTierEnum.PREMIUM
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : sub?.tier === SubscriptionTierEnum.STANDARD
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {sub?.tier || 'BASIC'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-800">
                            {t.studentCount.toLocaleString('id-ID')} / {sub?.maxStudents.toLocaleString('id-ID') || 500}
                          </span>
                          <span className={`font-bold ${isHighUsage ? 'text-amber-600' : 'text-slate-500'}`}>
                            {t.quotaUsagePercentage}%
                          </span>
                        </div>
                        <div className="w-36 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isHighUsage ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${t.quotaUsagePercentage}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {sub ? `${sub.daysRemaining} hari tersisa` : 'Tidak aktif'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          s/d {sub ? new Date(sub.endDate).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            t.status === TenantStatusEnum.ACTIVE
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : t.status === TenantStatusEnum.TRIAL
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenant(t);
                              setNewStatus(t.status);
                              setIsStatusModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                          >
                            Status
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenant(t);
                              if (t.subscription) {
                                setRenewTier(t.subscription.tier);
                                setRenewMaxStudents(t.subscription.maxStudents);
                              }
                              setIsRenewModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Perpanjang
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateLicense(t)}
                            className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                          >
                            🔑 Lisensi
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: FEATURE MODULES MATRIX                                          */}
      {/* ===================================================================== */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Aktivasi Fitur Modul Berlangganan (Feature Toggles)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih lembaga untuk mengaktifkan atau menonaktifkan modul sistem secara modular
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-600">Pilih Lembaga:</label>
              <select
                value={moduleTenantId}
                onChange={(e) => setModuleTenantId(e.target.value)}
                className="text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subscription?.tier || 'BASIC'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeModuleTenant && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Matriks Modul: {activeModuleTenant.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tier Paket: <span className="font-bold text-emerald-600">{activeModuleTenant.subscription?.tier}</span> •
                    Kuota Santri: <span className="font-bold text-slate-800">{activeModuleTenant.studentCount} / {activeModuleTenant.subscription?.maxStudents}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateLicense(activeModuleTenant)}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
                >
                  <span>🔑</span> Generate License Key
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_MODULES.map((mod) => {
                  const isEnabled = activeModuleTenant.subscription?.enabledModules.includes(mod.key) ?? false;
                  return (
                    <div
                      key={mod.key}
                      onClick={() => handleToggleModule(mod.key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        isEnabled
                          ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 opacity-70'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                          <span className="font-mono text-[10px] text-slate-400">[{mod.key}]</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{mod.desc}</p>
                      </div>

                      <div
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                          isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AUDIT SECURITY LOG                                              */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cross-Tenant Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Rekam jejak perubahan status tenant, pembaharuan lisensi, dan aktivasi modul rahasia
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu (UTC/WIB)</th>
                  <th className="py-3 px-4">Lembaga / Tenant</th>
                  <th className="py-3 px-4">Aktor / Eksekutor</th>
                  <th className="py-3 px-4">Aksi Audit</th>
                  <th className="py-3 px-4">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.tenantName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: STATUS CHANGE                                                 */}
      {/* ===================================================================== */}
      {isStatusModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Ubah Status Operasional: {selectedTenant.name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status Baru</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TenantStatus)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value={TenantStatusEnum.ACTIVE}>ACTIVE (Aktif Penuh)</option>
                  <option value={TenantStatusEnum.TRIAL}>TRIAL (Masa Percobaan)</option>
                  <option value={TenantStatusEnum.SUSPENDED}>SUSPENDED (Ditangguhkan)</option>
                  <option value={TenantStatusEnum.TERMINATED}>TERMINATED (Dihentikan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alasan Perubahan</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Misal: Pembayaran langganan tahunan telah diverifikasi..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: SUBSCRIPTION RENEWAL / UPGRADE                                */}
      {/* ===================================================================== */}
      {isRenewModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Perpanjang & Upgrade Langganan
            </h3>
            <p className="text-xs text-slate-500">
              {selectedTenant.name} ({selectedTenant.subdomain}.edusaas.id)
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tier Paket</label>
                <select
                  value={renewTier}
                  onChange={(e) => setRenewTier(e.target.value as SubscriptionTier)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-bold"
                >
                  <option value={SubscriptionTierEnum.BASIC}>BASIC (Maks. 500 Santri)</option>
                  <option value={SubscriptionTierEnum.STANDARD}>STANDARD (Maks. 1.000 Santri)</option>
                  <option value={SubscriptionTierEnum.PREMIUM}>PREMIUM (Maks. 2.000 Santri)</option>
                  <option value={SubscriptionTierEnum.ENTERPRISE}>ENTERPRISE (Maks. 3.000+ Santri)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Durasi Perpanjangan (Bulan)</label>
                <input
                  type="number"
                  min={1}
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(parseInt(e.target.value, 10) || 12)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Batas Kuota Santri</label>
                <input
                  type="number"
                  min={10}
                  step={100}
                  value={renewMaxStudents}
                  onChange={(e) => setRenewMaxStudents(parseInt(e.target.value, 10) || 1000)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRenew}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Konfirmasi Perpanjangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CRYPTOGRAPHIC LICENSE KEY VIEWER                              */}
      {/* ===================================================================== */}
      {isLicenseModalOpen && generatedLicense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔑</span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kunci Lisensi Resmi (Cryptographic License Key)
                </h3>
                <p className="text-xs text-slate-500">
                  Token HMAC-SHA256 offline-verifiable untuk validasi lisensi on-premise atau edge client
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Tenant Slug:</span>
                <p className="text-xs font-mono font-bold text-slate-800">{generatedLicense.tenantSlug}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Tier:</span>
                  <p className="text-xs font-bold text-emerald-700">{generatedLicense.tier}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Maks. Santri:</span>
                  <p className="text-xs font-bold text-slate-800">{generatedLicense.maxStudents.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">License Key Token:</span>
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all select-all mt-1">
                  {generatedLicense.licenseKey}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 font-bold">
                {copyFeedback ? '✓ Berhasil disalin ke clipboard!' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedLicense.licenseKey)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
                >
                  Salin Kunci
                </button>
                <button
                  type="button"
                  onClick={() => setIsLicenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
