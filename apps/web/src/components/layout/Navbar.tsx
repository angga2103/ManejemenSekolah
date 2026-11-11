import React from 'react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { LogOut, School } from 'lucide-react';

interface NavbarProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange }) => {
  const { user, tenant, logout, switchRole } = useAuth();

  const handleRoleSelect = async (newRoleSlug: string) => {
    onRoleChange(newRoleSlug);
    if (user && user.roles) {
      const target = user.roles.find((r) => r.slug === newRoleSlug);
      if (target) {
        await switchRole(target.id).catch(() => null);
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              {tenant ? tenant.name : 'EduSaaS Manajemen'}
            </span>
            <div className="text-[10px] text-slate-500 font-medium">
              Multi-Tenant Integrated Platform
            </div>
          </div>
        </div>
        <Badge variant="success">Phase 1: IAM Active</Badge>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500 hidden md:inline">
            Peran Aktif:
          </span>
          <select
            value={currentRole}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))
            ) : (
              <>
                <option value="super_admin">1. SaaS Super Admin</option>
                <option value="principal">2. Kepala Sekolah / Pengasuh</option>
                <option value="treasurer">3. Bendahara / Keuangan</option>
                <option value="teacher">4. Guru / Ustaz</option>
                <option value="student">5. Siswa / Santri</option>
                <option value="guardian">6. Wali Santri / Orang Tua</option>
              </>
            )}
          </select>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* User Identity Profile & Logout */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
            {getInitials(user?.fullName)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800">
              {user?.fullName || 'Pengguna Terautentikasi'}
            </p>
            <p className="text-[10px] text-slate-500">
              {user?.email || (tenant ? tenant.subdomain : 'alhikmah')}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Keluar Akun"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
