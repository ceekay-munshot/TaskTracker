import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  GaugeCircle,
  LayoutDashboard,
  Network,
  UserPlus,
  Users,
} from 'lucide-react';
import { MEMBER_STATUSES, TEAM_ROLES, type TeamMember } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel, SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { toOptions } from '@/components/ui/Field';
import { MemberCard } from '@/components/MemberCard';
import { HierarchyTree } from '@/components/HierarchyTree';
import { sortByKey } from '@/utils/collections';
import type { ExcelSheet, PptSummary } from '@/utils/export';

export function TeamProfiles() {
  const { data, derived } = useStore();
  const ui = useUI();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');

  const cities = useMemo(
    () =>
      sortByKey(
        Array.from(new Set(data.teamMembers.map((m) => m.city).filter(Boolean))),
        (c) => c,
      ),
    [data.teamMembers],
  );

  const activeWorkCount = useMemo(() => {
    const map = new Map<string, number>();
    data.workItems.forEach((w) => {
      if (w.status !== 'Completed') {
        map.set(w.ownerId, (map.get(w.ownerId) ?? 0) + 1);
      }
    });
    return map;
  }, [data.workItems]);

  const completedWorkCount = useMemo(() => {
    const map = new Map<string, number>();
    data.workItems.forEach((w) => {
      if (w.status === 'Completed') {
        map.set(w.ownerId, (map.get(w.ownerId) ?? 0) + 1);
      }
    });
    return map;
  }, [data.workItems]);

  const stats = useMemo(() => {
    const members = data.teamMembers;
    const active = members.filter((m) => m.status === 'Active');
    const riskValues = members.map(
      (m) => derived.workloadByMember.get(m.id)?.capacityRisk ?? 0,
    );
    const avgRisk =
      riskValues.length === 0
        ? 0
        : Math.round(
            riskValues.reduce((sum, r) => sum + r, 0) / riskValues.length,
          );
    const activeWork = data.workItems.filter(
      (w) => w.status !== 'Completed',
    ).length;
    const completedWork = data.workItems.filter(
      (w) => w.status === 'Completed',
    ).length;
    return {
      total: members.length,
      active: active.length,
      avgRisk,
      activeWork,
      completedWork,
    };
  }, [data.teamMembers, data.workItems, derived.workloadByMember]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortByKey(
      data.teamMembers.filter((m) => {
        if (q && !m.name.toLowerCase().includes(q)) return false;
        if (role && m.role !== role) return false;
        if (status && m.status !== status) return false;
        if (city && m.city !== city) return false;
        return true;
      }),
      (m) => m.name,
    );
  }, [data.teamMembers, search, role, status, city]);

  const hasActiveFilters = Boolean(search || role || status || city);
  const resetFilters = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setCity('');
  };

  const getSheets = (): ExcelSheet<unknown>[] => [
    {
      name: 'Team',
      rows: sortByKey(data.teamMembers, (m) => m.name),
      columns: [
        { header: 'Name', value: (m: TeamMember) => m.name },
        { header: 'Role', value: (m: TeamMember) => m.role },
        { header: 'City', value: (m: TeamMember) => m.city },
        { header: 'Qualification', value: (m: TeamMember) => m.qualification },
        { header: 'Status', value: (m: TeamMember) => m.status },
        { header: 'Email', value: (m: TeamMember) => m.email },
        {
          header: 'Active Work',
          value: (m: TeamMember) => activeWorkCount.get(m.id) ?? 0,
        },
        {
          header: 'Completed',
          value: (m: TeamMember) => completedWorkCount.get(m.id) ?? 0,
        },
        {
          header: 'Capacity Risk %',
          value: (m: TeamMember) =>
            derived.workloadByMember.get(m.id)?.capacityRisk ?? 0,
        },
      ],
    } as ExcelSheet<unknown>,
  ];

  const getPptSummary = (): PptSummary => ({
    title: 'Team Profiles',
    subtitle: 'Munshot OS — equity research desk roster',
    kpis: [
      { label: 'Total members', value: stats.total },
      { label: 'Active members', value: stats.active },
      { label: 'Avg capacity risk', value: `${stats.avgRisk}%` },
      { label: 'Active work items', value: stats.activeWork },
      { label: 'Completed work', value: stats.completedWork },
    ],
    tables: [
      {
        title: 'Team roster',
        headers: [
          'Name',
          'Role',
          'City',
          'Status',
          'Active',
          'Completed',
          'Capacity risk %',
        ],
        rows: sortByKey(data.teamMembers, (m) => m.name).map((m) => [
          m.name,
          m.role,
          m.city,
          m.status,
          activeWorkCount.get(m.id) ?? 0,
          completedWorkCount.get(m.id) ?? 0,
          derived.workloadByMember.get(m.id)?.capacityRisk ?? 0,
        ]),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Team Profiles"
        subtitle="The people powering the Munshot equity research desk"
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              filename="munshot-team-profiles"
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.addTeamMember()}
            >
              <UserPlus className="h-4 w-4" /> Add Team Member
            </button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Total Members"
          value={stats.total}
          icon={Users}
          color="indigo"
          hint="across the desk"
        />
        <MetricCard
          label="Active Members"
          value={stats.active}
          icon={CheckCircle2}
          color="emerald"
          sublabel={`${stats.total - stats.active} on leave / inactive`}
        />
        <MetricCard
          label="Avg Capacity Risk"
          value={`${stats.avgRisk}%`}
          icon={GaugeCircle}
          color={
            stats.avgRisk >= 75
              ? 'rose'
              : stats.avgRisk >= 50
                ? 'orange'
                : stats.avgRisk >= 28
                  ? 'amber'
                  : 'emerald'
          }
          hint="team workload pressure"
        />
        <MetricCard
          label="Active Work Items"
          value={stats.activeWork}
          icon={LayoutDashboard}
          color="violet"
          hint="owned across the team"
        />
        <MetricCard
          label="Completed Work"
          value={stats.completedWork}
          icon={CheckCircle2}
          color="cyan"
          hint="delivered all-time"
        />
      </div>

      {/* Reporting hierarchy */}
      <Panel
        title="Reporting hierarchy"
        subtitle="How the desk is organised"
        icon={Network}
        iconColor="fuchsia"
      >
        <HierarchyTree />
      </Panel>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search team members by name…',
        }}
        selects={[
          {
            key: 'role',
            label: 'Roles',
            value: role,
            onChange: setRole,
            options: toOptions(TEAM_ROLES),
          },
          {
            key: 'status',
            label: 'Statuses',
            value: status,
            onChange: setStatus,
            options: toOptions(MEMBER_STATUSES),
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

      {/* Member grid */}
      {filtered.length === 0 ? (
        <Panel padded>
          <EmptyState
            icon={Users}
            title="No team members match"
            description={
              hasActiveFilters
                ? 'Adjust the filters to see more of the desk.'
                : 'Add your first team member to get started.'
            }
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => ui.addTeamMember()}
              >
                <UserPlus className="h-4 w-4" /> Add Team Member
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
