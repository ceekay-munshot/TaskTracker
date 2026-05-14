import type { ReactNode } from 'react';
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SelectOption } from './Field';
import { SearchBar } from './SearchBar';

export interface FilterSelectConfig {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  allLabel?: string;
}

export interface FilterToggleConfig {
  key: string;
  label: string;
  active: boolean;
  onChange: (active: boolean) => void;
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  selects?: FilterSelectConfig[];
  toggles?: FilterToggleConfig[];
  hasActiveFilters?: boolean;
  onReset?: () => void;
  children?: ReactNode;
  className?: string;
}

function CompactSelect({ config }: { config: FilterSelectConfig }) {
  return (
    <div className="relative">
      <select
        value={config.value}
        onChange={(e) => config.onChange(e.target.value)}
        className={cn(
          'h-9 cursor-pointer appearance-none rounded-lg border border-ink-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-ink-600 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
          config.value && 'border-brand-300 bg-brand-50/60 text-brand-700',
        )}
      >
        <option value="">{config.allLabel ?? `All ${config.label}`}</option>
        {config.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

export function FilterBar({
  search,
  selects = [],
  toggles = [],
  hasActiveFilters = false,
  onReset,
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'card flex flex-wrap items-center gap-2.5 p-3',
        className,
      )}
    >
      {search && (
        <SearchBar
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          className="min-w-[12rem] flex-1"
        />
      )}

      {selects.length > 0 && (
        <div className="flex items-center gap-1.5 text-ink-300">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
      )}
      {selects.map((config) => (
        <CompactSelect key={config.key} config={config} />
      ))}

      {toggles.map((toggle) => (
        <button
          key={toggle.key}
          type="button"
          onClick={() => toggle.onChange(!toggle.active)}
          className={cn(
            'h-9 rounded-lg px-3 text-xs font-semibold transition',
            toggle.active
              ? 'bg-brand-500 text-white shadow-soft'
              : 'border border-ink-200 bg-white text-ink-500 hover:bg-ink-50',
          )}
        >
          {toggle.label}
        </button>
      ))}

      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      )}

      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
