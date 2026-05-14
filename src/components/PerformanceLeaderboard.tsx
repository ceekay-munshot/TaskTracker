import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import type { MemberPerformanceStats } from '@/types';
import { useStore } from '@/store/StoreContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import type { ColorName } from '@/utils/palette';

const BADGE_COLOR: Record<MemberPerformanceStats['badge'], ColorName> = {
  Excellent: 'emerald',
  Strong: 'sky',
  'Needs Attention': 'amber',
  Overloaded: 'rose',
};

function scoreColor(score: number): string {
  if (score >= 78) return 'text-emerald-600';
  if (score >= 58) return 'text-sky-600';
  return 'text-amber-600';
}

export function PerformanceLeaderboard({
  memberIds,
}: {
  memberIds?: string[];
}) {
  const { data, derived } = useStore();
  const navigate = useNavigate();

  const rows = (
    memberIds
      ? data.teamMembers.filter((m) => memberIds.includes(m.id))
      : data.teamMembers
  )
    .map((member) => ({
      member,
      stats: derived.performanceByMember.get(member.id),
    }))
    .filter(
      (r): r is { member: (typeof data.teamMembers)[number]; stats: MemberPerformanceStats } =>
        Boolean(r.stats),
    )
    .sort((a, b) => b.stats.performanceScore - a.stats.performanceScore);

  if (rows.length === 0) {
    return <EmptyState title="No team members to rank" compact />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">
            <th className="px-3 pb-1">#</th>
            <th className="px-2 pb-1">Member</th>
            <th className="px-2 pb-1 text-center">Score</th>
            <th className="px-2 pb-1">Badge</th>
            <th className="px-2 pb-1 text-center">Done</th>
            <th className="px-2 pb-1 text-center">On-time</th>
            <th className="px-2 pb-1 text-center">Active</th>
            <th className="px-2 pb-1 text-center">Blocked</th>
            <th className="px-2 pb-1 text-center">In / Out</th>
            <th className="px-2 pb-1 text-center">Recs</th>
            <th className="px-2 pb-1 text-center">Health</th>
            <th className="px-2 pb-1 text-center">Demo-ready</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ member, stats }, index) => (
            <tr
              key={member.id}
              onClick={() => navigate(`/team/${member.id}`)}
              className="cursor-pointer [&>td]:bg-white/70 hover:[&>td]:bg-brand-50/60"
            >
              <td className="rounded-l-xl px-3 py-2.5">
                <div className="flex items-center gap-1">
                  {index === 0 ? (
                    <Crown className="h-4 w-4 text-amber-500" />
                  ) : (
                    <span className="w-4 text-center text-xs font-bold text-ink-400">
                      {index + 1}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={member.name}
                    src={member.photoUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-800">
                      {member.name}
                    </p>
                    <p className="truncate text-[11px] text-ink-400">
                      {member.role}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-2 py-2.5 text-center">
                <span
                  className={cn(
                    'font-display text-lg font-extrabold',
                    scoreColor(stats.performanceScore),
                  )}
                >
                  {stats.performanceScore}
                </span>
              </td>
              <td className="px-2 py-2.5">
                <Badge color={BADGE_COLOR[stats.badge]} dot>
                  {stats.badge}
                </Badge>
              </td>
              <Cell value={stats.completedWork} />
              <Cell
                value={
                  stats.completedWork === 0
                    ? '—'
                    : `${Math.round(stats.onTimeRate * 100)}%`
                }
              />
              <Cell value={stats.activeWorkload} />
              <Cell value={stats.blockedCount} danger={stats.blockedCount > 0} />
              <Cell
                value={`${stats.workReceived}/${stats.workTransferredOut}`}
              />
              <Cell value={stats.recordingsHandled} />
              <Cell value={stats.averageHealthPoints} />
              <td className="rounded-r-xl px-2 py-2.5 text-center font-bold tabular-nums text-ink-700">
                {stats.demoReadyProjects}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  value,
  danger,
}: {
  value: string | number;
  danger?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-2 py-2.5 text-center font-bold tabular-nums',
        danger ? 'text-rose-600' : 'text-ink-700',
      )}
    >
      {value}
    </td>
  );
}
