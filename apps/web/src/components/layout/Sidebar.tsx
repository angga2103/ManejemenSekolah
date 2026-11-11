import React from 'react';

interface SidebarProps {
  currentRole: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const getNavLinks = (role: string) => {
    switch (role) {
      case 'super_admin':
        return [
          { name: 'Dashboard Global', icon: '📊', active: true },
          { name: 'Manajemen Tenant', icon: '🏫' },
          { name: 'Paket & Langganan', icon: '💳' },
          { name: 'Kesehatan Server', icon: '⚡' },
          { name: 'Audit Security Log', icon: '🛡️' },
        ];
      case 'principal':
        return [
          { name: 'Ikhtisar Lembaga', icon: '📊', active: true },
          { name: 'Monitoring Presensi', icon: '📅' },
          { name: 'Laporan Keuangan', icon: '💰' },
          { name: 'Rekapitulasi Nilai', icon: '📝' },
          { name: 'Aktivitas Pesantren', icon: '🕌' },
        ];
      case 'treasurer':
        return [
          { name: 'Dasbor Keuangan', icon: '📊', active: true },
          { name: 'Tagihan SPP & Gedung', icon: '🧾' },
          { name: 'Verifikasi Pembayaran', icon: '✅' },
          { name: 'Buku Kas & Jurnal', icon: '📖' },
          { name: 'Laporan Infak', icon: '🤲' },
        ];
      case 'teacher':
        return [
          { name: 'Jadwal Mengajar', icon: '📚', active: true },
          { name: 'Presensi Kelas', icon: '📋' },
          { name: 'Input Nilai Santri', icon: '✏️' },
          { name: 'Materi & Tugas', icon: '📁' },
          { name: 'Setoran Tahfiz', icon: '📖' },
        ];
      case 'student':
        return [
          { name: 'Jadwal Harian', icon: '📅', active: true },
          { name: 'QR Presensi Digital', icon: '📱' },
          { name: 'Tugas & Ujian', icon: '📝' },
          { name: 'Catatan Tahfiz', icon: '📖' },
          { name: 'Rapor Digital', icon: '🏆' },
        ];
      case 'guardian':
        return [
          { name: 'Pantau Santri', icon: '👦', active: true },
          { name: 'Presensi & Kehadiran', icon: '📍' },
          { name: 'Tagihan & Bayar SPP', icon: '💳' },
          { name: 'Perkembangan Hafalan', icon: '🕌' },
          { name: 'Izin Pulang/Sakit', icon: '✉️' },
        ];
      default:
        return [{ name: 'Beranda', icon: '🏠', active: true }];
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

      <nav className="p-3 space-y-1 flex-1">
        {links.map((link, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              link.active
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        EduSaaS Platform v0.1.0
      </div>
    </aside>
  );
};
