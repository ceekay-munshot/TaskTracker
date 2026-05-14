import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { uid } from '@/utils/ids';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; accent: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: 'border-l-emerald-500',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    accent: 'border-l-rose-500',
    iconColor: 'text-rose-500',
  },
  info: {
    icon: Info,
    accent: 'border-l-brand-500',
    iconColor: 'text-brand-500',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'border-l-amber-500',
    iconColor: 'text-amber-500',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const toast: ToastItem = { id: uid('toast'), variant, title, description };
      setToasts((list) => [...list.slice(-3), toast]);
      window.setTimeout(() => dismiss(toast.id), 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push('success', t, d),
      error: (t, d) => push('error', t, d),
      info: (t, d) => push('info', t, d),
      warning: (t, d) => push('warning', t, d),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = VARIANT_STYLES[toast.variant];
            const Icon = style.icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 border-ink-200/70 bg-white/95 p-3.5 shadow-card backdrop-blur',
                  style.accent,
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconColor)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-800">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs text-ink-500">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="icon-btn h-7 w-7"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
