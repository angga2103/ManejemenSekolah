import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface DashboardProps {
  role: string;
}

export const DashboardPrototypes: React.FC<DashboardProps> = ({ role }) => {
  switch (role) {
    case 'super_admin':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SaaS Developer Control Center</h1>
              <p className="text-sm text-slate-500 mt-1">
                Panel Kontrol Induk Pengelolaan Multi-Tenant & Infrastruktur
              </p>
            </div>
            <Badge variant="warning">Wireframe Prototype</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Total Institusi Aktif" className="text-center">
              <p className="text-3xl font-extrabold text-emerald-600">42</p>
              <p className="text-xs text-slate-500 mt-1">+4 institusi bulan ini</p>
            </Card>
            <Card title="Total Pengguna Sistem" className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">18.420</p>
              <p className="text-xs text-slate-500 mt-1">Siswa, guru, & wali santri</p>
            </Card>
            <Card title="Beban Server (CPU)" className="text-center">
              <p className="text-3xl font-extrabold text-blue-600">18%</p>
              <p className="text-xs text-slate-500 mt-1">4 Node Cluster Sehat</p>
            </Card>
            <Card title="Status Database RLS" className="text-center">
              <Badge variant="success">RLS AKTIF</Badge>
              <p className="text-xs text-slate-500 mt-2">100% Tenant Terisolasi</p>
            </Card>
          </div>
        </div>
      );

    case 'principal':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dasbor Kepala Sekolah & Pengasuh</h1>
              <p className="text-sm text-slate-500 mt-1">
                Pondok Pesantren & Madrasah Terpadu Al-Ikhlas
              </p>
            </div>
            <Badge variant="warning">Wireframe Prototype</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Tingkat Kehadiran Santri Hari Ini">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-emerald-600">97.8%</span>
                <span className="text-xs text-slate-500">1.250 / 1.280 Santri</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Salat Subuh & KBM Formal</p>
            </Card>
            <Card title="Capaian Tahfiz Al-Qur'an">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-blue-600">84%</span>
                <span className="text-xs text-slate-500">Target Semester</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">142 santri tuntas juz 30</p>
            </Card>
            <Card title="Realisasi Keuangan SPP">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-slate-900">92.4%</span>
                <span className="text-xs text-emerald-600 font-medium">Bulan Berjalan</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Rp 482.000.000 terverifikasi</p>
            </Card>
          </div>
        </div>
      );

    case 'treasurer':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dasbor Bendahara & Keuangan</h1>
              <p className="text-sm text-slate-500 mt-1">Manajemen Arus Kas, SPP, & Infak</p>
            </div>
            <Badge variant="warning">Wireframe Prototype</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Kas Masuk Bulan Ini">
              <p className="text-2xl font-bold text-emerald-600">Rp 512.450.000</p>
              <p className="text-xs text-slate-500 mt-1">Melalui QRIS, VA, & Tunai</p>
            </Card>
            <Card title="Piutang / Tunggakan SPP">
              <p className="text-2xl font-bold text-rose-600">Rp 38.200.000</p>
              <p className="text-xs text-slate-500 mt-1">32 Santri Belum Lunas</p>
            </Card>
            <Card title="Saldo Kas & Bank Utama">
              <p className="text-2xl font-bold text-slate-900">Rp 1.420.900.000</p>
              <p className="text-xs text-slate-500 mt-1">BSI & Bank Muamalat</p>
            </Card>
          </div>
        </div>
      );

    case 'teacher':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Workspace Guru & Ustaz</h1>
              <p className="text-sm text-slate-500 mt-1">Jadwal KBM, Presensi Kelas, & Nilai</p>
            </div>
            <Badge variant="warning">Wireframe Prototype</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Jadwal Mengajar Hari Ini">
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span>07.30 - 09.00 • Matematika (Kelas 8A)</span>
                  <Badge variant="success">Selesai</Badge>
                </li>
                <li className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span>09.15 - 10.45 • Fiqih Diniyah (Kelas 7B)</span>
                  <Badge variant="info">Sedang Berlangsung</Badge>
                </li>
              </ul>
            </Card>
            <Card title="Halaqah & Setoran Tahfiz Sore">
              <p className="text-sm text-slate-600">Kelompok Halaqah Abu Bakar (12 Santri)</p>
              <p className="text-xs text-slate-500 mt-2">Materi Ziyadah: Surat Al-Mulk ayat 1-15</p>
            </Card>
          </div>
        </div>
      );

    case 'student':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portal Santri / Siswa</h1>
              <p className="text-sm text-slate-500 mt-1">Ahmad Fauzi — NIS: 20260114</p>
            </div>
            <Badge variant="warning">Wireframe Prototype</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="QR Presensi Digital">
              <div className="h-40 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <span className="text-xs text-slate-500 font-medium">[QR Code Dinamis Berputar 60d]</span>
              </div>
            </Card>
            <Card title="Progres Tahfiz">
              <p className="text-3xl font-bold text-emerald-600">4 Juz 12 Lembar</p>
              <p className="text-xs text-slate-500 mt-1">Hafalan Terakhir: QS. An-Naba</p>
            </Card>
            <Card title="Tugas Belum Selesai">
              <p className="text-3xl font-bold text-amber-600">1 Tugas</p>
              <p className="text-xs text-slate-500 mt-1">Deadline: Besok 17.00</p>
            </Card>
          </div>
        </div>
      );

    case 'guardian':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portal Wali Santri</h1>
              <p className="text-sm text-slate-500 mt-1">Memantau: Ahmad Fauzi (Kelas 8A Asrama Al-Farabi)</p>
            </div>
            <Badge variant="warning">Wireframe Prototype</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Status Kehadiran Hari Ini">
              <Badge variant="success">HADIR TEPAT WAKTU</Badge>
              <p className="text-xs text-slate-500 mt-2">Salat Subuh & Masuk Kelas Terverifikasi</p>
            </Card>
            <Card title="Tagihan SPP Bulan Ini">
              <p className="text-2xl font-bold text-slate-900">Rp 650.000</p>
              <Badge variant="warning" className="mt-2">Jatuh Tempo: 15 Nov</Badge>
            </Card>
            <Card title="Kesehatan & Catatan Asrama">
              <p className="text-sm text-emerald-700 font-medium">Kondisi Sehat Walafiat</p>
              <p className="text-xs text-slate-500 mt-1">Catatan Musyrif: Aktif dan disiplin</p>
            </Card>
          </div>
        </div>
      );

    default:
      return <div>Peran tidak dikenali</div>;
  }
};
