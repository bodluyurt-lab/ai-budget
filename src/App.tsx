import { useState } from 'react';
import type { Page } from './types';
import { ALERTS } from './data';
import Sidebar from './Sidebar';
import {
  Dashboard, UsagePage, ProvidersPage, ModelsPage,
  BudgetsPage, InsightsPage, AlertsPage, SettingsPage,
} from './pages';
import { ToastProvider } from './ToastProvider';

function Shell() {
  const [page, setPage] = useState<Page>('dashboard');
  const unreadAlerts = ALERTS.filter(a => !a.read && !a.dismissed).length;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNav={setPage} />;
      case 'usage':     return <UsagePage />;
      case 'providers': return <ProvidersPage />;
      case 'models':    return <ModelsPage />;
      case 'budgets':   return <BudgetsPage />;
      case 'insights':  return <InsightsPage />;
      case 'alerts':    return <AlertsPage onNav={setPage} />;
      case 'settings':  return <SettingsPage />;
    }
  };

  const pageLabel = page === 'insights' ? 'AI Insights' : page.charAt(0).toUpperCase() + page.slice(1);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar current={page} onChange={setPage} alertCount={unreadAlerts} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-zinc-600 hidden sm:flex items-center gap-1.5">
            <span>Baran's AI Workspace</span>
            <span className="text-zinc-800">/</span>
            <span className="text-zinc-400">{pageLabel}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-zinc-600 hidden md:block">Oct 2026</span>
            <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold select-none">B</div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
