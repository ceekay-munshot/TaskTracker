import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { Feedback } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import {
  Badge,
  FeedbackStatusBadge,
  PriorityBadge,
} from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { rankImprovements } from '@/utils/improvements';
import { cn } from '@/utils/cn';

interface Props {
  feedback: Feedback[];
  limit?: number;
  emptyHint?: string;
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
        description={emptyHint ?? 'Add feedback to build the prioritised backlog.'}
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
        const scoreColor =
          item.priorityScore >= 26
            ? 'rose'
            : item.priorityScore >= 16
              ? 'amber'
              : 'slate';
        return (
          <li
            key={f.id}
            className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white/70 p-3 transition hover:border-ink-200"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-ink-300">
                #{index + 1}
              </span>
              <span
                className={cn(
                  'flex h-9 w-9 flex-col items-center justify-center rounded-lg text-sm font-extrabold',
                  scoreColor === 'rose' && 'bg-rose-100 text-rose-700',
                  scoreColor === 'amber' && 'bg-amber-100 text-amber-700',
                  scoreColor === 'slate' && 'bg-ink-100 text-ink-500',
                )}
                title="Priority score"
              >
                {item.priorityScore}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-ink-800">
                {f.feedbackText}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge color="slate" size="xs">
                  {f.source}
                </Badge>
                <PriorityBadge priority={f.priority} />
                <Badge color="sky" size="xs" soft>
                  Impact: {f.businessImpact}
                </Badge>
                <Badge color="violet" size="xs" soft>
                  Effort: {f.effort}
                </Badge>
                {f.frequencyCount > 1 && (
                  <Badge color="orange" size="xs" soft>
                    ×{f.frequencyCount} repeats
                  </Badge>
                )}
                <FeedbackStatusBadge status={f.status} />
              </div>
              <p className="mt-1 truncate text-[11px] text-ink-400">
                {client ? client.name : 'No client'}
                {workItem ? ` · ${workItem.title}` : ''}
              </p>
            </div>
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
                  onClick: () => f.workItemId && ui.openWorkItem(f.workItemId),
                },
                {
                  label: 'Delete feedback',
                  icon: Trash2,
                  tone: 'danger',
                  onClick: () => handleDelete(f),
                },
              ]}
            />
          </li>
        );
      })}
    </ol>
  );
}
