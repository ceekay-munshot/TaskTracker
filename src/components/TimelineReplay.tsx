import {
  Activity,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Eye,
  GitCommit,
  Lightbulb,
  MessageSquare,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Video,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TimelineEventType } from '@/types';
import { useStore } from '@/store/StoreContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';
import { swatch, type ColorName } from '@/utils/palette';

const EVENT_META: Record<
  TimelineEventType,
  { icon: LucideIcon; color: ColorName }
> = {
  created: { icon: Sparkles, color: 'indigo' },
  stage_change: { icon: GitCommit, color: 'violet' },
  status_change: { icon: Activity, color: 'sky' },
  recording_linked: { icon: Video, color: 'fuchsia' },
  transfer_requested: { icon: ArrowLeftRight, color: 'amber' },
  transfer_approved: { icon: ArrowLeftRight, color: 'sky' },
  transfer_rejected: { icon: X, color: 'rose' },
  transfer_completed: { icon: ArrowLeftRight, color: 'emerald' },
  approval: { icon: ShieldCheck, color: 'emerald' },
  review: { icon: Eye, color: 'cyan' },
  feedback_added: { icon: MessageSquare, color: 'orange' },
  improvement_added: { icon: Lightbulb, color: 'amber' },
  task_added: { icon: CheckSquare, color: 'blue' },
  meeting_added: { icon: Calendar, color: 'teal' },
  went_live: { icon: Rocket, color: 'cyan' },
  completed: { icon: CheckCircle2, color: 'emerald' },
  note: { icon: StickyNote, color: 'slate' },
};

interface TimelineReplayProps {
  workItemId: string;
  limit?: number;
}

export function TimelineReplay({ workItemId, limit }: TimelineReplayProps) {
  const { data, getMember } = useStore();

  const events = data.timelineEvents
    .filter((e) => e.workItemId === workItemId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const shown = limit ? events.slice(-limit) : events;

  if (shown.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="No timeline events yet"
        description="Stage changes, transfers, recordings and feedback will appear here automatically."
        compact
      />
    );
  }

  return (
    <ol className="relative space-y-0.5">
      {shown.map((event, i) => {
        const meta = EVENT_META[event.eventType] ?? EVENT_META.note;
        const Icon = meta.icon;
        const s = swatch(meta.color);
        const actor = getMember(event.actorId);
        const isLast = i === shown.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3 pb-4">
            {!isLast && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-ink-200" />
            )}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                s.soft,
                s.text,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-bold text-ink-800">
                  {event.title}
                </p>
                <span className="text-[11px] text-ink-400">
                  {formatDate(event.date)}
                </span>
              </div>
              {event.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                  {event.description}
                </p>
              )}
              {actor && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Avatar
                    name={actor.name}
                    src={actor.photoUrl}
                    size="xs"
                    className="!h-5 !w-5 !text-[9px]"
                  />
                  <span className="text-[11px] font-semibold text-ink-500">
                    {actor.name}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
