import { cn } from '@/utils/cn';
import { swatch, type ColorName } from '@/utils/palette';
import { clamp } from '@/utils/collections';

interface ProgressBarProps {
  value: number;
  color?: ColorName;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({
  value,
  color = 'indigo',
  size = 'md',
  showLabel = false,
  className,
  trackClassName,
}: ProgressBarProps) {
  const pct = clamp(Math.round(value), 0, 100);
  const s = swatch(color);
  const height =
    size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-ink-100',
          height,
          trackClassName,
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out',
            s.solid,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-600">
          {pct}%
        </span>
      )}
    </div>
  );
}

/** Thin segmented ring used for compact KPI tiles. */
export function ProgressRing({
  value,
  size = 44,
  stroke = 5,
  color = 'indigo',
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: ColorName;
  label?: string;
}) {
  const pct = clamp(Math.round(value), 0, 100);
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const s = swatch(color);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ stroke: s.hex, transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums text-ink-700">
        {label ?? `${pct}%`}
      </span>
    </div>
  );
}
