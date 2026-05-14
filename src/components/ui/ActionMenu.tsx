import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MenuAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionMenuProps {
  actions: MenuAction[];
  align?: 'left' | 'right';
  triggerClassName?: string;
}

export function ActionMenu({
  actions,
  align = 'right',
  triggerClassName,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = actions.filter((a) => !a.hidden);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn('icon-btn', open && 'bg-ink-100 text-ink-800', triggerClassName)}
        aria-label="Actions"
      >
        <MoreHorizontal className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-ink-200/80 bg-white p-1 shadow-card animate-scale-in',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {visible.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
                  action.tone === 'danger'
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-800',
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
