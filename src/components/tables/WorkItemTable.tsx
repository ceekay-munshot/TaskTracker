import {
  ArrowLeftRight,
  CheckSquare,
  Eye,
  Link2,
  MessageSquarePlus,
  Pencil,
  Trash2,
  Video,
} from 'lucide-react';
import type { WorkItem } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import {
  Badge,
  PriorityBadge,
  StatusBadge,
  TypeBadge,
  WorkflowStageBadge,
} from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { daysUntil, formatDate } from '@/utils/dates';
import { effectiveStatus } from '@/utils/workItem';

function DueCell({ workItem }: { workItem: WorkItem }) {
  if (workItem.status === 'Completed') {
    return (
      <span className="text-xs text-ink-400">
        {formatDate(workItem.completionDate)}
      </span>
    );
  }
  const d = daysUntil(workItem.dueDate);
  const tone =
    d < 0
      ? 'text-rose-600'
      : d <= 7
        ? 'text-amber-600'
        : 'text-emerald-600';
  const label =
    d < 0
      ? `${-d}d overdue`
      : d === 0
        ? 'Due today'
        : `${d}d left`;
  return (
    <div>
      <p className="text-xs text-ink-500">{formatDate(workItem.dueDate)}</p>
      <p className={cn('text-[11px] font-bold', tone)}>{label}</p>
    </div>
  );
}

export function WorkItemTable({ items }: { items: WorkItem[] }) {
  const { data, getMember, getClient, updateWorkItem, deleteWorkItem } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No work items match"
        description="Adjust the filters or add a new dashboard, agent or workflow."
        compact
      />
    );
  }

  const toggleComplete = (wi: WorkItem, done: boolean) => {
    if (done) {
      updateWorkItem(wi.id, {
        status: 'Completed',
        liveOnMunshot: true,
        claudeWorkStarted: true,
        clientMeetingDone: true,
        progress: 100,
      });
      toast.success('Marked complete', wi.title);
    } else {
      updateWorkItem(wi.id, {
        status: 'In Progress',
        completionDate: null,
      });
      toast.info('Reopened', wi.title);
    }
  };

  const handleDelete = async (wi: WorkItem) => {
    const ok = await confirm({
      title: `Delete “${wi.title}”?`,
      description:
        'This removes the work item and its tasks, feedback, transfers, timeline and readiness checklist. This cannot be undone.',
      confirmLabel: 'Delete work item',
      tone: 'danger',
    });
    if (ok) {
      deleteWorkItem(wi.id);
      toast.success('Work item deleted', wi.title);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1320px] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">
            <th className="w-8 px-2 pb-1" />
            <th className="px-3 pb-1">Work item</th>
            <th className="px-2 pb-1">Client</th>
            <th className="px-2 pb-1">Owner</th>
            <th className="px-2 pb-1">Stage</th>
            <th className="px-2 pb-1">Status</th>
            <th className="px-2 pb-1">Progress</th>
            <th className="px-2 pb-1">Due</th>
            <th className="px-2 pb-1" />
          </tr>
        </thead>
        <tbody>
          {items.map((wi) => {
            const owners = wi.ownerIds
              .map(getMember)
              .filter((m): m is NonNullable<typeof m> => !!m);
            const owner = owners[0];
            const extraOwners = owners.length - 1;
            const clients = wi.clientIds.map(getClient).filter(Boolean);
            const primaryClient = clients[0];
            const extraClients = clients.length - 1;
            const transferred = wi.originalOwnerId !== wi.ownerId;
            return (
              <tr
                key={wi.id}
                onClick={() => ui.openWorkItem(wi.id)}
                className="cursor-pointer align-middle transition [&>td]:whitespace-nowrap [&>td]:bg-white/70 hover:[&>td]:bg-brand-50/60"
              >
                <td
                  className="rounded-l-xl px-2 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={wi.status === 'Completed'}
                    onChange={(e) => toggleComplete(wi, e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-emerald-500"
                    title={
                      wi.status === 'Completed'
                        ? 'Reopen'
                        : 'Mark as complete'
                    }
                    aria-label={
                      wi.status === 'Completed'
                        ? 'Reopen work item'
                        : 'Mark work item as complete'
                    }
                  />
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-ink-800">{wi.title}</p>
                    {wi.hasPendingTransfer && (
                      <Badge color="amber" size="xs" soft>
                        <ArrowLeftRight className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <TypeBadge type={wi.type} />
                    <PriorityBadge priority={wi.priority} />
                    {wi.linkedMeetingRecordingIds.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-400">
                        <Video className="h-3 w-3" />
                        {wi.linkedMeetingRecordingIds.length}
                      </span>
                    )}
                    {wi.transferHistoryIds.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-400">
                        <ArrowLeftRight className="h-3 w-3" />
                        {wi.transferHistoryIds.length}
                      </span>
                    )}
                    {wi.improvementCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-400">
                        <MessageSquarePlus className="h-3 w-3" />
                        {wi.improvementCount}
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="px-2 py-2.5"
                  title={clients.map((c) => c?.name).join(', ')}
                >
                  <span className="text-xs font-semibold text-ink-600">
                    {primaryClient?.name ?? 'Unknown'}
                    {extraClients > 0 && (
                      <span className="ml-1 text-[10px] font-bold text-brand-600">
                        +{extraClients}
                      </span>
                    )}
                  </span>
                </td>
                <td
                  className="px-2 py-2.5"
                  title={owners.map((o) => o.name).join(', ')}
                >
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={owner?.name ?? '?'}
                      src={owner?.photoUrl}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink-700">
                        {owner?.name ?? 'Unassigned'}
                        {extraOwners > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-brand-600">
                            +{extraOwners}
                          </span>
                        )}
                      </p>
                      {transferred && (
                        <p className="text-[10px] text-amber-600">
                          transferred
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <WorkflowStageBadge stage={wi.currentStage} size="xs" />
                </td>
                <td className="px-2 py-2.5">
                  <StatusBadge status={effectiveStatus(wi, data.workflowStages)} />
                </td>
                <td className="w-28 px-2 py-2.5">
                  <ProgressBar
                    value={wi.progress}
                    size="sm"
                    showLabel
                    color={wi.progress >= 100 ? 'emerald' : 'indigo'}
                  />
                </td>
                <td className="px-2 py-2.5">
                  <DueCell workItem={wi} />
                </td>
                <td
                  className="rounded-r-xl px-2 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionMenu
                    actions={[
                      {
                        label: 'View detail',
                        icon: Eye,
                        onClick: () => ui.openWorkItem(wi.id),
                      },
                      {
                        label: 'Edit work item',
                        icon: Pencil,
                        onClick: () => ui.editWorkItem(wi),
                      },
                      {
                        label: 'Transfer work',
                        icon: ArrowLeftRight,
                        onClick: () =>
                          ui.addTransfer({ workItemId: wi.id }),
                      },
                      {
                        label: 'Add task',
                        icon: CheckSquare,
                        onClick: () =>
                          ui.addTask({
                            workItemId: wi.id,
                            clientId: wi.clientId,
                            ownerId: wi.ownerId,
                          }),
                      },
                      {
                        label: 'Add feedback',
                        icon: MessageSquarePlus,
                        onClick: () =>
                          ui.addFeedback({
                            workItemId: wi.id,
                            clientId: wi.clientId,
                          }),
                      },
                      {
                        label: 'Link recording',
                        icon: Link2,
                        onClick: () =>
                          ui.addRecording({
                            clientId: wi.clientId,
                            ownerId: wi.ownerId,
                            linkedWorkItemIds: [wi.id],
                          }),
                      },
                      {
                        label: 'Delete work item',
                        icon: Trash2,
                        tone: 'danger',
                        onClick: () => handleDelete(wi),
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
