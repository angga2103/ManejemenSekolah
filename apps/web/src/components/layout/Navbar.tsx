import React from 'react';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
          EduSaaS Manajemen
        </span>
        <Badge variant="success">Phase 0 Baseline</Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500">Pratinjau Peran:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="super_admin">1. SaaS Super Admin</option>
            <option value="principal">2. Kepala Sekolah / Pengasuh</option>
            <option value="treasurer">3. Bendahara / Keuangan</option>
            <option value="teacher">4. Guru / Ustaz</option>
            <option value="student">5. Siswa / Santri</option>
            <option value="guardian">6. Wali Santri / Orang Tua</option>
          </select>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
            AY
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800">Admin Yayasan</p>
            <p className="text-[10px] text-slate-500">Pondok Pesantren Al-Ikhlas</p>
          </div>
        </div>
      </div>
    </header>
  );
};
