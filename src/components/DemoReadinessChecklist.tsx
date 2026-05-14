import { useState } from 'react';
import { CheckCircle2, Circle, MinusCircle, Plus, X } from 'lucide-react';
import type { DemoReadinessStatus } from '@/types';
import { useStore } from '@/store/StoreContext';
import { ReadinessBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TextInput } from '@/components/ui/Field';
import { cn } from '@/utils/cn';
import { demoBadgeColor } from '@/utils/palette';

const NEXT_STATUS: Record<DemoReadinessStatus, DemoReadinessStatus> = {
  Pending: 'Done',
  Done: 'Not Required',
  'Not Required': 'Pending',
};

function StatusIcon({ status }: { status: DemoReadinessStatus }) {
  if (status === 'Done')
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === 'Not Required')
    return <MinusCircle className="h-5 w-5 text-slate-400" />;
  return <Circle className="h-5 w-5 text-amber-400" />;
}

export function DemoReadinessChecklist({
  workItemId,
}: {
  workItemId: string;
}) {
  const {
    data,
    derived,
    updateDemoReadinessItem,
    addDemoReadinessItem,
    deleteDemoReadinessItem,
    getWorkItem,
  } = useStore();
  const [newLabel, setNewLabel] = useState('');

  const items = data.demoReadinessItems.filter(
    (d) => d.workItemId === workItemId,
  );
  const result = derived.readinessByItem.get(workItemId);
  const workItem = getWorkItem(workItemId);

  const addItem = () => {
    if (!newLabel.trim()) return;
    addDemoReadinessItem({
      workItemId,
      label: newLabel.trim(),
      status: 'Pending',
      ownerId: workItem?.ownerId ?? null,
      notes: '',
    });
    setNewLabel('');
  };

  return (
    <div>
      {result && (
        <div className="mb-3 rounded-xl bg-ink-50 p-3">
          <div className="flex items-center justify-between">
            <ReadinessBadge badge={result.badge} percent={result.percent} />
            <span className="text-xs font-semibold text-ink-500">
              {result.done}/{result.applicable} done
            </span>
          </div>
          <ProgressBar
            value={result.percent}
            color={demoBadgeColor(result.badge)}
            size="sm"
            className="mt-2"
          />
        </div>
      )}

      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-50"
          >
            <button
              type="button"
              onClick={() =>
                updateDemoReadinessItem(item.id, {
                  status: NEXT_STATUS[item.status],
                })
              }
              className="shrink-0"
              title="Cycle status"
            >
              <StatusIcon status={item.status} />
            </button>
            <span
              className={cn(
                'flex-1 text-sm',
                item.status === 'Done'
                  ? 'font-medium text-ink-500 line-through'
                  : item.status === 'Not Required'
                    ? 'text-ink-400'
                    : 'font-medium text-ink-700',
              )}
            >
              {item.label}
            </span>
            <button
              type="button"
              onClick={() => deleteDemoReadinessItem(item.id)}
              className="shrink-0 text-ink-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
              aria-label="Remove checklist item"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-2 py-3 text-sm text-ink-400">
            No checklist items yet — add the first one below.
          </li>
        )}
      </ul>

      <div className="mt-2 flex gap-2">
        <TextInput
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Add a readiness check…"
        />
        <button
          type="button"
          onClick={addItem}
          className="btn-ghost shrink-0 px-3"
          aria-label="Add item"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
