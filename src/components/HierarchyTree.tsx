import { useNavigate } from 'react-router-dom';
import type { TeamMember } from '@/types';
import { useStore } from '@/store/StoreContext';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';

function MemberNode({
  member,
  onClick,
}: {
  member: TeamMember;
  onClick: () => void;
}) {
  const accent =
    member.role === 'Founder'
      ? 'from-fuchsia-500 to-pink-500'
      : member.role === 'Team Lead - Intern'
        ? 'from-brand-500 to-violet-600'
        : 'from-sky-500 to-cyan-500';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-44 flex-col items-center rounded-2xl border border-ink-200/70 bg-white p-3 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div
        className={cn('rounded-full bg-gradient-to-br p-0.5', accent)}
      >
        <Avatar name={member.name} src={member.photoUrl} size="md" />
      </div>
      <p className="mt-1.5 truncate text-sm font-bold text-ink-800 group-hover:text-brand-600">
        {member.name}
      </p>
      <p className="text-[11px] font-semibold text-ink-400">{member.role}</p>
      <p className="text-[10px] text-ink-400">{member.city}</p>
    </button>
  );
}

export function HierarchyTree() {
  const { data } = useStore();
  const navigate = useNavigate();

  const childrenOf = (id: string | null) =>
    data.teamMembers.filter((m) => m.reportsToId === id);

  const renderSubtree = (member: TeamMember, depth: number) => {
    const children = childrenOf(member.id);
    return (
      <div key={member.id} className="flex flex-col items-center">
        <MemberNode
          member={member}
          onClick={() => navigate(`/team/${member.id}`)}
        />
        {children.length > 0 && (
          <>
            <div className="h-6 w-px bg-ink-200" />
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-6">
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {depth >= 0 && (
                    <div className="-mt-6 h-6 w-px bg-ink-200" />
                  )}
                  {renderSubtree(child, depth + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const roots = childrenOf(null);

  if (roots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-400">
        No reporting hierarchy yet — add team members to build the tree.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 overflow-x-auto py-2">
      {roots.map((root) => renderSubtree(root, 0))}
    </div>
  );
}
