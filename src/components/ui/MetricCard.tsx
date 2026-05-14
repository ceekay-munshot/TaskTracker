import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { swatch, type ColorName } from '@/utils/palette';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  color?: ColorName;
  hint?: string;
  sublabel?: string;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  color = 'indigo',
  hint,
  sublabel,
  onClick,
  className,
}: MetricCardProps) {
  const s = swatch(color);
  const interactive = Boolean(onClick);

  return (
    <motion.div
      whileHover={interactive ? { y: -3 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        'card relative overflow-hidden p-4',
        interactive && 'cursor-pointer card-hover',
        className,
      )}
    >
      <div
        className={cn(
          'absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-50 blur-2xl',
          s.soft,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold leading-none text-ink-800">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1.5 text-xs text-ink-400">{sublabel}</p>
          )}
          {hint && (
            <p className={cn('mt-1.5 text-xs font-semibold', s.text)}>{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              s.soft,
              s.text,
            )}
          >
            <Icon className="h-5.5 w-5.5" style={{ height: 22, width: 22 }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
