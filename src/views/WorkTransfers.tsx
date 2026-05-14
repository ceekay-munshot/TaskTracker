import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CheckCheck,
  CircleSlash,
  Clock,
  ListChecks,
  PieChart,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  TRANSFER_REASONS,
  TRANSFER_STATUSES,
  type WorkTransfer,
} from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar } from '@/components/ui/FilterBar';
import { toOptions } from '@/components/ui/Field';
import { WorkTransferTable } from '@/components/tables/WorkTransferTable';
import {
  BarChartView,
  BarList,
  DonutChartView,
  TrendChartView,
} from '@/components/charts/Charts';
import { formatDate, monthKey, monthLabel, recentMonthKeys, todayISO } from '@/utils/dates';
import { countBy } from '@/utils/collections';
import { COLORS, transferStatusColor } from '@/utils/palette';
import type { ExcelSheet, ExportColumn, PptSummary } from '@/utils/export';

export function WorkTransfers() {
  const { data, getMember, getClient, getWorkItem } = useStore();
  const ui = useUI();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [fromOwner, setFromOwner] = useState('');
  const [toOwner, setToOwner] = useState('');
  const [client, setClient] = useState('');

  const hasActiveFilters =
    search.trim() !== '' ||
    status !== '' ||
    reason !== '' ||
    fromOwner !== '' ||
    toOwner !== '' ||
    client !== '';

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setReason('');
    setFromOwner('');
    setToOwner('');
    setClient('');
  };

  const filteredTransfers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.transfers.filter((t) => {
      const workItem = getWorkItem(t.workItemId);
      if (term) {
        const from = getMember(t.fromOwnerId)?.name.toLowerCase() ?? '';
        const to = getMember(t.toOwnerId)?.name.toLowerCase() ?? '';
        const clientName =
          getClient(workItem?.clientId)?.name.toLowerCase() ?? '';
        const haystack =
          `${workItem?.title ?? ''} ${from} ${to} ${clientName} ${t.reason} ${t.notes}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (status && t.status !== status) return false;
      if (reason && t.reason !== reason) return false;
      if (fromOwner && t.fromOwnerId !== fromOwner) return false;
      if (toOwner && t.toOwnerId !== toOwner) return false;
      if (client && workItem?.clientId !== client) return false;
      return true;
    });
  }, [
    data.transfers,
    getWorkItem,
    getMember,
    getClient,
    search,
    status,
    reason,
    fromOwner,
    toOwner,
    client,
  ]);

  const thisMonth = monthKey(todayISO());

  const stats = useMemo(() => {
    const settled = filteredTransfers.filter(
      (t) => t.status === 'Approved' || t.status === 'Completed',
    );
    const fromCounts = countBy(settled, (t) => t.fromOwnerId);
    const toCounts = countBy(settled, (t) => t.toOwnerId);

    const topOf = (counts: Map<string, number>): string => {
      let bestId = '';
      let bestCount = 0;
      counts.forEach((count, id) => {
        if (count > bestCount) {
          bestCount = count;
          bestId = id;
        }
      });
      return bestId ? (getMember(bestId)?.name.split(' ')[0] ?? '—') : '—';
    };

    return {
      total: filteredTransfers.length,
      pending: filteredTransfers.filter((t) => t.status === 'Pending').length,
      completed: filteredTransfers.filter((t) => t.status === 'Completed')
        .length,
      rejected: filteredTransfers.filter((t) => t.status === 'Rejected').length,
      mostFrom: topOf(fromCounts),
      mostTo: topOf(toCounts),
      thisMonth: filteredTransfers.filter(
        (t) => monthKey(t.transferDate) === thisMonth,
      ).length,
    };
  }, [filteredTransfers, getMember, thisMonth]);

  /* ---- charts ---- */
  const byMonthData = useMemo(() => {
    const keys = recentMonthKeys(6);
    const counts = countBy(filteredTransfers, (t) => monthKey(t.transferDate));
    return keys.map((k) => ({
      label: monthLabel(k),
      transfers: counts.get(k) ?? 0,
    }));
  }, [filteredTransfers]);

  const byMemberData = useMemo(
    () =>
      data.teamMembers
        .map((m) => ({
          label: m.name.split(' ')[0],
          from: filteredTransfers.filter((t) => t.fromOwnerId === m.id).length,
          to: filteredTransfers.filter((t) => t.toOwnerId === m.id).length,
        }))
        .filter((d) => d.from > 0 || d.to > 0),
    [data.teamMembers, filteredTransfers],
  );

  const byClientData = useMemo(
    () =>
      data.clients
        .map((c) => ({
          label: c.name.split(' ')[0],
          transfers: filteredTransfers.filter(
            (t) => getWorkItem(t.workItemId)?.clientId === c.id,
          ).length,
        }))
        .filter((d) => d.transfers > 0),
    [data.clients, filteredTransfers, getWorkItem],
  );

  const byStatusData = useMemo(
    () =>
      TRANSFER_STATUSES.map((s) => ({
        label: s,
        value: filteredTransfers.filter((t) => t.status === s).length,
        color: COLORS[transferStatusColor(s)].hex,
      })).filter((d) => d.value > 0),
    [filteredTransfers],
  );

  const byReasonData = useMemo(
    () =>
      TRANSFER_REASONS.map((r) => ({
        label: r,
        value: filteredTransfers.filter((t) => t.reason === r).length,
      })).filter((d) => d.value > 0),
    [filteredTransfers],
  );

  /* ---- exports ---- */
  const getSheets = (): ExcelSheet<unknown>[] => {
    const columns: ExportColumn<WorkTransfer>[] = [
      {
        header: 'Work Item',
        value: (t) => getWorkItem(t.workItemId)?.title ?? '',
      },
      {
        header: 'Type',
        value: (t) => getWorkItem(t.workItemId)?.type ?? '',
      },
      {
        header: 'Client',
        value: (t) =>
          getClient(getWorkItem(t.workItemId)?.clientId)?.name ?? '',
      },
      { header: 'From', value: (t) => getMember(t.fromOwnerId)?.name ?? '' },
      { header: 'To', value: (t) => getMember(t.toOwnerId)?.name ?? '' },
      {
        header: 'Requested By',
        value: (t) => getMember(t.requestedById)?.name ?? '',
      },
      {
        header: 'Approved By',
        value: (t) => getMember(t.approvedById)?.name ?? '',
      },
      { header: 'Transfer Date', value: (t) => t.transferDate },
      { header: 'Reason', value: (t) => t.reason },
      { header: 'Status', value: (t) => t.status },
      { header: 'Notes', value: (t) => t.notes },
    ];
    return [
      {
        name: 'Transfer Audit Trail',
        rows: filteredTransfers,
        columns,
      } as ExcelSheet<unknown>,
    ];
  };

  const getPptSummary = (): PptSummary => ({
    title: 'Work Transfers — Audit Trail',
    subtitle: 'Munshot OS — ownership movement across the desk',
    kpis: [
      { label: 'Total transfers', value: stats.total },
      { label: 'Pending', value: stats.pending },
      { label: 'Completed', value: stats.completed },
      { label: 'Rejected', value: stats.rejected },
      { label: 'Most transferred from', value: stats.mostFrom },
      { label: 'Most transferred to', value: stats.mostTo },
      { label: 'Transfers this month', value: stats.thisMonth },
    ],
    charts: [
      {
        title: 'Transfers by status',
        type: 'pie',
        labels: byStatusData.map((d) => d.label),
        series: [
          { name: 'Transfers', values: byStatusData.map((d) => d.value) },
        ],
      },
    ],
    tables: [
      {
        title: 'Transfer audit trail',
        headers: [
          'Work Item',
          'Client',
          'From',
          'To',
          'Reason',
          'Date',
          'Status',
        ],
        rows: filteredTransfers.map((t) => {
          const workItem = getWorkItem(t.workItemId);
          return [
            workItem?.title ?? '',
            getClient(workItem?.clientId)?.name ?? '',
            getMember(t.fromOwnerId)?.name ?? '',
            getMember(t.toOwnerId)?.name ?? '',
            t.reason,
            formatDate(t.transferDate),
            t.status,
          ];
        }),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Work Transfers"
        subtitle="Ownership audit trail — every handover across the Munshot desk"
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              filename="munshot-work-transfers"
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
            <button className="btn-primary" onClick={() => ui.addTransfer()}>
              <Plus className="h-4 w-4" /> Add Transfer
            </button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          label="Total Transfers"
          value={stats.total}
          icon={ArrowLeftRight}
          color="indigo"
        />
        <MetricCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="amber"
        />
        <MetricCard
          label="Completed"
          value={stats.completed}
          icon={CheckCheck}
          color="emerald"
        />
        <MetricCard
          label="Rejected"
          value={stats.rejected}
          icon={CircleSlash}
          color="rose"
        />
        <MetricCard
          label="Most From"
          value={stats.mostFrom}
          icon={Users}
          color="orange"
          hint="approved + completed"
        />
        <MetricCard
          label="Most To"
          value={stats.mostTo}
          icon={Users}
          color="violet"
          hint="approved + completed"
        />
        <MetricCard
          label="This Month"
          value={stats.thisMonth}
          icon={CalendarDays}
          color="cyan"
        />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search transfers, work items, interns…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Statuses',
            value: status,
            onChange: setStatus,
            options: toOptions(TRANSFER_STATUSES),
          },
          {
            key: 'reason',
            label: 'Reasons',
            value: reason,
            onChange: setReason,
            options: toOptions(TRANSFER_REASONS),
          },
          {
            key: 'fromOwner',
            label: 'From',
            value: fromOwner,
            onChange: setFromOwner,
            options: data.teamMembers.map((m) => ({
              value: m.id,
              label: m.name,
            })),
            allLabel: 'Any from-owner',
          },
          {
            key: 'toOwner',
            label: 'To',
            value: toOwner,
            onChange: setToOwner,
            options: data.teamMembers.map((m) => ({
              value: m.id,
              label: m.name,
            })),
            allLabel: 'Any to-owner',
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

      {/* Audit trail table */}
      <Panel
        title="Transfer audit trail"
        subtitle={`${filteredTransfers.length} of ${data.transfers.length} transfers`}
        icon={ListChecks}
        iconColor="indigo"
      >
        <WorkTransferTable transfers={filteredTransfers} />
      </Panel>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Transfers by month"
          subtitle="Handover volume over the last 6 months"
          icon={TrendingUp}
          iconColor="indigo"
        >
          <TrendChartView
            data={byMonthData}
            series={[{ key: 'transfers', name: 'Transfers' }]}
            height={280}
          />
        </Panel>
        <Panel
          title="By from / to intern"
          subtitle="Who is handing off vs. picking up work"
          icon={ArrowRightLeft}
          iconColor="violet"
        >
          <BarChartView
            data={byMemberData}
            series={[
              { key: 'from', name: 'Transferred out', color: COLORS.orange.hex },
              { key: 'to', name: 'Received', color: COLORS.violet.hex },
            ]}
            height={280}
          />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="By client"
          subtitle="Transfers grouped by work-item client"
          icon={BarChart3}
          iconColor="sky"
        >
          <BarChartView
            data={byClientData}
            series={[{ key: 'transfers', name: 'Transfers' }]}
            orientation="bars"
            height={300}
          />
        </Panel>
        <Panel
          title="By status"
          subtitle="Lifecycle distribution"
          icon={PieChart}
          iconColor="emerald"
        >
          <DonutChartView data={byStatusData} height={220} />
        </Panel>
        <Panel
          title="Reason breakdown"
          subtitle="Why work moves between interns"
          icon={ArrowLeftRight}
          iconColor="amber"
        >
          <BarList data={byReasonData} />
        </Panel>
      </div>
    </div>
  );
}
