import { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  GitBranch,
  KanbanSquare,
  LayoutGrid,
  LayoutList,
  Plus,
  Trash2,
  Workflow,
} from 'lucide-react';
import {
  WORKFLOW_STAGES,
  type WorkItem,
  type WorkflowStage,
} from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar } from '@/components/ui/FilterBar';
import { SegmentedControl } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TypeBadge } from '@/components/ui/Badge';
import { WorkItemTable } from '@/components/tables/WorkItemTable';
import { BarChartView } from '@/components/charts/Charts';
import { isOverdue } from '@/utils/dates';
import { sortByKey } from '@/utils/collections';
import type { ExcelSheet, ExportColumn, PptSummary } from '@/utils/export';

type WorkView = 'table' | 'kanban' | 'timeline';

export function GlobalWorkTracker() {
  const { data, derived, getMember, getClient, deleteAllWorkItems } = useStore();
  const ui = useUI();
  const toast = useToast();
  const confirm = useConfirm();

  const [view, setView] = useState<WorkView>('table');

  const handleDeleteAll = async () => {
    const count = data.workItems.length;
    if (count === 0) return;
    const ok = await confirm({
      title: `Delete all ${count} work items?`,
      description:
        'Every dashboard, agent and workflow — along with their tasks, feedback, transfers and timeline — will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete everything',
      tone: 'danger',
    });
    if (!ok) return;
    deleteAllWorkItems();
    toast.success('Work pipeline cleared', `${count} work items removed`);
  };
  const [search, setSearch] = useState('');
  const [owner, setOwner] = useState('');
  const [client, setClient] = useState('');

  const hasActiveFilters =
    search.trim() !== '' || owner !== '' || client !== '';

  const resetFilters = () => {
    setSearch('');
    setOwner('');
    setClient('');
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.workItems.filter((w) => {
      if (owner && w.ownerId !== owner) return false;
      if (client && w.clientId !== client) return false;
      if (term) {
        const clientName = getClient(w.clientId)?.name ?? '';
        const ownerName = getMember(w.ownerId)?.name ?? '';
        const haystack = [
          w.title,
          w.description,
          w.type,
          w.status,
          w.currentStage,
          w.priority,
          clientName,
          ownerName,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [data.workItems, getClient, getMember, search, owner, client]);

  const stats = useMemo(() => {
    const active = filteredItems.filter((w) => w.status !== 'Completed');
    const completed = filteredItems.filter((w) => w.status === 'Completed');
    return {
      total: filteredItems.length,
      active: active.length,
      completed: completed.length,
      live: filteredItems.filter((w) => w.status === 'Live').length,
      blocked: filteredItems.filter((w) => w.status === 'Blocked').length,
      overdue: filteredItems.filter(
        (w) => w.status !== 'Completed' && isOverdue(w.dueDate),
      ).length,
      pendingTransfers: filteredItems.filter((w) => w.hasPendingTransfer)
        .length,
      demoReady: filteredItems.filter((w) =>
        derived.demoReadyItemIds.has(w.id),
      ).length,
    };
  }, [filteredItems, derived]);

  /* Ordered stage config — the funnel + kanban single source of truth. */
  const orderedStages = useMemo(
    () => sortByKey(data.workflowStages, (s) => s.order),
    [data.workflowStages],
  );

  const stageBuckets = useMemo(() => {
    const map = new Map<WorkflowStage, WorkItem[]>();
    WORKFLOW_STAGES.forEach((s) => map.set(s, []));
    filteredItems.forEach((w) => {
      map.get(w.currentStage)?.push(w);
    });
    return map;
  }, [filteredItems]);

  const stageChartData = useMemo(
    () =>
      orderedStages.map((s) => ({
        label: s.shortLabel,
        count: stageBuckets.get(s.stage)?.length ?? 0,
      })),
    [orderedStages, stageBuckets],
  );

  const maxStageCount = useMemo(
    () => Math.max(1, ...stageChartData.map((d) => d.count)),
    [stageChartData],
  );

  const getSheets = (): ExcelSheet<unknown>[] => {
    const columns: ExportColumn<WorkItem>[] = [
      { header: 'Title', value: (w) => w.title },
      { header: 'Type', value: (w) => w.type },
      { header: 'Client', value: (w) => getClient(w.clientId)?.name ?? '' },
      { header: 'Owner', value: (w) => getMember(w.ownerId)?.name ?? '' },
      {
        header: 'Original Owner',
        value: (w) => getMember(w.originalOwnerId)?.name ?? '',
      },
      { header: 'Stage', value: (w) => w.currentStage },
      { header: 'Status', value: (w) => w.status },
      { header: 'Priority', value: (w) => w.priority },
      {
        header: 'Demo Readiness %',
        value: (w) => derived.readinessByItem.get(w.id)?.percent ?? 0,
      },
      { header: 'Progress', value: (w) => w.progress },
      { header: 'Start', value: (w) => w.startDate },
      { header: 'Due', value: (w) => w.dueDate },
      {
        header: 'Days Remaining',
        value: (w) =>
          w.status === 'Completed'
            ? ''
            : Math.round(
                (new Date(w.dueDate).getTime() - Date.now()) / 86_400_000,
              ),
      },
      { header: 'Client Meeting Done', value: (w) => (w.clientMeetingDone ? 'Yes' : 'No') },
      { header: 'Claude Work Started', value: (w) => (w.claudeWorkStarted ? 'Yes' : 'No') },
      { header: 'Live on Munshot', value: (w) => (w.liveOnMunshot ? 'Yes' : 'No') },
      { header: 'Status Note', value: (w) => w.statusNote },
      {
        header: 'Linked Recordings',
        value: (w) => w.linkedMeetingRecordingIds.length,
      },
      {
        header: 'Pending Transfer',
        value: (w) => (w.hasPendingTransfer ? 'Yes' : 'No'),
      },
      {
        header: 'Transfer Count',
        value: (w) => w.transferHistoryIds.length,
      },
    ];
    return [
      {
        name: 'Work Items',
        rows: filteredItems,
        columns,
      } as ExcelSheet<unknown>,
    ];
  };

  const getPptSummary = (): PptSummary => ({
    title: 'Global Work Tracker',
    subtitle: 'Munshot OS — full delivery pipeline across the desk',
    kpis: [
      { label: 'Total work', value: stats.total },
      { label: 'Active', value: stats.active },
      { label: 'Live on Munshot', value: stats.live },
      { label: 'Blocked', value: stats.blocked },
      { label: 'Overdue', value: stats.overdue },
      { label: 'Pending transfers', value: stats.pendingTransfers },
      { label: 'Demo-ready', value: stats.demoReady },
    ],
    charts: [
      {
        title: 'Work items by workflow stage',
        type: 'bar',
        labels: stageChartData.map((d) => d.label),
        series: [
          { name: 'Work items', values: stageChartData.map((d) => d.count) },
        ],
      },
    ],
    tables: [
      {
        title: 'Work item register',
        headers: [
          'Title',
          'Type',
          'Client',
          'Owner',
          'Stage',
          'Status',
          'Health',
          'Progress',
        ],
        rows: filteredItems.map((w) => [
          w.title,
          w.type,
          getClient(w.clientId)?.name ?? '',
          getMember(w.ownerId)?.name ?? '',
          w.currentStage,
          w.status,
          `${w.progress}%`,
        ]),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Global Work Tracker"
        subtitle="Every dashboard, agent and workflow across the Munshot desk"
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              filename="munshot-global-work"
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
            <button className="btn-primary" onClick={() => ui.addWorkItem()}>
              <Plus className="h-4 w-4" /> Add Work
            </button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total Work"
          value={stats.total}
          icon={LayoutGrid}
          color="indigo"
        />
        <MetricCard
          label="Active"
          value={stats.active}
          icon={Activity}
          color="violet"
        />
        <MetricCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Filters — a strong search plus the two filters that matter */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder:
            'Search by title, client, owner, type, status, stage, priority…',
        }}
        selects={[
          {
            key: 'owner',
            label: 'Owners',
            value: owner,
            onChange: setOwner,
            options: data.teamMembers.map((m) => ({
              value: m.id,
              label: m.name,
            })),
          },
          {
            key: 'client',
            label: 'Clients',
            value: client,
            onChange: setClient,
            options: data.clients.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {/* View switcher + content */}
      <Panel
        title="Work pipeline"
        subtitle={`${filteredItems.length} of ${data.workItems.length} work items`}
        icon={Workflow}
        iconColor="indigo"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<WorkView>
              options={[
                { value: 'table', label: 'Table', icon: LayoutList },
                { value: 'kanban', label: 'Kanban', icon: KanbanSquare },
                { value: 'timeline', label: 'Timeline', icon: GitBranch },
              ]}
              value={view}
              onChange={setView}
            />
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={data.workItems.length === 0}
              className="btn-danger"
              title="Delete every work item in the pipeline"
            >
              <Trash2 className="h-4 w-4" />
              Delete all
            </button>
          </div>
        }
      >
        {view === 'table' && <WorkItemTable items={filteredItems} />}

        {view === 'kanban' &&
          (filteredItems.length === 0 ? (
            <EmptyState
              icon={KanbanSquare}
              title="No work items match"
              description="Adjust the filters to populate the board."
              compact
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {orderedStages.map((s) => {
                const items = stageBuckets.get(s.stage) ?? [];
                return (
                  <div key={s.id} className="w-72 shrink-0">
                    <div className="mb-2 flex items-center justify-between rounded-xl bg-violet-50 px-3 py-2">
                      <p className="truncate text-xs font-bold text-violet-700">
                        {s.stage}
                      </p>
                      <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet-200 px-1.5 text-[11px] font-bold text-violet-700">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-ink-200 px-3 py-6 text-center text-[11px] text-ink-300">
                          No items
                        </p>
                      ) : (
                        items.map((w) => {
                          const wOwner = getMember(w.ownerId);
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => ui.openWorkItem(w.id)}
                              className="w-full rounded-xl border border-ink-100 bg-white/80 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/50"
                            >
                              <p className="truncate text-sm font-bold text-ink-800">
                                {w.title}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <TypeBadge type={w.type} />
                              </div>
                              <div className="mt-2 flex items-center gap-1.5">
                                <Avatar
                                  name={wOwner?.name ?? '?'}
                                  src={wOwner?.photoUrl}
                                  size="xs"
                                />
                                <span className="truncate text-[11px] font-semibold text-ink-500">
                                  {wOwner?.name ?? 'Unassigned'}
                                </span>
                              </div>
                              <ProgressBar
                                value={w.progress}
                                size="sm"
                                className="mt-2"
                                color={
                                  w.progress >= 100 ? 'emerald' : 'indigo'
                                }
                              />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {view === 'timeline' &&
          (filteredItems.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No work items match"
              description="Adjust the filters to visualise the pipeline funnel."
              compact
            />
          ) : (
            <div className="space-y-2">
              {orderedStages.map((s) => {
                const items = stageBuckets.get(s.stage) ?? [];
                const count = items.length;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2"
                  >
                    <p className="w-44 shrink-0 truncate text-xs font-bold text-ink-700">
                      {s.stage}
                    </p>
                    <div className="flex-1">
                      <div className="h-5 w-full overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                          style={{
                            width: `${(count / maxStageCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right font-display text-sm font-extrabold tabular-nums text-ink-800">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
      </Panel>

      {/* Stage distribution chart */}
      <Panel
        title="Pipeline distribution"
        subtitle="Filtered work items by delivery stage"
        icon={Activity}
        iconColor="violet"
      >
        <BarChartView
          data={stageChartData}
          series={[{ key: 'count', name: 'Work items' }]}
          orientation="bars"
          height={420}
        />
      </Panel>
    </div>
  );
}
