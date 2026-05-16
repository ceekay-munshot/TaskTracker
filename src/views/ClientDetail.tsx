import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  Bot,
  Briefcase,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Gauge,
  History,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
  Phone,
  Pencil,
  Rocket,
  Sparkles,
  StickyNote,
  Users,
  Video,
} from 'lucide-react';
import { WORKFLOW_STAGES } from '@/types';
import type { Feedback, WorkItem } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { Panel, SectionHeading, MiniStat } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { Avatar } from '@/components/ui/Avatar';
import {
  ClientStatusBadge,
  ReadinessBadge,
  StatusBadge,
} from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { WorkItemTable } from '@/components/tables/WorkItemTable';
import { WorkTransferTable } from '@/components/tables/WorkTransferTable';
import { MeetingRecordingCard } from '@/components/MeetingRecordingCard';
import { ImprovementPriorityList } from '@/components/ImprovementPriorityList';
import { BarChartView, DonutChartView, TrendChartView } from '@/components/charts/Charts';
import { isBacklogFeedback } from '@/utils/improvements';
import { countBy, sortByKey } from '@/utils/collections';
import { formatDate, monthLabel, recentMonthKeys, monthKey } from '@/utils/dates';
import { effectiveStatus } from '@/utils/workItem';
import { chartColor } from '@/utils/palette';
import { cn } from '@/utils/cn';
import type { ExcelSheet, PptSummary } from '@/utils/export';

type SubTab = 'work' | 'recordings' | 'feedback' | 'transfers' | 'timeline';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, derived, getClient, getMember } = useStore();
  const ui = useUI();

  const [tab, setTab] = useState<SubTab>('work');

  const client = getClient(id);

  /* ------------------------------------------------------------------ */
  /* Derived collections — all scoped to this client                     */
  /* ------------------------------------------------------------------ */
  const clientWorkItems = useMemo(
    () =>
      client
        ? sortByKey(
            data.workItems.filter((w) => w.clientIds.includes(client.id)),
            (w) => w.updatedAt,
            'desc',
          )
        : [],
    [client, data.workItems],
  );

  const clientFeedback = useMemo(
    () =>
      client ? data.feedback.filter((f) => f.clientId === client.id) : [],
    [client, data.feedback],
  );

  const clientRecordings = useMemo(
    () =>
      client
        ? sortByKey(
            data.recordings.filter((r) => r.clientId === client.id),
            (r) => r.meetingDate,
            'desc',
          )
        : [],
    [client, data.recordings],
  );

  const clientMeetings = useMemo(
    () =>
      client ? data.meetings.filter((m) => m.clientId === client.id) : [],
    [client, data.meetings],
  );

  const clientTransfers = useMemo(() => {
    if (!client) return [];
    const workItemIds = new Set(clientWorkItems.map((w) => w.id));
    return sortByKey(
      data.transfers.filter((t) => workItemIds.has(t.workItemId)),
      (t) => t.transferDate,
      'desc',
    );
  }, [client, clientWorkItems, data.transfers]);

  const stats = useMemo(() => {
    const active = clientWorkItems.filter((w) => w.status !== 'Completed');
    const completed = clientWorkItems.filter((w) => w.status === 'Completed');
    const live = clientWorkItems.filter((w) => w.status === 'Live');
    const demoReady = clientWorkItems.filter((w) =>
      derived.demoReadyItemIds.has(w.id),
    );
    const feedbackOpen = clientFeedback.filter(isBacklogFeedback);
    const pendingTransfers = clientTransfers.filter(
      (t) => t.status === 'Pending',
    );
    return {
      total: clientWorkItems.length,
      active: active.length,
      completed: completed.length,
      live: live.length,
      demoReady: demoReady.length,
      feedbackOpen: feedbackOpen.length,
      recordings: clientRecordings.length,
      meetings: clientMeetings.length,
      pendingTransfers: pendingTransfers.length,
    };
  }, [
    clientWorkItems,
    clientFeedback,
    clientRecordings,
    clientMeetings,
    clientTransfers,
    derived.demoReadyItemIds,
  ]);

  /* ------------------------------- charts --------------------------- */
  const workByOwner = useMemo(() => {
    const counts = countBy(clientWorkItems, (w) => w.ownerId);
    return Array.from(counts.entries())
      .map(([ownerId, count]) => ({
        label: getMember(ownerId)?.name.split(' ')[0] ?? 'Unassigned',
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [clientWorkItems, getMember]);

  const workByStatus = useMemo(() => {
    const counts = countBy(clientWorkItems, (w) => w.status);
    return Array.from(counts.entries()).map(([label, value], i) => ({
      label,
      value,
      color: chartColor(i),
    }));
  }, [clientWorkItems]);

  const stageBreakdown = useMemo(
    () =>
      WORKFLOW_STAGES.map((stage) => ({
        label: stage,
        count: clientWorkItems.filter((w) => w.currentStage === stage).length,
      })).filter((d) => d.count > 0),
    [clientWorkItems],
  );

  const feedbackByStatus = useMemo(() => {
    const counts = countBy(clientFeedback, (f) => f.status);
    return Array.from(counts.entries()).map(([label, value], i) => ({
      label,
      value,
      color: chartColor(i),
    }));
  }, [clientFeedback]);

  const recordingsByType = useMemo(() => {
    const counts = countBy(clientRecordings, (r) => r.meetingType);
    return Array.from(counts.entries()).map(([label, value], i) => ({
      label,
      value,
      color: chartColor(i),
    }));
  }, [clientRecordings]);

  const transfersByOwner = useMemo(() => {
    const counts = new Map<string, number>();
    clientTransfers.forEach((t) => {
      const name = getMember(t.toOwnerId)?.name.split(' ')[0] ?? 'Unknown';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [clientTransfers, getMember]);

  const deliveryTrend = useMemo(() => {
    const keys = recentMonthKeys(6);
    return keys.map((key) => ({
      label: monthLabel(key),
      created: clientWorkItems.filter((w) => monthKey(w.startDate) === key)
        .length,
      completed: clientWorkItems.filter(
        (w) => w.completionDate && monthKey(w.completionDate) === key,
      ).length,
    }));
  }, [clientWorkItems]);

  const deliveryTimeline = useMemo(
    () =>
      sortByKey(
        clientWorkItems,
        (w) => w.completionDate ?? w.startDate,
        'desc',
      ),
    [clientWorkItems],
  );

  /* ------------------------------- export --------------------------- */
  const getSheets = (): ExcelSheet<unknown>[] => {
    const workSheet: ExcelSheet<WorkItem> = {
      name: 'Client Work',
      rows: clientWorkItems,
      columns: [
        { header: 'Title', value: (w) => w.title },
        { header: 'Type', value: (w) => w.type },
        {
          header: 'Owner',
          value: (w) => getMember(w.ownerId)?.name ?? 'Unassigned',
        },
        { header: 'Stage', value: (w) => w.currentStage },
        { header: 'Status', value: (w) => w.status },
        { header: 'Priority', value: (w) => w.priority },
        {
          header: 'Readiness',
          value: (w) => derived.readinessByItem.get(w.id)?.badge ?? '',
        },
        { header: 'Progress %', value: (w) => w.progress },
        { header: 'Start', value: (w) => w.startDate },
        { header: 'Due', value: (w) => w.dueDate },
        { header: 'Completed', value: (w) => w.completionDate ?? '' },
      ],
    };
    const feedbackSheet: ExcelSheet<Feedback> = {
      name: 'Client Feedback',
      rows: clientFeedback,
      columns: [
        { header: 'Feedback', value: (f) => f.feedbackText },
        { header: 'Source', value: (f) => f.source },
        { header: 'Priority', value: (f) => f.priority },
        { header: 'Business Impact', value: (f) => f.businessImpact },
        { header: 'Effort', value: (f) => f.effort },
        { header: 'Repeats', value: (f) => f.frequencyCount },
        { header: 'Status', value: (f) => f.status },
        {
          header: 'Work Item',
          value: (f) =>
            data.workItems.find((w) => w.id === f.workItemId)?.title ?? '',
        },
        { header: 'Logged', value: (f) => formatDate(f.createdAt) },
      ],
    };
    return [
      workSheet as ExcelSheet<unknown>,
      feedbackSheet as ExcelSheet<unknown>,
    ];
  };

  const getPptSummary = (): PptSummary => ({
    title: client?.name ?? 'Client',
    subtitle: `Munshot OS — client delivery dossier${
      client?.city ? ` · ${client.city}` : ''
    }`,
    kpis: [
      { label: 'Total work', value: stats.total },
      { label: 'Active work', value: stats.active },
      { label: 'Completed', value: stats.completed },
      { label: 'Live on Munshot', value: stats.live },
      { label: 'Demo-ready', value: stats.demoReady },
      { label: 'Feedback open', value: stats.feedbackOpen },
      { label: 'Recordings', value: stats.recordings },
      { label: 'Pending transfers', value: stats.pendingTransfers },
    ],
    charts: [
      {
        title: 'Delivery timeline — created vs completed',
        type: 'line',
        labels: deliveryTrend.map((d) => d.label),
        series: [
          { name: 'Created', values: deliveryTrend.map((d) => d.created) },
          {
            name: 'Completed',
            values: deliveryTrend.map((d) => d.completed),
          },
        ],
      },
    ],
    tables: [
      {
        title: 'Work portfolio',
        headers: ['Work item', 'Type', 'Owner', 'Stage', 'Status', 'Progress'],
        rows: clientWorkItems.map((w) => [
          w.title,
          w.type,
          getMember(w.ownerId)?.name ?? 'Unassigned',
          w.currentStage,
          w.status,
          `${w.progress}%`,
        ]),
      },
      {
        title: 'Improvement backlog',
        headers: ['Feedback', 'Source', 'Priority', 'Impact', 'Status'],
        rows: clientFeedback.map((f) => [
          f.feedbackText,
          f.source,
          f.priority,
          f.businessImpact,
          f.status,
        ]),
      },
    ],
  });

  /* ------------------------------ not found ------------------------- */
  if (!client) {
    return (
      <div className="space-y-5">
        <Panel padded>
          <EmptyState
            icon={Briefcase}
            title="Client not found"
            description="This client may have been deleted or the link is out of date."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/clients')}
              >
                <ArrowLeft className="h-4 w-4" /> Back to clients
              </button>
            }
          />
        </Panel>
      </div>
    );
  }

  const tabs = [
    { id: 'work', label: 'Work', count: stats.total },
    { id: 'recordings', label: 'Recordings', count: stats.recordings },
    { id: 'feedback', label: 'Feedback', count: clientFeedback.length },
    { id: 'transfers', label: 'Transfers', count: clientTransfers.length },
    { id: 'timeline', label: 'Timeline', count: clientWorkItems.length },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Client dossier"
        subtitle="Full delivery picture for a single client"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/clients')}
            >
              <ArrowLeft className="h-4 w-4" /> Clients
            </button>
            <ExportButtons
              filename={`munshot-client-${client.name}`}
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
          </div>
        }
      />

      {/* Header card */}
      <div className="card overflow-hidden p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <Avatar
            name={client.name}
            src={client.logoUrl}
            size="xl"
            ring
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-2xl font-extrabold text-ink-800">
                {client.name}
              </h2>
              <ClientStatusBadge status={client.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-500">
              {client.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-ink-300" />
                  {client.city}
                </span>
              )}
              {client.address && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-ink-300" />
                  {client.address}
                </span>
              )}
            </div>
            {client.pocs.length > 0 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {client.pocs.map((poc) => (
                  <div
                    key={poc.id}
                    className="rounded-xl border border-ink-100 bg-white/70 p-2.5 text-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-ink-300" />
                      <span className="font-semibold text-ink-700">
                        {poc.name}
                      </span>
                    </div>
                    {poc.role && (
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                        {poc.role}
                      </p>
                    )}
                    <div className="mt-1.5 space-y-0.5 text-xs text-ink-500">
                      {poc.email && (
                        <a
                          href={`mailto:${poc.email}`}
                          className="inline-flex items-center gap-1.5 hover:text-brand-600"
                        >
                          <Mail className="h-3.5 w-3.5 text-ink-300" />
                          {poc.email}
                        </a>
                      )}
                      {poc.phone && (
                        <div className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-ink-300" />
                          {poc.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Importance score */}
            <div className="mt-3 flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                Importance
              </span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full',
                      i < client.importanceScore
                        ? 'bg-brand-500'
                        : 'bg-ink-200',
                    )}
                  />
                ))}
              </div>
              <span className="font-display text-sm font-extrabold text-brand-600">
                {client.importanceScore}/10
              </span>
            </div>

            {client.notes && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                <p className="leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-soft shrink-0"
            onClick={() => ui.editClient(client)}
          >
            <Pencil className="h-4 w-4" /> Edit client
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        <MiniStat
          label="Total Work"
          value={stats.total}
          icon={LayoutDashboard}
          color="indigo"
        />
        <MiniStat
          label="Active"
          value={stats.active}
          icon={Briefcase}
          color="violet"
        />
        <MiniStat
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="emerald"
        />
        <MiniStat
          label="Live"
          value={stats.live}
          icon={Rocket}
          color="cyan"
        />
        <MiniStat
          label="Demo-Ready"
          value={stats.demoReady}
          icon={Sparkles}
          color="emerald"
        />
        <MiniStat
          label="Feedback Open"
          value={stats.feedbackOpen}
          icon={MessageSquare}
          color="orange"
        />
        <MiniStat
          label="Recordings"
          value={stats.recordings}
          icon={Video}
          color="fuchsia"
        />
        <MiniStat
          label="Meetings"
          value={stats.meetings}
          icon={Clock}
          color="teal"
        />
        <MiniStat
          label="Pending Transfers"
          value={stats.pendingTransfers}
          icon={ArrowLeftRight}
          color="amber"
        />
      </div>

      {/* Action buttons */}
      <Panel title="Quick actions" icon={Sparkles} iconColor="amber">
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-soft"
            onClick={() => ui.addWorkItem({ clientIds: [client.id] })}
          >
            <Bot className="h-4 w-4" /> Add Dashboard / Agent
          </button>
          <button
            className="btn-soft"
            onClick={() => ui.addMeeting({ clientId: client.id })}
          >
            <CalendarPlus className="h-4 w-4" /> Add Meeting
          </button>
          <button
            className="btn-soft"
            onClick={() => ui.addRecording({ clientId: client.id })}
          >
            <Video className="h-4 w-4" /> Add Recording
          </button>
          <button
            className="btn-soft"
            onClick={() => ui.addFeedback({ clientId: client.id })}
          >
            <MessageSquarePlus className="h-4 w-4" /> Add Feedback
          </button>
          <button className="btn-soft" onClick={() => ui.addTransfer()}>
            <ArrowLeftRight className="h-4 w-4" /> Transfer Work
          </button>
        </div>
      </Panel>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        active={tab}
        onChange={(t) => setTab(t as SubTab)}
        layoutId="client-detail-tabs"
      />

      {/* ---------------------------- Work tab --------------------------- */}
      {tab === 'work' && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel
              title="Work by owner"
              subtitle="Distribution across the desk"
              icon={Users}
              iconColor="indigo"
            >
              <BarChartView
                data={workByOwner}
                series={[{ key: 'count', name: 'Work items' }]}
                orientation="bars"
                height={280}
              />
            </Panel>
            <Panel
              title="Workflow stage breakdown"
              subtitle="Where the work sits in the pipeline"
              icon={LayoutDashboard}
              iconColor="violet"
            >
              <BarChartView
                data={stageBreakdown}
                series={[{ key: 'count', name: 'Work items' }]}
                orientation="bars"
                height={280}
              />
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel
              title="Work by status"
              subtitle="Delivery status mix"
              icon={Gauge}
              iconColor="cyan"
            >
              <DonutChartView data={workByStatus} height={220} />
            </Panel>
            <Panel
              title="Demo readiness across projects"
              subtitle="Readiness checklist progress per work item"
              icon={Sparkles}
              iconColor="emerald"
            >
              {clientWorkItems.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No work items yet"
                  description="Add a dashboard or agent to track demo readiness."
                  compact
                />
              ) : (
                <ul className="space-y-2.5">
                  {clientWorkItems.map((w) => {
                    const readiness = derived.readinessByItem.get(w.id);
                    return (
                      <li
                        key={w.id}
                        className="rounded-xl border border-ink-100 bg-white/70 p-3"
                      >
                        <button
                          type="button"
                          onClick={() => ui.openWorkItem(w.id)}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <span className="truncate text-sm font-bold text-ink-800 hover:text-brand-600">
                            {w.title}
                          </span>
                          {readiness && (
                            <ReadinessBadge
                              badge={readiness.badge}
                              percent={readiness.percent}
                            />
                          )}
                        </button>
                        {readiness && (
                          <ProgressBar
                            value={readiness.percent}
                            className="mt-2"
                            size="sm"
                            color={
                              readiness.badge === 'Demo Ready'
                                ? 'emerald'
                                : readiness.badge === 'Almost Ready'
                                  ? 'amber'
                                  : 'rose'
                            }
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            title="Work items"
            subtitle={`${clientWorkItems.length} dashboard(s), agent(s) & workflow(s)`}
            icon={Briefcase}
            iconColor="indigo"
            padded={false}
            bodyClassName="p-4"
          >
            <WorkItemTable items={clientWorkItems} />
          </Panel>
        </div>
      )}

      {/* ------------------------- Recordings tab ------------------------ */}
      {tab === 'recordings' && (
        <div className="space-y-5">
          <Panel
            title="Recordings by type"
            subtitle="Meeting recording mix"
            icon={Video}
            iconColor="fuchsia"
          >
            <DonutChartView data={recordingsByType} height={220} />
          </Panel>
          {clientRecordings.length === 0 ? (
            <Panel padded>
              <EmptyState
                icon={Video}
                title="No recordings yet"
                description="Capture a client meeting recording to build the archive."
                action={
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => ui.addRecording({ clientId: client.id })}
                  >
                    <Video className="h-4 w-4" /> Add Recording
                  </button>
                }
              />
            </Panel>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clientRecordings.map((r) => (
                <MeetingRecordingCard
                  key={r.id}
                  recording={r}
                  onView={() => ui.openRecording(r.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------- Feedback tab ------------------------- */}
      {tab === 'feedback' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel
            title="Improvement priority"
            subtitle="Ranked client feedback backlog"
            icon={Sparkles}
            iconColor="amber"
            className="lg:col-span-2"
            action={
              <button
                type="button"
                className="text-xs font-semibold text-brand-600 hover:underline"
                onClick={() => ui.addFeedback({ clientId: client.id })}
              >
                + Add feedback
              </button>
            }
          >
            <ImprovementPriorityList
              feedback={clientFeedback}
              emptyHint="Log client feedback to build the prioritised backlog."
            />
          </Panel>
          <Panel
            title="Feedback status"
            subtitle="Resolution breakdown"
            icon={MessageSquare}
            iconColor="orange"
          >
            <DonutChartView data={feedbackByStatus} height={220} />
          </Panel>
        </div>
      )}

      {/* -------------------------- Transfers tab ------------------------ */}
      {tab === 'transfers' && (
        <div className="space-y-5">
          <Panel
            title="Transfers by new owner"
            subtitle="Where this client's work has moved"
            icon={ArrowLeftRight}
            iconColor="amber"
          >
            <BarChartView
              data={transfersByOwner}
              series={[{ key: 'count', name: 'Transfers' }]}
              orientation="bars"
              height={260}
            />
          </Panel>
          <Panel
            title="Work transfers"
            subtitle={`${clientTransfers.length} ownership change(s) on this client's work`}
            icon={ArrowLeftRight}
            iconColor="violet"
            padded={false}
            bodyClassName="p-4"
          >
            <WorkTransferTable transfers={clientTransfers} />
          </Panel>
        </div>
      )}

      {/* -------------------------- Timeline tab ------------------------- */}
      {tab === 'timeline' && (
        <div className="space-y-5">
          <Panel
            title="Delivery momentum"
            subtitle="Work created vs completed over the last 6 months"
            icon={History}
            iconColor="indigo"
          >
            <TrendChartView
              data={deliveryTrend}
              series={[
                { key: 'created', name: 'Created', color: chartColor(0) },
                { key: 'completed', name: 'Completed', color: chartColor(2) },
              ]}
              height={280}
            />
          </Panel>
          <Panel
            title="Delivery timeline"
            subtitle="Every work item by start & completion date"
            icon={History}
            iconColor="violet"
          >
            {deliveryTimeline.length === 0 ? (
              <EmptyState
                icon={History}
                title="No delivery history yet"
                description="Work items will appear here as they are created."
                compact
              />
            ) : (
              <ol className="space-y-2">
                {deliveryTimeline.map((w) => {
                  const owner = getMember(w.ownerId);
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => ui.openWorkItem(w.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-ink-100 bg-white/70 p-3 text-left transition hover:border-ink-200 hover:bg-brand-50/40"
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            w.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-indigo-50 text-indigo-600',
                          )}
                        >
                          {w.status === 'Completed' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Briefcase className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-ink-800">
                            {w.title}
                          </p>
                          <p className="truncate text-[11px] text-ink-400">
                            Started {formatDate(w.startDate)}
                            {w.completionDate
                              ? ` · Completed ${formatDate(w.completionDate)}`
                              : ` · Due ${formatDate(w.dueDate)}`}
                            {owner ? ` · ${owner.name}` : ''}
                          </p>
                        </div>
                        <div className="hidden w-32 shrink-0 sm:block">
                          <ProgressBar
                            value={w.progress}
                            size="sm"
                            showLabel
                            color={w.progress >= 100 ? 'emerald' : 'indigo'}
                          />
                        </div>
                        <StatusBadge status={effectiveStatus(w, data.workflowStages)} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
