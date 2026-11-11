import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { School, ArrowLeft } from 'lucide-react';
import type { SubscriptionTier } from '@edusaas/shared-types';

interface RegisterTenantPageProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterTenantPage: React.FC<RegisterTenantPageProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const { registerTenant, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isFormalEnabled, setIsFormalEnabled] = useState(true);
  const [isPesantrenEnabled, setIsPesantrenEnabled] = useState(true);
  const [tier, setTier] = useState<SubscriptionTier>('STANDARD' as SubscriptionTier);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const cleanSubdomain = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setSlug(generatedSlug);
    setSubdomain(cleanSubdomain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !slug || !subdomain || !adminEmail || !adminPassword) {
      setError('Harap lengkapi semua bidang wajib.');
      return;
    }

    try {
      await registerTenant({
        name,
        slug,
        subdomain,
        adminFullName,
        adminEmail,
        adminPhone: adminPhone || undefined,
        adminPassword,
        isFormalEnabled,
        isPesantrenEnabled,
        tier,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftarkan lembaga. Coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            Registrasi Multi-Tenant SaaS
          </span>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-6 shadow-2xl">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-400" /> Daftarkan Lembaga Pendidikan Baru
            </h2>
            <p className="text-xs text-slate-400">
              Mulai uji coba gratis untuk Sekolah Formal, Madrasah, dan Pondok Pesantren Terintegrasi.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Section 1: Data Lembaga */}
            <div className="space-y-3 pb-4 border-b border-slate-700/60">
              <h3 className="font-semibold text-slate-300 uppercase tracking-wider">
                1. Identitas Lembaga
              </h3>

              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap Lembaga *</label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="cth: Pondok Pesantren & SMA Nurul Jadid"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Slug Kode Lembaga *</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="nurul-jadid"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subdomain Unik *</label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="nuruljadid"
                      required
                      className="bg-slate-900 border-slate-700 text-white flex-1"
                    />
                    <span className="text-slate-500">.edusaas.id</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFormalEnabled}
                    onChange={(e) => setIsFormalEnabled(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Unit Sekolah Formal (SD/SMP/SMA/SMK)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPesantrenEnabled}
                    onChange={(e) => setIsPesantrenEnabled(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Unit Pondok Pesantren & Asrama</span>
                </label>
              </div>
            </div>

            {/* Section 2: Akun Administrator Awal */}
            <div className="space-y-3 pb-4 border-b border-slate-700/60">
              <h3 className="font-semibold text-slate-300 uppercase tracking-wider">
                2. Administrator Utama (Pimpinan Lembaga)
              </h3>

              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap Pimpinan *</label>
                <Input
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="Dr. KH. Abdullah Zawawi"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email Resmi Admin *</label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="pimpinan@nuruljadid.sch.id"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">No. WhatsApp / HP</label>
                  <Input
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="081234567890"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kata Sandi Baru *</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimal 8 karakter aman"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Section 3: Pilihan Paket Langganan */}
            <div className="space-y-2">
              <label className="block text-slate-400">Pilih Paket SaaS Awal:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'BASIC' as SubscriptionTier, name: 'Basic (500 Siswa)', color: 'border-slate-700' },
                  { id: 'STANDARD' as SubscriptionTier, name: 'Standard (1.500 Siswa)', color: 'border-emerald-500' },
                  { id: 'PREMIUM' as SubscriptionTier, name: 'Premium (3.000 Siswa)', color: 'border-blue-500' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTier(item.id)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      tier === item.id
                        ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-xs">{item.name}</div>
                    <div className="text-[10px] text-slate-500">1 Tahun Uji Coba</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg mt-4 shadow-lg shadow-emerald-800/40"
            >
              {isLoading ? 'Sedang Memproses Sistem...' : 'Daftarkan & Mulai Gunakan Sekarang'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
