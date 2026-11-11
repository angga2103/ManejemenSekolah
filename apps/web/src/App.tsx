import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          EduSaaS Management
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Sistem Manajemen Terpadu Sekolah & Pondok Pesantren Multi-Tenant
        </p>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Phase 0: Architecture & Foundation Ready
        </div>
      </div>
    </div>
  );
};
