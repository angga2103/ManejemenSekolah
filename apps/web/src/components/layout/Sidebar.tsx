import React from 'react';

interface SidebarProps {
  currentRole: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab = 'dashboard',
  onTabChange,
}) => {
  const getNavLinks = (role: string) => {
    switch (role) {
      case 'super_admin':
        return [
          { id: 'dashboard', name: 'Dashboard Global', icon: '📊' },
          { id: 'tenants', name: 'Manajemen Tenant', icon: '🏫' },
          { id: 'students', name: 'Data Induk Santri', icon: '👥' },
          { id: 'attendance', name: 'Monitoring Presensi', icon: '📅' },
          { id: 'subscriptions', name: 'Paket & Langganan', icon: '💳' },
          { id: 'health', name: 'Kesehatan Server', icon: '⚡' },
          { id: 'audit', name: 'Audit Security Log', icon: '🛡️' },
        ];
      case 'principal':
      case 'operator':
        return [
          { id: 'dashboard', name: 'Ikhtisar Lembaga', icon: '📊' },
          { id: 'students', name: 'Data Induk Santri', icon: '👥' },
          { id: 'classes', name: 'Rombel & Kelas', icon: '🏫' },
          { id: 'attendance', name: 'Monitoring Presensi', icon: '📅' },
          { id: 'finance', name: 'Laporan Keuangan', icon: '💰' },
          { id: 'academics', name: 'Rekapitulasi Nilai', icon: '📝' },
          { id: 'pesantren', name: 'Aktivitas Pesantren', icon: '🕌' },
        ];
      case 'treasurer':
        return [
          { id: 'dashboard', name: 'Dasbor Keuangan', icon: '📊' },
          { id: 'students', name: 'Data Santri & Tagihan', icon: '👥' },
          { id: 'billing', name: 'Tagihan SPP & Gedung', icon: '🧾' },
          { id: 'verification', name: 'Verifikasi Pembayaran', icon: '✅' },
          { id: 'journals', name: 'Buku Kas & Jurnal', icon: '📖' },
          { id: 'infak', name: 'Laporan Infak', icon: '🤲' },
        ];
      case 'teacher':
      case 'homeroom_teacher':
      case 'subject_teacher':
        return [
          { id: 'dashboard', name: 'Jadwal Mengajar', icon: '📚' },
          { id: 'students', name: 'Data Santri Kelas', icon: '👥' },
          { id: 'attendance', name: 'Presensi Kelas', icon: '📋' },
          { id: 'grading', name: 'Input Nilai Santri', icon: '✏️' },
          { id: 'materials', name: 'Materi & Tugas', icon: '📁' },
          { id: 'tahfiz', name: 'Setoran Tahfiz', icon: '📖' },
        ];
      case 'student':
        return [
          { id: 'dashboard', name: 'Jadwal Harian', icon: '📅' },
          { id: 'qr', name: 'QR Presensi Digital', icon: '📱' },
          { id: 'exams', name: 'Tugas & Ujian', icon: '📝' },
          { id: 'tahfiz', name: 'Catatan Tahfiz', icon: '📖' },
          { id: 'report', name: 'Rapor Digital', icon: '🏆' },
        ];
      case 'guardian':
      case 'parent':
        return [
          { id: 'dashboard', name: 'Pantau Santri', icon: '👦' },
          { id: 'attendance', name: 'Presensi & Kehadiran', icon: '📍' },
          { id: 'tuition', name: 'Tagihan & Bayar SPP', icon: '💳' },
          { id: 'tahfiz', name: 'Perkembangan Hafalan', icon: '🕌' },
          { id: 'leaves', name: 'Izin Pulang/Sakit', icon: '✉️' },
        ];
      default:
        return [
          { id: 'dashboard', name: 'Beranda', icon: '🏠' },
          { id: 'students', name: 'Data Induk Santri', icon: '👥' },
        ];
    }
  };

  const links = getNavLinks(currentRole);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Navigasi
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isSelected = activeTab === link.id;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onTabChange && onTabChange(link.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                isSelected
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-400">
        <div>EduSaaS v0.2.0 • Phase 2</div>
        <div className="text-emerald-500">Master Data Engine</div>
      </div>
    </aside>
  );
};
