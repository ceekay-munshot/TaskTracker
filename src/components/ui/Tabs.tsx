import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TabDef {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  layoutId = 'tabs',
}: TabsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 rounded-2xl border border-ink-200/70 bg-white/70 p-1.5 backdrop-blur',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'text-white'
                : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-ink-100 text-ink-500',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
