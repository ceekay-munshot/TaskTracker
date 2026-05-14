import { useNavigate } from 'react-router-dom';
import type { MemberWorkloadStats } from '@/types';
import { useStore } from '@/store/StoreContext';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { riskColor, swatch } from '@/utils/palette';

function heatTone(value: number): string {
  if (value <= 0) return 'bg-ink-50 text-ink-300';
  if (value === 1) return 'bg-amber-50 text-amber-600';
  if (value === 2) return 'bg-amber-100 text-amber-700';
  if (value === 3) return 'bg-orange-100 text-orange-700';
  return 'bg-rose-100 text-rose-700';
}

const COLUMNS: {
  key: keyof Omit<MemberWorkloadStats, 'memberId' | 'capacityRisk'>;
  label: string;
}[] = [
  { key: 'activeWork', label: 'Active' },
  { key: 'urgentTasks', label: 'Urgent' },
  { key: 'overdueItems', label: 'Overdue' },
  { key: 'blockedWork', label: 'Blocked' },
  { key: 'pendingApprovals', label: 'Approvals' },
  { key: 'transfersReceived', label: 'Transfers In' },
];

export function WorkloadHeatmap({
  memberIds,
}: {
  memberIds?: string[];
}) {
  const { data, derived } = useStore();
  const navigate = useNavigate();

  const members = (
    memberIds
      ? data.teamMembers.filter((m) => memberIds.includes(m.id))
      : data.teamMembers
  )
    .map((m) => ({
      member: m,
      workload: derived.workloadByMember.get(m.id),
    }))
    .filter(
      (
        x,
      ): x is { member: (typeof data.teamMembers)[number]; workload: MemberWorkloadStats } =>
        Boolean(x.workload),
    )
    .sort((a, b) => b.workload.capacityRisk - a.workload.capacityRisk);

  if (members.length === 0) {
    return <EmptyState title="No team members" compact />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-y-1.5">
        <thead>
          <tr className="text-left">
            <th className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              Team member
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-1 pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-ink-400"
              >
                {col.label}
              </th>
            ))}
            <th className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              Capacity risk
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map(({ member, workload }) => {
            const rc = riskColor(workload.capacityRisk);
            const rs = swatch(rc);
            return (
              <tr
                key={member.id}
                className="cursor-pointer"
                onClick={() => navigate(`/team/${member.id}`)}
              >
                <td className="rounded-l-xl bg-white/70 px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={member.name}
                      src={member.photoUrl}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {member.name}
                      </p>
                      <p className="truncate text-[10px] text-ink-400">
                        {member.role}
                      </p>
                    </div>
                  </div>
                </td>
                {COLUMNS.map((col) => {
                  const value = workload[col.key];
                  return (
                    <td key={col.key} className="bg-white/70 px-1 py-2">
                      <div
                        className={cn(
                          'mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
                          heatTone(value),
                        )}
                      >
                        {value}
                      </div>
                    </td>
                  );
                })}
                <td className="rounded-r-xl bg-white/70 px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={cn('h-full rounded-full', rs.solid)}
                        style={{ width: `${workload.capacityRisk}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-9 shrink-0 text-right text-xs font-bold tabular-nums',
                        rs.text,
                      )}
                    >
                      {workload.capacityRisk}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
