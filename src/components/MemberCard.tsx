import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  Briefcase,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TeamMember } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { MemberStatusBadge } from '@/components/ui/Badge';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/utils/cn';
import { timeSince } from '@/utils/dates';
import { riskColor } from '@/utils/palette';

export function MemberCard({ member }: { member: TeamMember }) {
  const { data, derived } = useStore();
  const ui = useUI();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const { deleteTeamMember } = useStore();

  const owned = data.workItems.filter((w) => w.ownerId === member.id);
  const activeWork = owned.filter((w) => w.status !== 'Completed').length;
  const completedWork = owned.filter((w) => w.status === 'Completed').length;
  const transferIn = data.transfers.filter(
    (t) =>
      t.toOwnerId === member.id &&
      (t.status === 'Approved' || t.status === 'Completed'),
  ).length;
  const transferOut = data.transfers.filter(
    (t) =>
      t.fromOwnerId === member.id &&
      (t.status === 'Approved' || t.status === 'Completed'),
  ).length;
  const recordings = data.recordings.filter(
    (r) => r.ownerId === member.id,
  ).length;
  const workload = derived.workloadByMember.get(member.id);
  const risk = workload?.capacityRisk ?? 0;
  const manager = data.teamMembers.find((m) => m.id === member.reportsToId);

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete ${member.name}?`,
      description: `This removes the team member profile. Their ${owned.length} work item(s) will show as unassigned. This cannot be undone.`,
      confirmLabel: 'Delete member',
      tone: 'danger',
    });
    if (ok) {
      deleteTeamMember(member.id);
      toast.success('Team member deleted', member.name);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="card card-hover flex cursor-pointer flex-col p-4"
      onClick={() => navigate(`/team/${member.id}`)}
    >
      <div className="flex items-start gap-3">
        <Avatar name={member.name} src={member.photoUrl} size="lg" ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-base font-extrabold text-ink-800">
              {member.name}
            </p>
            <MemberStatusBadge status={member.status} />
          </div>
          <p className="truncate text-xs font-semibold text-brand-600">
            {member.role}
          </p>
          <p className="truncate text-xs text-ink-400">
            {member.city} · {member.qualification}
          </p>
        </div>
        <ActionMenu
          actions={[
            {
              label: 'View profile',
              icon: Eye,
              onClick: () => navigate(`/team/${member.id}`),
            },
            {
              label: 'Edit member',
              icon: Pencil,
              onClick: () => ui.editTeamMember(member),
            },
            {
              label: 'Delete member',
              icon: Trash2,
              tone: 'danger',
              onClick: handleDelete,
            },
          ]}
        />
      </div>

      {member.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {member.expertise.slice(0, 3).map((e) => (
            <span
              key={e}
              className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500"
            >
              {e}
            </span>
          ))}
          {member.expertise.length > 3 && (
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
              +{member.expertise.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-ink-100 pt-3">
        <Stat icon={Briefcase} label="Active" value={activeWork} />
        <Stat icon={CheckCircle2} label="Done" value={completedWork} />
        <Stat
          icon={ArrowDownLeft}
          label="In / Out"
          value={`${transferIn}/${transferOut}`}
        />
        <Stat icon={Video} label="Recs" value={recordings} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
          <span className="text-ink-400">Workload pressure</span>
          <span className={cn('tabular-nums')}>{risk}%</span>
        </div>
        <ProgressBar value={risk} color={riskColor(risk)} size="sm" />
      </div>

      <p className="mt-3 text-[11px] text-ink-400">
        {timeSince(member.joinDate)} on the desk
        {manager ? ` · reports to ${manager.name}` : ' · founder'}
      </p>
    </motion.div>
  );
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-ink-300" />
      <p className="mt-0.5 font-display text-sm font-extrabold text-ink-800">
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>
    </div>
  );
}
