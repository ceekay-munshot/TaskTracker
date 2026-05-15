import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export function toOptions(values: readonly string[]): SelectOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

/* ----------------------------- Field wrapper ---------------------------- */

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="label-text">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* ----------------------------- Text inputs ------------------------------ */

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function TextInput({ invalid, className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        'input',
        invalid && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
        className,
      )}
      {...props}
    />
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function TextArea({ invalid, className, ...props }: TextAreaProps) {
  return (
    <textarea
      rows={3}
      className={cn(
        'input resize-none',
        invalid && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------- Select --------------------------------- */

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> & {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  invalid,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'input cursor-pointer appearance-none pr-9',
          !value && placeholder && 'text-ink-400',
          invalid &&
            'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

/* ----------------------------- MultiSelect ------------------------------ */

interface MultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  emptyHint?: string;
  /** Shown when 1+ selected. Defaults to "N selected". */
  summary?: (count: number, selectedLabels: string[]) => string;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  invalid,
  emptyHint,
  summary,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const triggerText =
    value.length === 0
      ? placeholder
      : summary
        ? summary(value.length, selectedLabels)
        : selectedLabels.length <= 2
          ? selectedLabels.join(', ')
          : `${selectedLabels.length} selected`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'input flex w-full cursor-pointer items-center justify-between pr-9 text-left',
          value.length === 0 && 'text-ink-400',
          invalid &&
            'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
        )}
      >
        <span className="truncate">{triggerText}</span>
      </button>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-ink-200 bg-white p-1 shadow-card">
          {options.length === 0 ? (
            <p className="px-2.5 py-3 text-center text-xs text-ink-400">
              {emptyHint ?? 'Nothing to pick yet'}
            </p>
          ) : (
            options.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                    checked
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-700 hover:bg-ink-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-ink-300 bg-white',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Number / Date ------------------------------ */

export function NumberInput({ invalid, className, ...props }: TextInputProps) {
  return (
    <input
      type="number"
      className={cn(
        'input',
        invalid && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
        className,
      )}
      {...props}
    />
  );
}

export function DateInput({ invalid, className, ...props }: TextInputProps) {
  return (
    <input
      type="date"
      className={cn(
        'input cursor-pointer',
        invalid && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------- Toggle -------------------------------- */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-500' : 'bg-ink-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[1.45rem]' : 'translate-x-1',
          )}
          style={{ height: '1.125rem', width: '1.125rem' }}
        />
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && (
            <span className="block text-sm font-semibold text-ink-700">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-ink-400">{description}</span>
          )}
        </span>
      )}
    </button>
  );
}

/* ------------------------------ Tag input ------------------------------- */

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft('');
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="btn-ghost shrink-0 px-3"
          aria-label="Add"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-brand-400 hover:text-brand-700"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Chip toggle group -------------------------- */

interface ChipToggleGroupProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function ChipToggleGroup({
  options,
  value,
  onChange,
}: ChipToggleGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange(
                active
                  ? value.filter((v) => v !== opt.value)
                  : [...value, opt.value],
              )
            }
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
              active
                ? 'bg-brand-500 text-white shadow-soft'
                : 'bg-ink-100 text-ink-500 hover:bg-ink-200',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------- Segmented control --------------------------- */

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-ink-200 bg-white p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition',
              active
                ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft'
                : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
