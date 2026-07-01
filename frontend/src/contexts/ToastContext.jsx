import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from '../components/Icon';

const ToastCtx = createContext(null);


const ICONS = {
  success: 'solar:check-circle-bold',
  error: 'solar:danger-circle-bold',
  warning: 'solar:warning-bold',
  info: 'solar:info-circle-bold',
};

const COLORS = {
  success: { border: 'border-l-success-500', icon: 'text-success-400', bg: 'bg-success-500/8' },
  error:   { border: 'border-l-error-500',    icon: 'text-error-400',    bg: 'bg-error-500/8' },
  warning: { border: 'border-l-warning-500',   icon: 'text-warning-400',   bg: 'bg-warning-500/8' },
  info:    { border: 'border-l-primary-500',  icon: 'text-primary-400',  bg: 'bg-primary-500/8' },
};

function ToastItem({ id, type = 'info', title, message, onDismiss }) {
  const c = COLORS[type] || COLORS.info;
  return (
    <div
      className={`flex items-start gap-3 w-80 rounded-xl border border-zinc-800 border-l-2 ${c.border} bg-[#111113] shadow-xl px-4 py-3.5 animate-toast-in`}
      role="alert"
    >
      <Icon icon={ICONS[type] || ICONS.info} width={18} className={`${c.icon} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium text-zinc-100 leading-snug">{title}</p>}
        {message && <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <Icon icon="solar:close-circle-linear" width={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const toast = useContext(ToastCtx);
  if (!toast) throw new Error('useToast must be used inside ToastProvider');

  const success = useCallback((title, message, opts) => toast({ type: 'success', title, message, ...opts }), [toast]);
  const error   = useCallback((title, message, opts) => toast({ type: 'error',   title, message, ...opts }), [toast]);
  const warning = useCallback((title, message, opts) => toast({ type: 'warning', title, message, ...opts }), [toast]);
  const info    = useCallback((title, message, opts) => toast({ type: 'info',    title, message, ...opts }), [toast]);

  return { toast, success, error, warning, info };
}
