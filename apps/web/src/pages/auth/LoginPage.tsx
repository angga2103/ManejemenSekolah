import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { School, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onGoToRegisterTenant?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onGoToRegisterTenant,
}) => {
  const { login, resolveTenant, tenant, isLoading } = useAuth();

  const [tenantSlug, setTenantSlug] = useState('alhikmah');
  const [identifier, setIdentifier] = useState('admin@alhikmah.sch.id');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);

  const handleResolveTenant = async () => {
    if (!tenantSlug.trim()) return;
    setError(null);
    const resolved = await resolveTenant(tenantSlug);
    if (!resolved) {
      setError(`Lembaga dengan kode '${tenantSlug}' tidak ditemukan.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({
        identifier,
        password,
        tenantSlug: tenantSlug || undefined,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa username dan password Anda.');
    }
  };

  const handleQuickFill = (email: string) => {
    setIdentifier(email);
    setPassword('Password123!');
    setTenantSlug('alhikmah');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-900/50">
            <School className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {tenant ? tenant.name : 'Sistem Informasi Sekolah & Pesantren'}
          </h1>
          <p className="text-sm text-slate-400">
            Multi-Tenant Educational & Islamic Boarding SaaS Platform
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="bg-slate-800/90 border-slate-700/80 p-6 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2">
              <span className="font-semibold">Perhatian:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Kode Lembaga / Subdomain
              </label>
              <div className="flex gap-2">
                <Input
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="contoh: alhikmah"
                  className="bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResolveTenant}
                  className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs px-3"
                >
                  Cek
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email atau No. Handphone
              </label>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@alhikmah.sch.id"
                required
                className="bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Kata Sandi
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Portal'}
            </Button>
          </form>

          {/* Quick Demo Credentials selector */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Uji Coba Cepat (Akun Demo):</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@alhikmah.sch.id')}
                className="p-2 rounded bg-slate-900/60 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 text-left text-slate-300 transition"
              >
                <div className="font-semibold text-emerald-400">Kepala Sekolah</div>
                <div className="text-[10px] text-slate-500 truncate">admin@alhikmah</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('bendahara@alhikmah.sch.id')}
                className="p-2 rounded bg-slate-900/60 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 text-left text-slate-300 transition"
              >
                <div className="font-semibold text-emerald-400">Bendahara</div>
                <div className="text-[10px] text-slate-500 truncate">bendahara@alhikmah</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('guru@alhikmah.sch.id')}
                className="p-2 rounded bg-slate-900/60 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 text-left text-slate-300 transition"
              >
                <div className="font-semibold text-emerald-400">Dewan Guru</div>
                <div className="text-[10px] text-slate-500 truncate">guru@alhikmah</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('musyrif@alhikmah.sch.id')}
                className="p-2 rounded bg-slate-900/60 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 text-left text-slate-300 transition"
              >
                <div className="font-semibold text-emerald-400">Musyrif Asrama</div>
                <div className="text-[10px] text-slate-500 truncate">musyrif@alhikmah</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link to Tenant Registration */}
        <div className="text-center text-xs text-slate-400">
          Lembaga Anda belum terdaftar?{' '}
          <button
            type="button"
            onClick={onGoToRegisterTenant}
            className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
          >
            Daftarkan Sekolah / Pesantren Baru <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
