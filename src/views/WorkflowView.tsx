import { useMemo } from 'react';
import {
  ArrowLeftRight,
  Crown,
  GitBranch,
  Layers,
  Network,
  Rocket,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import type { WorkflowStage } from '@/types';
import { useStore } from '@/store/StoreContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { BarChartView } from '@/components/charts/Charts';
import { WorkflowMap } from '@/components/WorkflowMap';
import { HierarchyTree } from '@/components/HierarchyTree';
import { daysBetween, todayISO } from '@/utils/dates';
import { average } from '@/utils/collections';
import type { ExcelSheet, PptSummary } from '@/utils/export';

const BOTTLENECK_DAYS = 14;

interface StageRow {
  id: string;
  stage: WorkflowStage;
  order: number;
  shortLabel: string;
  description: string;
  activeItems: number;
  avgDays: number;
  isBottleneck: boolean;
}

export function WorkflowView() {
  const { data } = useStore();

  /* Days-in-stage per work item: latest timeline event whose metadata.stage
     matches the item's current stage, else fall back to its start date. */
  const daysInStage = useMemo(() => {
    const map = new Map<string, number>();
    data.workItems.forEach((w) => {
      const entry = data.timelineEvents
        .filter(
          (e) =>
            e.workItemId === w.id && e.metadata?.stage === w.currentStage,
        )
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      map.set(
        w.id,
        Math.max(0, daysBetween(entry?.date ?? w.startDate, todayISO())),
      );
    });
    return map;
  }, [data.workItems, data.timelineEvents]);

  const stageRows = useMemo<StageRow[]>(() => {
    return [...data.workflowStages]
      .sort((a, b) => a.order - b.order)
      .map((cfg) => {
        const items = data.workItems.filter(
          (w) => w.currentStage === cfg.stage,
        );
        const avgDays = Math.round(
          average(items.map((w) => daysInStage.get(w.id) ?? 0)),
        );
        return {
          id: cfg.id,
          stage: cfg.stage,
          order: cfg.order,
          shortLabel: cfg.shortLabel,
          description: cfg.description,
          activeItems: items.length,
          avgDays,
          isBottleneck: items.length > 0 && avgDays >= BOTTLENECK_DAYS,
        };
      });
  }, [data.workflowStages, data.workItems, daysInStage]);

  const stats = useMemo(() => {
    const wi = data.workItems;
    return {
      totalStages: data.workflowStages.length,
      inPipeline: wi.filter((w) => w.status !== 'Completed').length,
      bottlenecks: stageRows.filter((s) => s.isBottleneck).length,
      completed: wi.filter((w) => w.status === 'Completed').length,
      live: wi.filter((w) => w.status === 'Live').length,
    };
  }, [data.workItems, data.workflowStages, stageRows]);

  const stageChartData = useMemo(
    () =>
      stageRows.map((s) => ({
        label: s.shortLabel,
        active: s.activeItems,
      })),
    [stageRows],
  );

  const getSheets = (): ExcelSheet<unknown>[] => {
    const sheet: ExcelSheet<StageRow> = {
      name: 'Workflow Stages',
      rows: stageRows,
      columns: [
        { header: 'Order', value: (s) => s.order },
        { header: 'Stage', value: (s) => s.stage },
        { header: 'Short Label', value: (s) => s.shortLabel },
        { header: 'Description', value: (s) => s.description },
        { header: 'Active Items', value: (s) => s.activeItems },
        { header: 'Avg Days In Stage', value: (s) => s.avgDays },
      ],
    };
    return [sheet as ExcelSheet<unknown>];
  };

  const getPptSummary = (): PptSummary => ({
    title: 'Munshot Delivery Workflow',
    subtitle: 'The Munshot OS delivery process, end to end',
    kpis: [
      { label: 'Workflow stages', value: stats.totalStages },
      { label: 'Items in pipeline', value: stats.inPipeline },
      { label: 'Bottleneck stages', value: stats.bottlenecks },
      { label: 'Live on Munshot', value: stats.live },
      { label: 'Completed items', value: stats.completed },
    ],
    charts: [
      {
        title: 'Active work by stage',
        type: 'bar',
        labels: stageChartData.map((d) => d.label),
        series: [
          { name: 'Active items', values: stageChartData.map((d) => d.active) },
        ],
      },
    ],
    tables: [
      {
        title: 'Workflow stages',
        headers: [
          'Order',
          'Stage',
          'Short Label',
          'Active Items',
          'Avg Days In Stage',
        ],
        rows: stageRows.map((s) => [
          s.order,
          s.stage,
          s.shortLabel,
          s.activeItems,
          s.avgDays,
        ]),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Workflow"
        subtitle="The Munshot delivery process, end to end"
        action={
          <ExportButtons
            filename="munshot-workflow"
            getSheets={getSheets}
            getPptSummary={getPptSummary}
          />
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Workflow Stages"
          value={stats.totalStages}
          icon={Layers}
          color="indigo"
          hint="kickoff to completion"
        />
        <MetricCard
          label="In Pipeline"
          value={stats.inPipeline}
          icon={GitBranch}
          color="violet"
          hint="active work items"
        />
        <MetricCard
          label="Bottleneck Stages"
          value={stats.bottlenecks}
          icon={TrendingUp}
          color="rose"
          hint={`avg ${BOTTLENECK_DAYS}d+ in stage`}
        />
        <MetricCard
          label="Live on Munshot"
          value={stats.live}
          icon={Rocket}
          color="cyan"
          hint="shipped to clients"
        />
        <MetricCard
          label="Completed Items"
          value={stats.completed}
          icon={ShieldCheck}
          color="emerald"
          hint="delivered end to end"
        />
      </div>

      {/* Delivery process map */}
      <Panel
        title="Munshot delivery process"
        subtitle="Every stage, with live counts, time-in-stage and bottleneck alerts"
        icon={GitBranch}
        iconColor="indigo"
      >
        <WorkflowMap />
      </Panel>

      {/* Transfer callout */}
      <Panel
        title="Work transfers happen at any stage"
        icon={ArrowLeftRight}
        iconColor="amber"
      >
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50/70 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <ArrowLeftRight className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
          </div>
          <p className="text-sm leading-relaxed text-ink-600">
            Work transfers can happen at{' '}
            <span className="font-bold text-ink-800">ANY stage</span> of the
            workflow — a build can change hands mid-flight without resetting
            its progress. Ownership moves are tracked separately in the{' '}
            <span className="font-bold text-amber-700">Work Transfers</span>{' '}
            tab, and performance scoring stays transfer-aware so nobody is
            penalised for work handed off before completion.
          </p>
        </div>
      </Panel>

      {/* Reporting hierarchy & roles */}
      <Panel
        title="Reporting hierarchy & roles"
        subtitle="Who reviews, who approves, who owns the build"
        icon={Network}
        iconColor="violet"
      >
        <HierarchyTree />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600">
                <Crown className="h-4 w-4" />
              </div>
              <p className="font-display text-sm font-extrabold text-ink-800">
                Chiraag
              </p>
            </div>
            <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-fuchsia-600">
              Founder review
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Final founder sign-off on builds before they reach the client
              demo stage.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="font-display text-sm font-extrabold text-ink-800">
                Vipul
              </p>
            </div>
            <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-brand-600">
              Team Lead approval
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Team Lead quality gate — approves work and balances the desk
              before it goes live.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <UserCheck className="h-4 w-4" />
              </div>
              <p className="font-display text-sm font-extrabold text-ink-800">
                Interns
              </p>
            </div>
            <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-sky-600">
              Assigned owners
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Equity research interns own the build — from requirement to
              dashboard, agent or workflow.
            </p>
          </div>
        </div>
      </Panel>

      {/* Active work by stage */}
      <Panel
        title="Active work by stage"
        subtitle="Where the pipeline sits right now"
        icon={GitBranch}
        iconColor="teal"
      >
        <BarChartView
          data={stageChartData}
          series={[{ key: 'active', name: 'Active items' }]}
          orientation="bars"
          height={460}
        />
      </Panel>
    </div>
  );
}
