/** Date helpers. All "ISO" inputs accept `YYYY-MM-DD` or full ISO timestamps. */

function parseDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const MS_PER_DAY = 86_400_000;

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseDate(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseDate(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(iso: string): number {
  const target = startOfDay(parseDate(iso));
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function daysOverdue(iso: string): number {
  return Math.max(0, -daysUntil(iso));
}

export function isOverdue(iso: string): boolean {
  return daysUntil(iso) < 0;
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (startOfDay(parseDate(b)).getTime() - startOfDay(parseDate(a)).getTime()) /
      MS_PER_DAY,
  );
}

export function relativeTime(iso: string): string {
  const diff = daysUntil(iso);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${-diff} days ago`;
}

/** Human-friendly tenure, e.g. "1 yr 4 mo" or "8 mo" or "12 days". */
export function timeSince(iso: string): string {
  const start = parseDate(iso);
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 1) {
    const days = Math.max(0, daysBetween(iso, todayISO()));
    return days <= 1 ? 'new joiner' : `${days} days`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}

export function monthKey(iso: string): string {
  const d = parseDate(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
  });
}

/** Sorted list of the last `count` month keys, oldest first, ending this month. */
export function recentMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}
