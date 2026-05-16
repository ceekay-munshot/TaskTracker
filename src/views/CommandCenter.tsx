import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeftRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  LayoutDashboard,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Video,
  Zap,
} from 'lucide-react';
import { WORKFLOW_STAGES } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { Avatar } from '@/components/ui/Avatar';
import { TransferStatusBadge, TypeBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChartView, BarList } from '@/components/charts/Charts';
import { WorkloadHeatmap } from '@/components/WorkloadHeatmap';
import { ImprovementPriorityList } from '@/components/ImprovementPriorityList';
import { MeetingRecordingCard } from '@/components/MeetingRecordingCard';
import { PendingAssignment } from '@/components/PendingAssignment';
import { isBacklogFeedback } from '@/utils/improvements';
import { daysOverdue, formatDate, isOverdue } from '@/utils/dates';
import { sortByKey } from '@/utils/collections';
import type { ExcelSheet, PptSummary } from '@/utils/export';

export function CommandCenter() {
  const { data, derived } = useStore();
  const ui = useUI();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const wi = data.workItems;
    const active = wi.filter((w) => w.status !== 'Completed');
    const demoReady = wi.filter((w) => derived.demoReadyItemIds.has(w.id));
    return {
      active,
      unassigned: wi.filter((w) => !w.ownerId && w.status !== 'Completed'),
      live: wi.filter((w) => w.status === 'Live'),
      blocked: wi.filter((w) => w.status === 'Blocked'),
      inMeeting: wi.filter((w) => w.currentStage === 'Client Meeting'),
      inBuild: wi.filter((w) => w.currentStage === 'Claude Work'),
      feedbackPending: data.feedback.filter(isBacklogFeedback),
      pendingTransfers: data.transfers.filter((t) => t.status === 'Pending'),
      demoReady,
      recordings: data.recordings,
    };
  }, [data, derived]);

  const pipelineData = useMemo(
    () =>
      WORKFLOW_STAGES.map((stage) => ({
        label: stage,
        count: data.workItems.filter((w) => w.currentStage === stage).length,
      })),
    [data.workItems],
  );

  const teamWorkloadData = useMemo(
    () =>
      data.teamMembers
        .map((m) => ({
          label: m.name.split(' ')[0],
          active: data.workItems.filter(
            (w) => w.ownerIds.includes(m.id) && w.status !== 'Completed',
          ).length,
        }))
        .filter((d) => d.active > 0),
    [data.teamMembers, data.workItems],
  );

  const clientWorkData = useMemo(
    () =>
      data.clients
        .map((c) => ({
          label: c.name.split(' ')[0],
          active: data.workItems.filter(
            (w) => w.clientIds.includes(c.id) && w.status !== 'Completed',
          ).length,
        }))
        .filter((d) => d.active > 0),
    [data.clients, data.workItems],
  );

  const upcomingMeetings = useMemo(
    () =>
      sortByKey(
        data.meetings.filter((m) => m.status === 'Scheduled'),
        (m) => m.date,
      ).slice(0, 6),
    [data.meetings],
  );

  const recentRecordings = useMemo(
    () =>
      sortByKey(data.recordings, (r) => r.createdAt, 'desc').slice(0, 3),
    [data.recordings],
  );

  const recentlyUpdated = useMemo(
    () => sortByKey(data.workItems, (w) => w.updatedAt, 'desc').slice(0, 6),
    [data.workItems],
  );

  const overdueItems = useMemo(
    () =>
      sortByKey(
        data.workItems.filter(
          (w) => w.status !== 'Completed' && isOverdue(w.dueDate),
        ),
        (w) => w.dueDate,
      ).slice(0, 6),
    [data.workItems],
  );

  const getSheets = (): ExcelSheet<any>[] => [
    {
      name: 'Work Items',
      rows: data.workItems,
      columns: [
        { header: 'Title', value: (w) => w.title },
        { header: 'Type', value: (w) => w.type },
        {
          header: 'Client',
          value: (w) =>
            data.clients.find((c) => c.id === w.clientId)?.name ?? '',
        },
        {
          header: 'Owner',
          value: (w) =>
            data.teamMembers.find((m) => m.id === w.ownerId)?.name ?? '',
        },
        { header: 'Stage', value: (w) => w.currentStage },
        { header: 'Status', value: (w) => w.status },
        { header: 'Priority', value: (w) => w.priority },
        {
          header: 'Health',
          value: (w) => derived.healthByItem.get(w.id)?.score ?? '',
        },
        { header: 'Progress %', value: (w) => w.progress },
        { header: 'Due', value: (w) => w.dueDate },
      ],
    } as ExcelSheet<any>,
  ];

  const getPptSummary = (): PptSummary => ({
    title: 'Command Center',
    subtitle: 'Munshot OS — equity research delivery snapshot',
    kpis: [
      { label: 'Active work', value: stats.active.length },
      { label: 'Live on Munshot', value: stats.live.length },
      { label: 'Blocked', value: stats.blocked.length },
      { label: 'In client meeting', value: stats.inMeeting.length },
      { label: 'In Claude build', value: stats.inBuild.length },
      { label: 'Pending transfers', value: stats.pendingTransfers.length },
      { label: 'Demo-ready', value: stats.demoReady.length },
      { label: 'Feedback open', value: stats.feedbackPending.length },
      { label: 'Recordings', value: stats.recordings.length },
    ],
    charts: [
      {
        title: 'Pipeline by workflow stage',
        type: 'bar',
        labels: pipelineData.map((d) => d.label),
        series: [{ name: 'Work items', values: pipelineData.map((d) => d.count) }],
      },
    ],
    tables: [
      {
        title: 'Critical overdue work',
        headers: ['Title', 'Owner', 'Due', 'Days overdue'],
        rows: overdueItems.map((w) => [
          w.title,
          data.teamMembers.find((m) => m.id === w.ownerId)?.name ?? '',
          formatDate(w.dueDate),
          daysOverdue(w.dueDate),
        ]),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Command Center"
        subtitle="Executive overview of the Munshot equity research desk"
        action={
          <ExportButtons
            filename="munshot-command-center"
            getSheets={getSheets}
            getPptSummary={getPptSummary}
          />
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Active Work"
          value={stats.active.length}
          icon={LayoutDashboard}
          color="indigo"
          hint="dashboards · agents · workflows"
          onClick={() => navigate('/work')}
        />
        <MetricCard
          label="Live on Munshot"
          value={stats.live.length}
          icon={Rocket}
          color="cyan"
          onClick={() => navigate('/work')}
        />
        <MetricCard
          label="In client meeting"
          value={stats.inMeeting.length}
          icon={ShieldCheck}
          color="amber"
        />
        <MetricCard
          label="In Claude build"
          value={stats.inBuild.length}
          icon={ClipboardCheck}
          color="violet"
        />
        <MetricCard
          label="Feedback Open"
          value={stats.feedbackPending.length}
          icon={MessageSquare}
          color="orange"
        />
        <MetricCard
          label="Blocked Items"
          value={stats.blocked.length}
          icon={AlertOctagon}
          color="rose"
        />
        <MetricCard
          label="Pending Transfers"
          value={stats.pendingTransfers.length}
          icon={ArrowLeftRight}
          color="amber"
          onClick={() => navigate('/transfers')}
        />
        <MetricCard
          label="Demo-Ready"
          value={stats.demoReady.length}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          label="Meeting Recordings"
          value={stats.recordings.length}
          icon={Video}
          color="fuchsia"
          onClick={() => navigate('/meetings')}
        />
        <MetricCard
          label="Pending Assignment"
          value={stats.unassigned.length}
          icon={UserPlus}
          color="amber"
          hint="work with no owner yet"
        />
      </div>

      {/* Pending assignment */}
      <Panel
        title="Pending assignment"
        subtitle="Work waiting for an owner — assign it from here"
        icon={UserPlus}
        iconColor="amber"
      >
        <PendingAssignment />
      </Panel>

      {/* Quick actions */}
      <Panel title="Quick actions" icon={Zap} iconColor="amber">
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-soft"
            onClick={() => ui.addWorkItem({ type: 'Dashboard' })}
          >
            <LayoutDashboard className="h-4 w-4" /> Add Dashboard
          </button>
          <button
            className="btn-soft"
            onClick={() => ui.addWorkItem({ type: 'Agent' })}
          >
            <Bot className="h-4 w-4" /> Add Agent
          </button>
          <button className="btn-soft" onClick={() => ui.addRecording()}>
            <Video className="h-4 w-4" /> Add Recording
          </button>
          <button className="btn-soft" onClick={() => ui.addTransfer()}>
            <ArrowLeftRight className="h-4 w-4" /> Transfer Work
          </button>
          <button className="btn-soft" onClick={() => ui.addFeedback()}>
            <MessageSquare className="h-4 w-4" /> Add Feedback
          </button>
          <button className="btn-soft" onClick={() => ui.addMeeting()}>
            <Clock className="h-4 w-4" /> Schedule Meeting
          </button>
        </div>
      </Panel>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Workflow pipeline"
          subtitle="Work items by delivery stage"
          icon={Activity}
          iconColor="indigo"
          className="lg:col-span-2"
        >
          <BarList
            data={pipelineData.map((d) => ({
              label: d.label,
              value: d.count,
            }))}
          />
        </Panel>
        <Panel
          title="Team workload"
          subtitle="Active items per member"
          icon={Activity}
          iconColor="violet"
        >
          <BarChartView
            data={teamWorkloadData}
            series={[{ key: 'active', name: 'Active items' }]}
            height={300}
          />
        </Panel>
      </div>

      {/* Heatmap */}
      <Panel
        title="Intern workload heatmap"
        subtitle="Capacity pressure across the desk"
        icon={Activity}
        iconColor="rose"
      >
        <WorkloadHeatmap />
      </Panel>

      {/* Client work + improvements */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Client-wise active work"
          icon={LayoutDashboard}
          iconColor="sky"
        >
          <BarChartView
            data={clientWorkData}
            series={[{ key: 'active', name: 'Active items' }]}
            orientation="bars"
            height={280}
          />
        </Panel>
        <Panel
          title="Improvement backlog"
          subtitle="Top-ranked client improvements"
          icon={Sparkles}
          iconColor="amber"
          action={
            <button
              className="text-xs font-semibold text-brand-600 hover:underline"
              onClick={() => ui.addFeedback()}
            >
              + Add feedback
            </button>
          }
        >
          <ImprovementPriorityList
            feedback={data.feedback.filter(isBacklogFeedback)}
            limit={5}
          />
        </Panel>
      </div>

      {/* Lists row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Upcoming meetings" icon={Clock} iconColor="teal">
          {upcomingMeetings.length === 0 ? (
            <EmptyState title="No meetings scheduled" compact />
          ) : (
            <ul className="space-y-2">
              {upcomingMeetings.map((m) => {
                const client = data.clients.find((c) => c.id === m.clientId);
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-xl bg-white/70 p-2.5"
                  >
                    <div className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-[9px] font-bold uppercase">
                        {formatDate(m.date).split(' ')[1]}
                      </span>
                      <span className="font-display text-sm font-extrabold leading-none">
                        {formatDate(m.date).split(' ')[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {m.title}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">
                        {m.time} · {client?.name ?? 'Internal'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Recent recordings" icon={Video} iconColor="fuchsia">
          {recentRecordings.length === 0 ? (
            <EmptyState title="No recordings yet" compact />
          ) : (
            <div className="space-y-3">
              {recentRecordings.map((r) => (
                <MeetingRecordingCard
                  key={r.id}
                  recording={r}
                  onView={() => ui.openRecording(r.id)}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recently updated work" icon={Activity} iconColor="indigo">
          <ul className="space-y-2">
            {recentlyUpdated.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => ui.openWorkItem(w.id)}
                  className="flex w-full items-center gap-2 rounded-xl bg-white/70 p-2.5 text-left hover:bg-brand-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {w.title}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      Updated {formatDate(w.updatedAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Alerts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Critical overdue work"
          icon={AlertTriangle}
          iconColor="rose"
        >
          {overdueItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing overdue"
              description="The whole desk is on schedule."
              compact
            />
          ) : (
            <ul className="space-y-2">
              {overdueItems.map((w) => {
                const owner = data.teamMembers.find(
                  (m) => m.id === w.ownerId,
                );
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => ui.openWorkItem(w.id)}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-rose-50/70 p-2.5 text-left hover:bg-rose-100/70"
                    >
                      <Avatar
                        name={owner?.name ?? '?'}
                        src={owner?.photoUrl}
                        size="xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {w.title}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          {owner?.name ?? 'Unassigned'} · due{' '}
                          {formatDate(w.dueDate)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
                        {daysOverdue(w.dueDate)}d over
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Pending transfer alerts"
          icon={ArrowLeftRight}
          iconColor="amber"
          action={
            <button
              className="text-xs font-semibold text-brand-600 hover:underline"
              onClick={() => navigate('/transfers')}
            >
              View all
            </button>
          }
        >
          {stats.pendingTransfers.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending transfers"
              compact
            />
          ) : (
            <ul className="space-y-2">
              {stats.pendingTransfers.map((t) => {
                const wi = data.workItems.find(
                  (w) => w.id === t.workItemId,
                );
                const from = data.teamMembers.find(
                  (m) => m.id === t.fromOwnerId,
                );
                const to = data.teamMembers.find(
                  (m) => m.id === t.toOwnerId,
                );
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-2.5 rounded-xl bg-amber-50/70 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {wi?.title ?? 'Unknown'}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">
                        {from?.name ?? '?'} → {to?.name ?? '?'} · {t.reason}
                      </p>
                    </div>
                    {wi && <TypeBadge type={wi.type} />}
                    <TransferStatusBadge status={t.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
