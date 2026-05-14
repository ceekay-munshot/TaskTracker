import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { swatch, type ColorName } from '@/utils/palette';

interface PanelProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: ColorName;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}

export function Panel({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'indigo',
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: PanelProps) {
  const s = swatch(iconColor);
  return (
    <section className={cn('card flex flex-col', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  s.soft,
                  s.text,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-sm font-bold text-ink-800">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="truncate text-xs text-ink-400">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('flex-1', padded && 'p-4', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

interface MiniStatProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  color?: ColorName;
  hint?: string;
}

export function MiniStat({
  label,
  value,
  icon: Icon,
  color = 'slate',
  hint,
}: MiniStatProps) {
  const s = swatch(color);
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 p-3">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn('h-3.5 w-3.5', s.text)} />}
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
          {label}
        </p>
      </div>
      <p className="mt-1 font-display text-xl font-extrabold text-ink-800">
        {value}
      </p>
      {hint && <p className={cn('text-[11px] font-medium', s.text)}>{hint}</p>}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink-800">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
