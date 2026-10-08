import { useState } from 'react';
import type { Page } from './types';
import {
  LayoutDashboard, TrendingUp, Cpu, Zap, DollarSign,
  Lightbulb, Bell, Settings, ChevronRight, X, Menu,
  HelpCircle, CreditCard
} from 'lucide-react';

const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'usage', label: 'Usage', icon: TrendingUp },
  { id: 'providers', label: 'Providers', icon: Cpu },
  { id: 'models', label: 'Models', icon: Zap },
  { id: 'budgets', label: 'Budgets', icon: DollarSign },
  { id: 'insights', label: 'AI Insights', icon: Lightbulb },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

interface Props { current: Page; onChange: (p: Page) => void; alertCount: number; }

export default function Sidebar({ current, onChange, alertCount }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.map(item => (
    <button
      key={item.id}
      onClick={() => { onChange(item.id); setMobileOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
        current === item.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
      }`}
    >
      <item.icon size={16} className="flex-none" />
      <span>{item.label}</span>
      {item.id === 'alerts' && alertCount > 0 && (
        <span className="ml-auto flex-none bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {alertCount > 9 ? '9+' : alertCount}
        </span>
      )}
      {current === item.id && alertCount === 0 && item.id !== 'alerts' && (
        <ChevronRight size={14} className="ml-auto flex-none text-zinc-600" />
      )}
    </button>
  ));

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-zinc-400"
        onClick={() => setMobileOpen(v => !v)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col p-3
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center gap-2 px-2 mb-6 mt-1">
          <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center flex-none">
            <DollarSign size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-zinc-100 tracking-tight">AI Budget</span>
          <span className="ml-auto text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 font-medium">Demo</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">{items}</nav>

        <div className="mt-3">
          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-0.5">
            <button
              onClick={() => { onChange('settings'); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                current === 'settings' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Settings size={16} /><span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors">
              <HelpCircle size={16} /><span>Help</span>
            </button>
          </div>
          <div className="mt-3 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={13} className="text-sky-400" />
              <span className="text-xs font-semibold text-zinc-300">Pro Plan</span>
              <span className="ml-auto text-[10px] bg-sky-500/15 text-sky-400 rounded px-1.5 py-0.5 font-medium">Active</span>
            </div>
            <div className="text-[11px] text-zinc-500 mb-2">8,240 / 10,000 credits</div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: '82.4%' }} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
