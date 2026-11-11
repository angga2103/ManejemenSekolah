import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterTenantPage } from './pages/auth/RegisterTenantPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPrototypes } from './pages/dashboards/DashboardPrototypes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentRole, setCurrentRole] = useState<string>('principal');
  const [authView, setAuthView] = useState<'login' | 'register-tenant'>('login');

  // Sync role with user activeRole if authenticated
  React.useEffect(() => {
    if (user?.activeRole?.slug) {
      setCurrentRole(user.activeRole.slug as string);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Memuat Sesi Multi-Tenant...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register-tenant') {
      return (
        <RegisterTenantPage
          onBackToLogin={() => setAuthView('login')}
          onSuccess={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginPage
        onSuccess={() => {}}
        onGoToRegisterTenant={() => setAuthView('register-tenant')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <Navbar currentRole={currentRole} onRoleChange={setCurrentRole} />

      <div className="flex flex-1">
        <Sidebar currentRole={currentRole} />

        <main className="flex-1 p-8 overflow-y-auto">
          <DashboardPrototypes role={currentRole} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};
