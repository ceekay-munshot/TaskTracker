import {
  Bot,
  CheckCircle2,
  ListChecks,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { WorkItemType } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useToast } from '@/components/ui/Toast';
import { Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriorityBadge, TaskStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/dates';

const TYPE_ICON: Record<WorkItemType, LucideIcon> = {
  Dashboard: ListChecks,
  Agent: Bot,
  Workflow: Workflow,
};

/**
 * Pending Assignment — every work item / task with no owner yet.
 * Each row has an inline "Assign to…" picker; choosing a member assigns it
 * and the row drops off the list.
 */
export function PendingAssignment() {
  const {
    data,
    updateWorkItem,
    updateTask,
    getMember,
    getClient,
    getWorkItem,
  } = useStore();
  const ui = useUI();
  const toast = useToast();

  const unassignedWork = data.workItems.filter(
    (w) => !w.ownerId && w.status !== 'Completed',
  );
  const unassignedTasks = data.tasks.filter(
    (t) => !t.ownerId && t.status !== 'Done',
  );

  const memberOptions = data.teamMembers.map((m) => ({
    value: m.id,
    label: `${m.name} · ${m.role}`,
  }));

  if (unassignedWork.length === 0 && unassignedTasks.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Everything's assigned"
        description="No dashboards, agents, workflows or tasks are waiting for an owner."
        compact
      />
    );
  }

  const assignWork = (id: string, title: string, ownerId: string) => {
    if (!ownerId) return;
    updateWorkItem(id, { ownerId });
    toast.success(
      'Work assigned',
      `${title} → ${getMember(ownerId)?.name ?? 'team member'}`,
    );
  };

  const assignTask = (id: string, title: string, ownerId: string) => {
    if (!ownerId) return;
    updateTask(id, { ownerId });
    toast.success(
      'Task assigned',
      `${title} → ${getMember(ownerId)?.name ?? 'team member'}`,
    );
  };

  return (
    <div className="space-y-4">
      {unassignedWork.length > 0 && (
        <div>
          <p className="section-title mb-2">
            Dashboards · Agents · Workflows ({unassignedWork.length})
          </p>
          <ul className="space-y-2">
            {unassignedWork.map((w) => {
              const Icon = TYPE_ICON[w.type];
              const client = getClient(w.clientId);
              return (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => ui.openWorkItem(w.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-bold text-ink-800 hover:text-brand-600">
                      {w.title}
                    </p>
                    <p className="truncate text-[11px] text-ink-400">
                      {w.type} · {client?.name ?? 'Unknown client'} · due{' '}
                      {formatDate(w.dueDate)}
                    </p>
                  </button>
                  <PriorityBadge priority={w.priority} />
                  <div className="w-full shrink-0 sm:w-56">
                    <Select
                      value=""
                      onChange={(v) => assignWork(w.id, w.title, v)}
                      options={memberOptions}
                      placeholder="Assign to…"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {unassignedTasks.length > 0 && (
        <div>
          <p className="section-title mb-2">
            Tasks ({unassignedTasks.length})
          </p>
          <ul className="space-y-2">
            {unassignedTasks.map((t) => {
              const workItem = getWorkItem(t.workItemId);
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3"
                >
                  <button
                    type="button"
                    onClick={() => ui.editTask(t)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-bold text-ink-800 hover:text-brand-600">
                      {t.title}
                    </p>
                    <p className="truncate text-[11px] text-ink-400">
                      {workItem ? workItem.title : 'Standalone task'} · due{' '}
                      {formatDate(t.dueDate)}
                    </p>
                  </button>
                  <TaskStatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <div className="w-full shrink-0 sm:w-56">
                    <Select
                      value=""
                      onChange={(v) => assignTask(t.id, t.title, v)}
                      options={memberOptions}
                      placeholder="Assign to…"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
