import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPrototypes } from './pages/dashboards/DashboardPrototypes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<string>('principal');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
        <Navbar currentRole={currentRole} onRoleChange={setCurrentRole} />

        <div className="flex flex-1">
          <Sidebar currentRole={currentRole} />

          <main className="flex-1 p-8 overflow-y-auto">
            <DashboardPrototypes role={currentRole} />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};
