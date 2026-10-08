import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Toast } from './types';

interface ToastCtx { addToast: (msg: string, type?: Toast['type']) => void; }
const ToastContext = createContext<ToastCtx>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

let _counter = 0;
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(++_counter);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  const icons: Record<Toast['type'], string> = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
  const colors: Record<Toast['type'], string> = {
    success: 'bg-emerald-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 shadow-xl min-w-64 max-w-80 pointer-events-auto animate-fade-in-up">
            <span className={`flex-none w-5 h-5 rounded-full ${colors[t.type]} flex items-center justify-center text-white text-xs font-bold`}>{icons[t.type]}</span>
            <span className="text-sm text-zinc-200 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
