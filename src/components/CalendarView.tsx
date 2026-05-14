import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Meeting } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { cn } from '@/utils/cn';
import { meetingTypeColor, swatch } from '@/utils/palette';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView({ meetings }: { meetings: Meeting[] }) {
  const { getClient } = useStore();
  const ui = useUI();
  const today = new Date();
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  // Monday-first offset
  const startOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const meetingsForDay = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day,
    ).padStart(2, '0')}`;
    return meetings.filter((m) => m.date === key);
  };

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-base font-extrabold text-ink-800">
          {cursor.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-100"
            onClick={() =>
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
            }
          >
            Today
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-ink-400"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={cn(
              'min-h-[5.5rem] rounded-xl border p-1.5',
              day === null
                ? 'border-transparent'
                : isToday(day)
                  ? 'border-brand-300 bg-brand-50/60'
                  : 'border-ink-100 bg-white/60',
            )}
          >
            {day !== null && (
              <>
                <p
                  className={cn(
                    'mb-1 text-xs font-bold',
                    isToday(day) ? 'text-brand-600' : 'text-ink-400',
                  )}
                >
                  {day}
                </p>
                <div className="space-y-1">
                  {meetingsForDay(day).map((m) => {
                    const s = swatch(meetingTypeColor(m.meetingType));
                    const client = getClient(m.clientId);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => ui.editMeeting(m)}
                        className={cn(
                          'block w-full truncate rounded-md px-1.5 py-1 text-left text-[10px] font-semibold',
                          s.soft,
                          s.text,
                        )}
                        title={`${m.title} · ${m.time} · ${
                          client?.name ?? 'Internal'
                        }`}
                      >
                        {m.time} {m.title}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
