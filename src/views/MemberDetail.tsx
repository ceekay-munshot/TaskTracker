import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bot,
  Briefcase,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  Gauge,
  Heart,
  Inbox,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Rocket,
  Sparkles,
  Timer,
  TrendingUp,
  Trophy,
  UserRound,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  PRIORITIES,
  WORK_ITEM_STATUSES,
  WORK_ITEM_TYPES,
  type MemberPerformanceStats,
  type Task,
  type WorkItem,
} from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { MiniStat, Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { Tabs } from '@/components/ui/Tabs';
import { toOptions } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import {
  Badge,
  MemberStatusBadge,
  PriorityBadge,
  TaskStatusBadge,
} from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { GaugeChart } from '@/components/charts/Charts';
import { WorkItemTable } from '@/components/tables/WorkItemTable';
import { WorkTransferTable } from '@/components/tables/WorkTransferTable';
import { CalendarView } from '@/components/CalendarView';
import { MeetingRecordingCard } from '@/components/MeetingRecordingCard';
import { ImprovementPriorityList } from '@/components/ImprovementPriorityList';
import { formatDate, timeSince } from '@/utils/dates';
import { sortByKey } from '@/utils/collections';
import { cn } from '@/utils/cn';
import type { ColorName } from '@/utils/palette';
import type { ExcelSheet, PptSummary } from '@/utils/export';

type SubTab =
  | 'work'
  | 'todos'
  | 'meetings'
  | 'recordings'
  | 'feedback'
  | 'transfers'
  | 'performance';

const PERF_BADGE_COLOR: Record<MemberPerformanceStats['badge'], ColorName> = {
  Excellent: 'emerald',
  Strong: 'sky',
  'Needs Attention': 'amber',
  Overloaded: 'rose',
};

function riskTone(risk: number): ColorName {
  if (risk >= 75) return 'rose';
  if (risk >= 50) return 'orange';
  if (risk >= 28) return 'amber';
  return 'emerald';
}

function MetaItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-sm font-semibold',
          href ? 'text-brand-600' : 'text-ink-700',
        )}
        title={value}
      >
        {value || '—'}
      </p>
    </>
  );
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2">
      {href ? (
        <a href={href} className="block hover:underline">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}

export function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, derived, getMember, deleteTask } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();

  const [tab, setTab] = useState<SubTab>('work');
  const [wiClient, setWiClient] = useState('');
  const [wiStatus, setWiStatus] = useState('');
  const [wiPriority, setWiPriority] = useState('');
  const [wiType, setWiType] = useState('');

  const member = getMember(id);

  const memberId = member?.id ?? '';

  /* ---------------------------------------------------------------- */
  /* Derived collections — all scoped to this member                   */
  /* ---------------------------------------------------------------- */
  const ownedWorkItems = useMemo(
    () => data.workItems.filter((w) => w.ownerId === memberId),
    [data.workItems, memberId],
  );
  const originalWorkItems = useMemo(
    () => data.workItems.filter((w) => w.originalOwnerId === memberId),
    [data.workItems, memberId],
  );
  const ownedTasks = useMemo(
    () =>
      sortByKey(
        data.tasks.filter((t) => t.ownerId === memberId),
        (t) => t.dueDate,
      ),
    [data.tasks, memberId],
  );
  const ownedMeetings = useMemo(
    () => data.meetings.filter((m) => m.ownerId === memberId),
    [data.meetings, memberId],
  );
  const ownedRecordings = useMemo(
    () =>
      sortByKey(
        data.recordings.filter((r) => r.ownerId === memberId),
        (r) => r.meetingDate,
        'desc',
      ),
    [data.recordings, memberId],
  );
  const ownedFeedback = useMemo(() => {
    const ownedIds = new Set(ownedWorkItems.map((w) => w.id));
    return data.feedback.filter(
      (f) => f.workItemId !== null && ownedIds.has(f.workItemId),
    );
  }, [data.feedback, ownedWorkItems]);
  const memberTransfers = useMemo(
    () =>
      sortByKey(
        data.transfers.filter(
          (t) => t.fromOwnerId === memberId || t.toOwnerId === memberId,
        ),
        (t) => t.transferDate,
        'desc',
      ),
    [data.transfers, memberId],
  );

  const filteredWorkItems = useMemo(
    () =>
      sortByKey(
        ownedWorkItems.filter((w) => {
          if (wiClient && w.clientId !== wiClient) return false;
          if (wiStatus && w.status !== wiStatus) return false;
          if (wiPriority && w.priority !== wiPriority) return false;
          if (wiType && w.type !== wiType) return false;
          return true;
        }),
        (w) => w.dueDate,
      ),
    [ownedWorkItems, wiClient, wiStatus, wiPriority, wiType],
  );

  const workload = memberId
    ? derived.workloadByMember.get(memberId)
    : undefined;
  const performance = memberId
    ? derived.performanceByMember.get(memberId)
    : undefined;

  const kpis = useMemo(() => {
    const completed = ownedWorkItems.filter(
      (w) => w.status === 'Completed',
    ).length;
    const activePending = ownedWorkItems.filter(
      (w) => w.status !== 'Completed',
    ).length;
    const blocked = ownedWorkItems.filter(
      (w) => w.status === 'Blocked',
    ).length;
    const transfersIn = data.transfers.filter(
      (t) =>
        t.toOwnerId === memberId &&
        (t.status === 'Approved' || t.status === 'Completed'),
    ).length;
    const transfersOut = data.transfers.filter(
      (t) =>
        t.fromOwnerId === memberId &&
        (t.status === 'Approved' || t.status === 'Completed'),
    ).length;
    return {
      originallyAssigned: originalWorkItems.length,
      currentlyOwned: ownedWorkItems.length,
      completed,
      activePending,
      blocked,
      transfersIn,
      transfersOut,
      recordings: ownedRecordings.length,
      onTimeRate: performance ? Math.round(performance.onTimeRate * 100) : 0,
      capacityRisk: workload?.capacityRisk ?? 0,
    };
  }, [
    ownedWorkItems,
    originalWorkItems,
    ownedRecordings,
    data.transfers,
    memberId,
    performance,
    workload,
  ]);

  const manager = member ? getMember(member.reportsToId) : undefined;

  const getSheets = (): ExcelSheet<unknown>[] => [
    {
      name: 'Work Items',
      rows: ownedWorkItems,
      columns: [
        { header: 'Title', value: (w: WorkItem) => w.title },
        { header: 'Type', value: (w: WorkItem) => w.type },
        {
          header: 'Client',
          value: (w: WorkItem) =>
            data.clients.find((c) => c.id === w.clientId)?.name ?? '',
        },
        { header: 'Stage', value: (w: WorkItem) => w.currentStage },
        { header: 'Status', value: (w: WorkItem) => w.status },
        { header: 'Priority', value: (w: WorkItem) => w.priority },
        { header: 'Progress %', value: (w: WorkItem) => w.progress },
        { header: 'Due', value: (w: WorkItem) => w.dueDate },
      ],
    } as ExcelSheet<unknown>,
    {
      name: 'Todos',
      rows: ownedTasks,
      columns: [
        { header: 'Task', value: (t: Task) => t.title },
        { header: 'Status', value: (t: Task) => t.status },
        { header: 'Priority', value: (t: Task) => t.priority },
        {
          header: 'Work Item',
          value: (t: Task) =>
            data.workItems.find((w) => w.id === t.workItemId)?.title ?? '',
        },
        { header: 'Due', value: (t: Task) => t.dueDate },
      ],
    } as ExcelSheet<unknown>,
  ];

  const getPptSummary = (): PptSummary => ({
    title: member ? member.name : 'Team Member',
    subtitle: member
      ? `${member.role} — Munshot equity research desk`
      : 'Munshot OS',
    kpis: [
      { label: 'Currently owned', value: kpis.currentlyOwned },
      { label: 'Originally assigned', value: kpis.originallyAssigned },
      { label: 'Completed', value: kpis.completed },
      { label: 'Active / pending', value: kpis.activePending },
      { label: 'Blocked', value: kpis.blocked },
      { label: 'Transfers in / out', value: `${kpis.transfersIn}/${kpis.transfersOut}` },
      { label: 'Recordings owned', value: kpis.recordings },
      { label: 'On-time rate', value: `${kpis.onTimeRate}%` },
      { label: 'Capacity risk', value: `${kpis.capacityRisk}%` },
      {
        label: 'Performance score',
        value: performance ? performance.performanceScore : 0,
      },
    ],
    tables: [
      {
        title: 'Owned work items',
        headers: ['Title', 'Type', 'Status', 'Priority', 'Progress %', 'Due'],
        rows: ownedWorkItems.map((w) => [
          w.title,
          w.type,
          w.status,
          w.priority,
          w.progress,
          formatDate(w.dueDate),
        ]),
      },
      {
        title: 'Todos',
        headers: ['Task', 'Status', 'Priority', 'Due'],
        rows: ownedTasks.map((t) => [
          t.title,
          t.status,
          t.priority,
          formatDate(t.dueDate),
        ]),
      },
    ],
  });

  /* ---------------------------------------------------------------- */
  /* Not found                                                         */
  /* ---------------------------------------------------------------- */
  if (!member) {
    return (
      <div className="space-y-5">
        <Panel padded>
          <EmptyState
            icon={UserRound}
            title="Team member not found"
            description="This profile may have been removed from the desk."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/team')}
              >
                <ArrowLeft className="h-4 w-4" /> Back to team
              </button>
            }
          />
        </Panel>
      </div>
    );
  }

  const handleDeleteTask = async (taskId: string, title: string) => {
    const ok = await confirm({
      title: `Delete "${title}"?`,
      description: 'This removes the task permanently. This cannot be undone.',
      confirmLabel: 'Delete task',
      tone: 'danger',
    });
    if (ok) {
      deleteTask(taskId);
      toast.success('Task deleted', title);
    }
  };

  const tabs = [
    { id: 'work', label: 'Work Items', icon: LayoutDashboard, count: ownedWorkItems.length },
    { id: 'todos', label: 'Todos', icon: CheckSquare, count: ownedTasks.length },
    { id: 'meetings', label: 'Meetings', icon: CalendarDays, count: ownedMeetings.length },
    { id: 'recordings', label: 'Recordings', icon: Video, count: ownedRecordings.length },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, count: ownedFeedback.length },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight, count: memberTransfers.length },
    { id: 'performance', label: 'Performance', icon: Trophy },
  ];

  const wiFiltersActive = Boolean(
    wiClient || wiStatus || wiPriority || wiType,
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        title={member.name}
        subtitle={`${member.role} · ${member.city}`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/team')}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <ExportButtons
              filename={`munshot-${member.name.toLowerCase().replace(/\s+/g, '-')}`}
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
          </div>
        }
      />

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:gap-6 sm:p-6">
          {/* Avatar — left */}
          <div className="flex shrink-0 justify-center sm:block">
            <div className="rounded-full bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 p-[3px]">
              <div className="rounded-full bg-white p-[3px]">
                <Avatar name={member.name} src={member.photoUrl} size="xl" />
              </div>
            </div>
          </div>

          {/* Details — right */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-ink-800">
                    {member.name}
                  </h2>
                  <MemberStatusBadge status={member.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-brand-600">
                  {member.role}
                  <span className="font-medium text-ink-400">
                    {manager ? ` · reports to ${manager.name}` : ' · Founder'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost shrink-0"
                onClick={() => ui.editTeamMember(member)}
              >
                <Pencil className="h-4 w-4" /> Edit profile
              </button>
            </div>

            {member.bio && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-500">
                {member.bio}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              <MetaItem icon={MapPin} label="Location" value={member.city} />
              <MetaItem
                icon={Briefcase}
                label="Qualification"
                value={member.qualification}
              />
              {member.role === 'Founder' ? (
                <MetaItem
                  icon={Sparkles}
                  label="Tenure"
                  value="Since inception"
                />
              ) : (
                <>
                  <MetaItem
                    icon={Timer}
                    label="Tenure"
                    value={`${timeSince(member.joinDate)} on desk`}
                  />
                  <MetaItem
                    icon={CalendarDays}
                    label="Joined"
                    value={formatDate(member.joinDate)}
                  />
                </>
              )}
              <MetaItem
                icon={Mail}
                label="Email"
                value={member.email}
                href={`mailto:${member.email}`}
              />
              <MetaItem icon={Phone} label="Phone" value={member.phone} />
            </div>

            {member.expertise.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                  Expertise
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {member.expertise.map((e) => (
                    <Badge key={e} color="violet" size="sm" soft>
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Personal KPI grid */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MiniStat
          label="Originally Assigned"
          value={kpis.originallyAssigned}
          icon={ClipboardList}
          color="slate"
          hint="work first owned"
        />
        <MiniStat
          label="Currently Owned"
          value={kpis.currentlyOwned}
          icon={LayoutDashboard}
          color="indigo"
        />
        <MiniStat
          label="Completed"
          value={kpis.completed}
          icon={CheckCircle2}
          color="emerald"
        />
        <MiniStat
          label="Active / Pending"
          value={kpis.activePending}
          icon={Activity}
          color="violet"
        />
        <MiniStat
          label="Blocked"
          value={kpis.blocked}
          icon={AlertOctagon}
          color="rose"
        />
        <MiniStat
          label="Transfers In"
          value={kpis.transfersIn}
          icon={ArrowDownLeft}
          color="sky"
        />
        <MiniStat
          label="Transfers Out"
          value={kpis.transfersOut}
          icon={ArrowUpRight}
          color="orange"
        />
        <MiniStat
          label="Recordings Owned"
          value={kpis.recordings}
          icon={Video}
          color="fuchsia"
        />
        <MiniStat
          label="On-time Rate"
          value={`${kpis.onTimeRate}%`}
          icon={Clock}
          color="teal"
        />
        <MiniStat
          label="Capacity Risk"
          value={`${kpis.capacityRisk}%`}
          icon={Gauge}
          color={riskTone(kpis.capacityRisk)}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        active={tab}
        onChange={(t) => setTab(t as SubTab)}
        layoutId="member-detail-tabs"
      />

      {/* Work Items */}
      {tab === 'work' && (
        <div className="space-y-4">
          <FilterBar
            selects={[
              {
                key: 'client',
                label: 'Clients',
                value: wiClient,
                onChange: setWiClient,
                options: sortByKey(
                  data.clients.map((c) => ({ value: c.id, label: c.name })),
                  (o) => o.label,
                ),
              },
              {
                key: 'status',
                label: 'Statuses',
                value: wiStatus,
                onChange: setWiStatus,
                options: toOptions(WORK_ITEM_STATUSES),
              },
              {
                key: 'priority',
                label: 'Priorities',
                value: wiPriority,
                onChange: setWiPriority,
                options: toOptions(PRIORITIES),
              },
              {
                key: 'type',
                label: 'Types',
                value: wiType,
                onChange: setWiType,
                options: toOptions(WORK_ITEM_TYPES),
              },
            ]}
            hasActiveFilters={wiFiltersActive}
            onReset={() => {
              setWiClient('');
              setWiStatus('');
              setWiPriority('');
              setWiType('');
            }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.addWorkItem({ ownerId: member.id })}
            >
              <Bot className="h-4 w-4" /> Add Dashboard/Agent
            </button>
          </FilterBar>
          <Panel
            title="Owned work items"
            subtitle={`${filteredWorkItems.length} of ${ownedWorkItems.length} shown`}
            icon={LayoutDashboard}
            iconColor="indigo"
            bodyClassName="p-2"
          >
            <WorkItemTable items={filteredWorkItems} />
          </Panel>
        </div>
      )}

      {/* Todos */}
      {tab === 'todos' && (
        <Panel
          title="Personal todos"
          subtitle={`${ownedTasks.length} task(s) assigned`}
          icon={CheckSquare}
          iconColor="teal"
          action={
            <button
              type="button"
              className="btn-soft"
              onClick={() => ui.addTask({ ownerId: member.id })}
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          }
        >
          {ownedTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No todos yet"
              description="Add a task to keep this member's checklist on track."
              compact
            />
          ) : (
            <ul className="space-y-2">
              {ownedTasks.map((t) => {
                const workItem = data.workItems.find(
                  (w) => w.id === t.workItemId,
                );
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white/70 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {t.title}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">
                        {workItem ? workItem.title : 'Standalone task'}
                        {' · due '}
                        {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <TaskStatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <ActionMenu
                      actions={[
                        {
                          label: 'Edit task',
                          icon: Pencil,
                          onClick: () => ui.editTask(t),
                        },
                        {
                          label: 'Delete task',
                          icon: Inbox,
                          tone: 'danger',
                          onClick: () => handleDeleteTask(t.id, t.title),
                        },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      {/* Meetings */}
      {tab === 'meetings' && (
        <Panel
          title="Meetings"
          subtitle={`${ownedMeetings.length} meeting(s) owned`}
          icon={CalendarDays}
          iconColor="sky"
          action={
            <button
              type="button"
              className="btn-soft"
              onClick={() => ui.addMeeting({ ownerId: member.id })}
            >
              <CalendarPlus className="h-4 w-4" /> Add Meeting
            </button>
          }
        >
          {ownedMeetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No meetings owned"
              description="Schedule a meeting for this member to see it on the calendar."
              compact
            />
          ) : (
            <CalendarView meetings={ownedMeetings} />
          )}
        </Panel>
      )}

      {/* Recordings */}
      {tab === 'recordings' && (
        <Panel
          title="Meeting recordings"
          subtitle={`${ownedRecordings.length} recording(s) owned`}
          icon={Video}
          iconColor="fuchsia"
          action={
            <button
              type="button"
              className="btn-soft"
              onClick={() => ui.addRecording({ ownerId: member.id })}
            >
              <Plus className="h-4 w-4" /> Add Recording
            </button>
          }
        >
          {ownedRecordings.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No recordings owned"
              description="Add a client meeting recording to build the knowledge base."
              compact
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ownedRecordings.map((r) => (
                <MeetingRecordingCard
                  key={r.id}
                  recording={r}
                  onView={() => ui.openRecording(r.id)}
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Feedback */}
      {tab === 'feedback' && (
        <Panel
          title="Feedback on owned work"
          subtitle={`${ownedFeedback.length} item(s) across this member's work`}
          icon={MessageSquare}
          iconColor="orange"
        >
          <ImprovementPriorityList
            feedback={ownedFeedback}
            emptyHint="No feedback logged against this member's work items yet."
          />
        </Panel>
      )}

      {/* Transfers */}
      {tab === 'transfers' && (
        <Panel
          title="Work transfers"
          subtitle={`${memberTransfers.length} transfer(s) in or out`}
          icon={ArrowLeftRight}
          iconColor="amber"
          bodyClassName="p-2"
        >
          <WorkTransferTable transfers={memberTransfers} />
        </Panel>
      )}

      {/* Performance */}
      {tab === 'performance' && (
        <div className="space-y-4">
          {performance ? (
            <>
              <div className="grid gap-5 lg:grid-cols-3">
                <Panel
                  title="Performance score"
                  subtitle="Transfer-aware weighted rating"
                  icon={Trophy}
                  iconColor="amber"
                >
                  <div className="flex flex-col items-center gap-3">
                    <GaugeChart
                      value={performance.performanceScore}
                      label="Score"
                      color={
                        performance.performanceScore >= 78
                          ? '#10b981'
                          : performance.performanceScore >= 58
                            ? '#0ea5e9'
                            : '#f59e0b'
                      }
                      height={180}
                    />
                    <Badge
                      color={PERF_BADGE_COLOR[performance.badge]}
                      dot
                      size="md"
                    >
                      {performance.badge}
                    </Badge>
                  </div>
                </Panel>
                <Panel
                  title="Delivery breakdown"
                  subtitle="Throughput, quality & reliability"
                  icon={TrendingUp}
                  iconColor="indigo"
                  className="lg:col-span-2"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <MiniStat
                      label="Completed Work"
                      value={performance.completedWork}
                      icon={CheckCircle2}
                      color="emerald"
                    />
                    <MiniStat
                      label="On-time Rate"
                      value={`${Math.round(performance.onTimeRate * 100)}%`}
                      icon={Clock}
                      color="teal"
                    />
                    <MiniStat
                      label="Active Workload"
                      value={performance.activeWorkload}
                      icon={Activity}
                      color="indigo"
                    />
                    <MiniStat
                      label="Feedback Closure"
                      value={`${Math.round(performance.feedbackClosure * 100)}%`}
                      icon={MessageSquare}
                      color="orange"
                    />
                    <MiniStat
                      label="Avg Progress"
                      value={`${performance.averageProgress}%`}
                      icon={Sparkles}
                      color="violet"
                    />
                    <MiniStat
                      label="Blocked Count"
                      value={performance.blockedCount}
                      icon={AlertOctagon}
                      color="rose"
                    />
                  </div>
                </Panel>
              </div>

              <Panel
                title="Transfer-aware breakdown"
                subtitle="Ownership movement & continuity"
                icon={ArrowLeftRight}
                iconColor="fuchsia"
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStat
                    label="Work Received"
                    value={performance.workReceived}
                    icon={ArrowDownLeft}
                    color="sky"
                  />
                  <MiniStat
                    label="Transferred Out"
                    value={performance.workTransferredOut}
                    icon={ArrowUpRight}
                    color="orange"
                  />
                  <MiniStat
                    label="Completed Before Transfer"
                    value={performance.completedBeforeTransfer}
                    icon={CheckCircle2}
                    color="emerald"
                  />
                  <MiniStat
                    label="Completed After Transfer"
                    value={performance.completedAfterTransfer}
                    icon={Rocket}
                    color="cyan"
                  />
                  <MiniStat
                    label="Pending Transferred Work"
                    value={performance.pendingTransferredWork}
                    icon={ClipboardList}
                    color="amber"
                  />
                  <MiniStat
                    label="Recordings Handled"
                    value={performance.recordingsHandled}
                    icon={Video}
                    color="fuchsia"
                  />
                  <MiniStat
                    label="Avg Health Points"
                    value={performance.averageHealthPoints}
                    icon={Heart}
                    color={
                      performance.averageHealthPoints >= 25
                        ? 'rose'
                        : performance.averageHealthPoints >= 12
                          ? 'amber'
                          : 'emerald'
                    }
                    hint="lower is healthier"
                  />
                  <MiniStat
                    label="Demo-ready Projects"
                    value={performance.demoReadyProjects}
                    icon={CheckCircle2}
                    color="emerald"
                  />
                </div>
              </Panel>
            </>
          ) : (
            <Panel padded>
              <EmptyState
                icon={Trophy}
                title="No performance data"
                description="Performance metrics will appear once this member owns work."
                compact
              />
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
