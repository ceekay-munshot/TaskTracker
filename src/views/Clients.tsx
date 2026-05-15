import { useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Video,
} from 'lucide-react';
import { CLIENT_STATUSES } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { toOptions } from '@/components/ui/Field';
import { ClientCard } from '@/components/ClientCard';
import { isBacklogFeedback } from '@/utils/improvements';
import { average, sortByKey } from '@/utils/collections';
import type { Client } from '@/types';
import type { ExcelSheet, PptSummary } from '@/utils/export';

export function Clients() {
  const { data } = useStore();
  const ui = useUI();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');

  const cities = useMemo(
    () =>
      sortByKey(
        Array.from(new Set(data.clients.map((c) => c.city).filter(Boolean))),
        (c) => c,
      ),
    [data.clients],
  );

  /* per-client roll-ups, reused by cards, KPIs and exports */
  const metricsByClient = useMemo(() => {
    const map = new Map<
      string,
      {
        activeWork: number;
        feedbackPending: number;
        recordings: number;
      }
    >();
    data.clients.forEach((c) => {
      const work = data.workItems.filter((w) => w.clientId === c.id);
      map.set(c.id, {
        activeWork: work.filter((w) => w.status !== 'Completed').length,
        feedbackPending: data.feedback.filter(
          (f) => f.clientId === c.id && isBacklogFeedback(f),
        ).length,
        recordings: data.recordings.filter((r) => r.clientId === c.id).length,
      });
    });
    return map;
  }, [data.clients, data.workItems, data.feedback, data.recordings]);

  const stats = useMemo(() => {
    const clients = data.clients;
    const totalActiveWork = data.workItems.filter(
      (w) => w.status !== 'Completed',
    ).length;
    const totalFeedbackPending = data.feedback.filter(isBacklogFeedback).length;
    return {
      total: clients.length,
      active: clients.filter((c) => c.status === 'Active').length,
      totalActiveWork,
      totalFeedbackPending,
      totalRecordings: data.recordings.length,
      avgImportance:
        clients.length === 0
          ? 0
          : Math.round(
              average(clients.map((c) => c.importanceScore)) * 10,
            ) / 10,
    };
  }, [data.clients, data.workItems, data.feedback, data.recordings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortByKey(
      data.clients.filter((c) => {
        if (q && !c.name.toLowerCase().includes(q)) return false;
        if (status && c.status !== status) return false;
        if (city && c.city !== city) return false;
        return true;
      }),
      (c) => c.name,
    );
  }, [data.clients, search, status, city]);

  const hasActiveFilters = Boolean(search || status || city);
  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setCity('');
  };

  const getSheets = (): ExcelSheet<unknown>[] => {
    const clientSheet: ExcelSheet<Client> = {
      name: 'Clients',
      rows: sortByKey(data.clients, (c) => c.name),
      columns: [
        { header: 'Name', value: (c) => c.name },
        { header: 'City', value: (c) => c.city },
        { header: 'Status', value: (c) => c.status },
        {
          header: 'Points of Contact',
          value: (c) =>
            c.pocs.map((p) => (p.role ? `${p.name} (${p.role})` : p.name)).join('; '),
        },
        {
          header: 'POC Emails',
          value: (c) => c.pocs.map((p) => p.email).filter(Boolean).join('; '),
        },
        { header: 'Importance Score', value: (c) => c.importanceScore },
        {
          header: 'Active Work',
          value: (c) => metricsByClient.get(c.id)?.activeWork ?? 0,
        },
        {
          header: 'Feedback Pending',
          value: (c) => metricsByClient.get(c.id)?.feedbackPending ?? 0,
        },
        {
          header: 'Recordings',
          value: (c) => metricsByClient.get(c.id)?.recordings ?? 0,
        },
      ],
    };
    return [clientSheet as ExcelSheet<unknown>];
  };

  const getPptSummary = (): PptSummary => ({
    title: 'Clients',
    subtitle: 'Munshot OS — equity research client portfolio',
    kpis: [
      { label: 'Total clients', value: stats.total },
      { label: 'Active clients', value: stats.active },
      { label: 'Active work items', value: stats.totalActiveWork },
      { label: 'Feedback pending', value: stats.totalFeedbackPending },
      { label: 'Meeting recordings', value: stats.totalRecordings },
      { label: 'Avg importance', value: `${stats.avgImportance}/10` },
    ],
    tables: [
      {
        title: 'Client portfolio',
        headers: [
          'Client',
          'City',
          'Status',
          'Importance',
          'Active work',
          'Feedback pending',
          'Recordings',
        ],
        rows: sortByKey(data.clients, (c) => c.name).map((c) => {
          const m = metricsByClient.get(c.id);
          return [
            c.name,
            c.city,
            c.status,
            `${c.importanceScore}/10`,
            m?.activeWork ?? 0,
            m?.feedbackPending ?? 0,
            m?.recordings ?? 0,
          ];
        }),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Clients"
        subtitle="The equity research clients served by the Munshot desk"
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              filename="munshot-clients"
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.addClient()}
            >
              <UserPlus className="h-4 w-4" /> Add Client
            </button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Clients"
          value={stats.total}
          icon={Building2}
          color="indigo"
          hint="across the portfolio"
        />
        <MetricCard
          label="Active Clients"
          value={stats.active}
          icon={Building2}
          color="emerald"
          sublabel={`${stats.total - stats.active} prospect / on hold / churned`}
        />
        <MetricCard
          label="Active Work"
          value={stats.totalActiveWork}
          icon={LayoutDashboard}
          color="violet"
          hint="dashboards · agents · workflows"
        />
        <MetricCard
          label="Feedback Pending"
          value={stats.totalFeedbackPending}
          icon={MessageSquare}
          color="orange"
          hint="open improvement backlog"
        />
        <MetricCard
          label="Meeting Recordings"
          value={stats.totalRecordings}
          icon={Video}
          color="fuchsia"
          hint="captured across clients"
        />
        <MetricCard
          label="Avg Importance"
          value={`${stats.avgImportance}/10`}
          icon={Gauge}
          color="cyan"
          hint="portfolio strategic weight"
        />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search clients by name…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Statuses',
            value: status,
            onChange: setStatus,
            options: toOptions(CLIENT_STATUSES),
          },
          {
            key: 'city',
            label: 'Cities',
            value: city,
            onChange: setCity,
            options: toOptions(cities),
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {/* Client grid */}
      {filtered.length === 0 ? (
        <Panel padded>
          <EmptyState
            icon={Briefcase}
            title="No clients match"
            description={
              hasActiveFilters
                ? 'Adjust the filters to see more of the portfolio.'
                : 'Add your first client to start tracking delivery.'
            }
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => ui.addClient()}
              >
                <UserPlus className="h-4 w-4" /> Add Client
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}
