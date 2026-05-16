import { useMemo } from 'react';
import {
  Activity,
  ArrowLeftRight,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  LayoutGrid,
  Sparkles,
  Trophy,
  Users,
  Video,
} from 'lucide-react';
import type { MemberPerformanceStats, TeamMember } from '@/types';
import { useStore } from '@/store/StoreContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  BarChartView,
  DonutChartView,
  TrendChartView,
} from '@/components/charts/Charts';
import { PerformanceLeaderboard } from '@/components/PerformanceLeaderboard';
import { WorkloadHeatmap } from '@/components/WorkloadHeatmap';
import { average } from '@/utils/collections';
import { monthKey, monthLabel, recentMonthKeys } from '@/utils/dates';
import type { ColorName } from '@/utils/palette';
import type { ExcelSheet, PptSummary } from '@/utils/export';

const BADGE_COLOR: Record<MemberPerformanceStats['badge'], ColorName> = {
  Excellent: 'emerald',
  Strong: 'sky',
  'Needs Attention': 'amber',
  Overloaded: 'rose',
};

const BADGE_BLURB: Record<MemberPerformanceStats['badge'], string> = {
  Excellent: 'Top of the desk — high throughput, on-time and healthy.',
  Strong: 'Reliably delivering with solid quality and pace.',
  'Needs Attention': 'Slipping on time, progress or feedback closure.',
  Overloaded: 'Capacity at risk — too much active or blocked work.',
};

interface PerfRow {
  member: TeamMember;
  stats: MemberPerformanceStats;
}

export function Performance() {
  const { data, derived } = useStore();

  /* Members paired with their computed performance stats. */
  const rows = useMemo<PerfRow[]>(
    () =>
      data.teamMembers
        .map((member) => ({
          member,
          stats: derived.performanceByMember.get(member.id),
        }))
        .filter((r): r is PerfRow => Boolean(r.stats)),
    [data.teamMembers, derived.performanceByMember],
  );

  const stats = useMemo(() => {
    const completedWork = rows.reduce(
      (sum, r) => sum + r.stats.completedWork,
      0,
    );
    const activeWorkload = rows.reduce(
      (sum, r) => sum + r.stats.activeWorkload,
      0,
    );
    const scored = rows.filter((r) => r.stats.completedWork > 0);
    return {
      completedWork,
      activeWorkload,
      avgScore: Math.round(
        average(rows.map((r) => r.stats.performanceScore)),
      ),
      avgOnTime: Math.round(
        average(scored.map((r) => r.stats.onTimeRate)) * 100,
      ),
      overloaded: rows.filter((r) => r.stats.badge === 'Overloaded').length,
      excellent: rows.filter((r) => r.stats.badge === 'Excellent').length,
    };
  }, [rows]);

  /* Per-member on-time vs delayed, computed from their completed work items. */
  const onTimeData = useMemo(
    () =>
      rows
        .map((r) => {
          const completed = data.workItems.filter(
            (w) => w.ownerIds.includes(r.member.id) && w.status === 'Completed',
          );
          let onTime = 0;
          let delayed = 0;
          completed.forEach((w) => {
            if (w.completionDate && w.completionDate <= w.dueDate) onTime += 1;
            else delayed += 1;
          });
          return {
            label: r.member.name.split(' ')[0],
            onTime,
            delayed,
          };
        })
        .filter((d) => d.onTime > 0 || d.delayed > 0),
    [rows, data.workItems],
  );

  const completedData = useMemo(
    () =>
      rows
        .map((r) => ({
          label: r.member.name.split(' ')[0],
          completed: r.stats.completedWork,
        }))
        .filter((d) => d.completed > 0),
    [rows],
  );

  const activeData = useMemo(
    () =>
      rows
        .map((r) => ({
          label: r.member.name.split(' ')[0],
          active: r.stats.activeWorkload,
        }))
        .filter((d) => d.active > 0),
    [rows],
  );

  /* Work-type split across every work item. */
  const workTypeData = useMemo(() => {
    const counts = { Dashboard: 0, Agent: 0, Workflow: 0 };
    data.workItems.forEach((w) => {
      counts[w.type] += 1;
    });
    return [
      { label: 'Dashboard', value: counts.Dashboard },
      { label: 'Agent', value: counts.Agent },
      { label: 'Workflow', value: counts.Workflow },
    ];
  }, [data.workItems]);

  /* Distinct clients each member has work for. */
  const clientCoverageData = useMemo(
    () =>
      rows
        .map((r) => {
          const clientIds = new Set(
            data.workItems
              .filter((w) => w.ownerIds.includes(r.member.id))
              .map((w) => w.clientId),
          );
          return {
            label: r.member.name.split(' ')[0],
            clients: clientIds.size,
          };
        })
        .filter((d) => d.clients > 0),
    [rows, data.workItems],
  );

  /* Monthly completion trend over the last 6 months. */
  const completionTrendData = useMemo(() => {
    const keys = recentMonthKeys(6);
    const counts = new Map<string, number>(keys.map((k) => [k, 0]));
    data.workItems.forEach((w) => {
      if (!w.completionDate) return;
      const key = monthKey(w.completionDate);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return keys.map((k) => ({
      label: monthLabel(k),
      completed: counts.get(k) ?? 0,
    }));
  }, [data.workItems]);

  /* Transfer load — work received vs transferred out per member. */
  const transferData = useMemo(
    () =>
      rows
        .map((r) => ({
          label: r.member.name.split(' ')[0],
          received: r.stats.workReceived,
          transferredOut: r.stats.workTransferredOut,
        }))
        .filter((d) => d.received > 0 || d.transferredOut > 0),
    [rows],
  );

  /* Meeting recordings handled per member. */
  const recordingsData = useMemo(
    () =>
      rows
        .map((r) => ({
          label: r.member.name.split(' ')[0],
          recordings: r.stats.recordingsHandled,
        }))
        .filter((d) => d.recordings > 0),
    [rows],
  );

  const rankedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => b.stats.performanceScore - a.stats.performanceScore,
      ),
    [rows],
  );

  const getSheets = (): ExcelSheet<unknown>[] => {
    const sheet: ExcelSheet<PerfRow> = {
      name: 'Performance',
      rows: rankedRows,
      columns: [
        { header: 'Member', value: (r) => r.member.name },
        { header: 'Role', value: (r) => r.member.role },
        { header: 'Performance Score', value: (r) => r.stats.performanceScore },
        { header: 'Badge', value: (r) => r.stats.badge },
        { header: 'Completed', value: (r) => r.stats.completedWork },
        {
          header: 'On-time Rate',
          value: (r) =>
            r.stats.completedWork === 0
              ? '—'
              : `${Math.round(r.stats.onTimeRate * 100)}%`,
        },
        { header: 'Active Workload', value: (r) => r.stats.activeWorkload },
        { header: 'Blocked', value: (r) => r.stats.blockedCount },
        { header: 'Work Received', value: (r) => r.stats.workReceived },
        {
          header: 'Transferred Out',
          value: (r) => r.stats.workTransferredOut,
        },
        {
          header: 'Completed After Transfer',
          value: (r) => r.stats.completedAfterTransfer,
        },
        {
          header: 'Pending Transferred',
          value: (r) => r.stats.pendingTransferredWork,
        },
        {
          header: 'Recordings Handled',
          value: (r) => r.stats.recordingsHandled,
        },
      ],
    };
    return [sheet as ExcelSheet<unknown>];
  };

  const getPptSummary = (): PptSummary => ({
    title: 'Team Performance',
    subtitle: 'Munshot OS — team scorecard & delivery leaderboard',
    kpis: [
      { label: 'Completed work', value: stats.completedWork },
      { label: 'Avg performance score', value: stats.avgScore },
      { label: 'Avg on-time rate', value: `${stats.avgOnTime}%` },
      { label: 'Active workload', value: stats.activeWorkload },
      { label: 'Overloaded members', value: stats.overloaded },
      { label: 'Excellent members', value: stats.excellent },
    ],
    charts: [
      {
        title: 'Completed work by person',
        type: 'bar',
        labels: completedData.map((d) => d.label),
        series: [
          {
            name: 'Completed',
            values: completedData.map((d) => d.completed),
          },
        ],
      },
    ],
    tables: [
      {
        title: 'Performance scorecard',
        headers: [
          'Member',
          'Role',
          'Score',
          'Badge',
          'Completed',
          'On-time',
          'Active',
          'Recordings',
        ],
        rows: rankedRows.map((r) => [
          r.member.name,
          r.member.role,
          r.stats.performanceScore,
          r.stats.badge,
          r.stats.completedWork,
          r.stats.completedWork === 0
            ? '—'
            : `${Math.round(r.stats.onTimeRate * 100)}%`,
          r.stats.activeWorkload,
          r.stats.recordingsHandled,
        ]),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Performance"
        subtitle="Team scorecard & leaderboard"
        action={
          <ExportButtons
            filename="munshot-performance"
            getSheets={getSheets}
            getPptSummary={getPptSummary}
          />
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Completed Work"
          value={stats.completedWork}
          icon={CheckCircle2}
          color="emerald"
          hint="delivered across the desk"
        />
        <MetricCard
          label="Avg Score"
          value={stats.avgScore}
          icon={Gauge}
          color="indigo"
          hint="team performance index"
        />
        <MetricCard
          label="Avg On-time Rate"
          value={`${stats.avgOnTime}%`}
          icon={Clock}
          color="sky"
          hint="completed by the due date"
        />
        <MetricCard
          label="Active Workload"
          value={stats.activeWorkload}
          icon={Activity}
          color="violet"
          hint="open items in flight"
        />
        <MetricCard
          label="Overloaded"
          value={stats.overloaded}
          icon={Flame}
          color="rose"
          hint="capacity at risk"
        />
        <MetricCard
          label="Excellent"
          value={stats.excellent}
          icon={Trophy}
          color="amber"
          hint="top performers"
        />
      </div>

      {/* Leaderboard */}
      <Panel
        title="Leaderboard"
        subtitle="Ranked by transfer-aware performance score"
        icon={Trophy}
        iconColor="amber"
      >
        <PerformanceLeaderboard />
      </Panel>

      {/* Scoring explainer + badge legend */}
      <Panel
        title="Performance score & badges"
        subtitle="How the score is built and what each badge means"
        icon={Award}
        iconColor="indigo"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-brand-50/60 p-3.5">
            <p className="text-sm leading-relaxed text-ink-600">
              The performance score is a weighted blend of{' '}
              <span className="font-bold text-ink-800">completed work</span>,{' '}
              <span className="font-bold text-ink-800">
                on-time completion
              </span>
              ,{' '}
              <span className="font-bold text-ink-800">
                low blocked items
              </span>
              ,{' '}
              <span className="font-bold text-ink-800">feedback closed</span>,{' '}
              <span className="font-bold text-ink-800">active progress</span>,{' '}
              <span className="font-bold text-ink-800">
                client-meeting handling
              </span>
              . It is{' '}
              <span className="font-bold text-brand-700">transfer-aware</span>:
              members are not penalised for work transferred away before
              completion, and credit follows the work that was genuinely
              delivered.
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(
              Object.keys(BADGE_COLOR) as MemberPerformanceStats['badge'][]
            ).map((badge) => (
              <div
                key={badge}
                className="flex flex-col gap-1.5 rounded-2xl border border-ink-100 bg-white/70 p-3"
              >
                <Badge color={BADGE_COLOR[badge]} dot>
                  {badge}
                </Badge>
                <p className="text-xs leading-relaxed text-ink-500">
                  {BADGE_BLURB[badge]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Charts grid */}
      {rows.length === 0 ? (
        <Panel title="Performance analytics" icon={Activity} iconColor="violet">
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Add team members to populate the performance scorecard."
            compact
          />
        </Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Completed work by person"
            subtitle="Delivered work items per member"
            icon={CheckCircle2}
            iconColor="emerald"
          >
            <BarChartView
              data={completedData}
              series={[{ key: 'completed', name: 'Completed' }]}
              orientation="bars"
              height={300}
            />
          </Panel>

          <Panel
            title="Active workload"
            subtitle="Open items currently in flight"
            icon={Activity}
            iconColor="violet"
          >
            <BarChartView
              data={activeData}
              series={[{ key: 'active', name: 'Active items' }]}
              orientation="bars"
              height={300}
            />
          </Panel>

          <Panel
            title="On-time vs delayed"
            subtitle="Completed work by delivery timing"
            icon={Clock}
            iconColor="sky"
          >
            <BarChartView
              data={onTimeData}
              series={[
                { key: 'onTime', name: 'On time', color: '#10b981' },
                { key: 'delayed', name: 'Delayed', color: '#f43f5e' },
              ]}
              stacked
              height={300}
            />
          </Panel>

          <Panel
            title="Work type split"
            subtitle="Dashboards, agents & workflows"
            icon={LayoutGrid}
            iconColor="fuchsia"
          >
            <DonutChartView data={workTypeData} height={260} />
          </Panel>

          <Panel
            title="Client coverage"
            subtitle="Distinct clients each member serves"
            icon={Users}
            iconColor="teal"
          >
            <BarChartView
              data={clientCoverageData}
              series={[{ key: 'clients', name: 'Clients' }]}
              orientation="bars"
              height={300}
            />
          </Panel>

          <Panel
            title="Monthly completion trend"
            subtitle="Work items completed per month"
            icon={Sparkles}
            iconColor="indigo"
          >
            <TrendChartView
              data={completionTrendData}
              series={[{ key: 'completed', name: 'Completed' }]}
              height={300}
            />
          </Panel>

          <Panel
            title="Transfer load"
            subtitle="Work received vs transferred out"
            icon={ArrowLeftRight}
            iconColor="amber"
          >
            <BarChartView
              data={transferData}
              series={[
                { key: 'received', name: 'Received' },
                { key: 'transferredOut', name: 'Transferred out' },
              ]}
              height={300}
            />
          </Panel>

          <Panel
            title="Meeting recordings by owner"
            subtitle="Client conversations captured per member"
            icon={Video}
            iconColor="cyan"
          >
            <BarChartView
              data={recordingsData}
              series={[{ key: 'recordings', name: 'Recordings' }]}
              orientation="bars"
              height={300}
            />
          </Panel>
        </div>
      )}

      {/* Workload heatmap */}
      <Panel
        title="Workload heatmap"
        subtitle="Capacity pressure across the desk"
        icon={Flame}
        iconColor="rose"
      >
        <WorkloadHeatmap />
      </Panel>
    </div>
  );
}
