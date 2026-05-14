import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PendingState>({
    open: false,
    title: '',
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const isDanger = state.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state.open}
        onClose={() => settle(false)}
        size="sm"
        level="top"
        icon={isDanger ? Trash2 : AlertTriangle}
        title={state.title}
        footer={
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => settle(false)}
            >
              {state.cancelLabel ?? 'Cancel'}
            </button>
            <button
              type="button"
              className={isDanger ? 'btn-danger' : 'btn-primary'}
              onClick={() => settle(true)}
            >
              {state.confirmLabel ?? 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-500">
          {state.description ??
            'This action cannot be undone. Are you sure you want to continue?'}
        </p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
