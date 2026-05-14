import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { Feedback } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { FeedbackStatusBadge } from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { rankImprovements } from '@/utils/improvements';
import { cn } from '@/utils/cn';

interface Props {
  feedback: Feedback[];
  limit?: number;
  emptyHint?: string;
}

interface Tier {
  bar: string;
  chip: string;
}

function scoreTier(score: number): Tier {
  if (score >= 26) {
    return { bar: 'bg-rose-400', chip: 'bg-rose-100 text-rose-700' };
  }
  if (score >= 16) {
    return { bar: 'bg-amber-400', chip: 'bg-amber-100 text-amber-700' };
  }
  return { bar: 'bg-ink-300', chip: 'bg-ink-100 text-ink-600' };
}

/** A single muted "label value" factor — no colour noise. */
function Factor({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[11px] text-ink-400">
      {label} <span className="font-bold text-ink-700">{value}</span>
    </span>
  );
}

export function ImprovementPriorityList({ feedback, limit, emptyHint }: Props) {
  const { getClient, getWorkItem, deleteFeedback } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();

  const ranked = rankImprovements(feedback, (id) => getClient(id));
  const shown = limit ? ranked.slice(0, limit) : ranked;

  if (shown.length === 0) {
    return (
      <EmptyState
        title="No improvements ranked"
        description={
          emptyHint ?? 'Add feedback to build the prioritised backlog.'
        }
        compact
      />
    );
  }

  const handleDelete = async (f: Feedback) => {
    const ok = await confirm({
      title: 'Delete this feedback item?',
      description: f.feedbackText,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) {
      deleteFeedback(f.id);
      toast.success('Feedback deleted');
    }
  };

  return (
    <ol className="space-y-2">
      {shown.map((item, index) => {
        const f = item.feedback;
        const client = getClient(f.clientId);
        const workItem = getWorkItem(f.workItemId);
        const tier = scoreTier(item.priorityScore);
        return (
          <li
            key={f.id}
            className="relative overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:border-ink-200 hover:shadow-soft"
          >
            <span
              className={cn('absolute inset-y-0 left-0 w-1', tier.bar)}
            />
            <div className="flex gap-3.5 py-3 pl-4 pr-2.5">
              {/* Score */}
              <div className="flex w-12 shrink-0 flex-col items-center pt-0.5">
                <span className="text-[10px] font-bold text-ink-300">
                  #{index + 1}
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex h-10 w-12 items-center justify-center rounded-lg font-display text-lg font-extrabold',
                    tier.chip,
                  )}
                  title={`Priority score ${item.priorityScore}`}
                >
                  {item.priorityScore}
                </span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-ink-300">
                  Score
                </span>
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-ink-800">
                    {f.feedbackText}
                  </p>
                  <div className="-mr-1 -mt-1 shrink-0">
                    <ActionMenu
                      actions={[
                        {
                          label: 'Edit feedback',
                          icon: Pencil,
                          onClick: () => ui.editFeedback(f),
                        },
                        {
                          label: 'Open work item',
                          icon: ExternalLink,
                          hidden: !f.workItemId,
                          onClick: () =>
                            f.workItemId && ui.openWorkItem(f.workItemId),
                        },
                        {
                          label: 'Delete feedback',
                          icon: Trash2,
                          tone: 'danger',
                          onClick: () => handleDelete(f),
                        },
                      ]}
                    />
                  </div>
                </div>

                <p className="mt-1 truncate text-xs text-ink-400">
                  {client ? client.name : 'No client'}
                  {workItem ? ` · ${workItem.title}` : ''}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <FeedbackStatusBadge status={f.status} />
                  <Factor label="Source" value={f.source} />
                  <Factor label="Impact" value={f.businessImpact} />
                  <Factor label="Effort" value={f.effort} />
                  {f.frequencyCount > 1 && (
                    <Factor label="Repeats" value={`×${f.frequencyCount}`} />
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
