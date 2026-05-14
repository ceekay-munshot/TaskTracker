import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Bot,
  Building2,
  CheckSquare,
  CalendarPlus,
  LayoutDashboard,
  MessageSquarePlus,
  Plus,
  UserPlus,
  Video,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useUI } from '@/store/UIContext';
import { cn } from '@/utils/cn';

interface QuickAddItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface QuickAddGroup {
  label: string;
  items: QuickAddItem[];
}

export function GlobalQuickAdd() {
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const groups: QuickAddGroup[] = [
    {
      label: 'Deliverables',
      items: [
        {
          label: 'Add Dashboard',
          icon: LayoutDashboard,
          onClick: run(() => ui.addWorkItem({ type: 'Dashboard' })),
        },
        {
          label: 'Add Agent',
          icon: Bot,
          onClick: run(() => ui.addWorkItem({ type: 'Agent' })),
        },
        {
          label: 'Add Workflow',
          icon: Workflow,
          onClick: run(() => ui.addWorkItem({ type: 'Workflow' })),
        },
      ],
    },
    {
      label: 'Activity',
      items: [
        {
          label: 'Add Task',
          icon: CheckSquare,
          onClick: run(() => ui.addTask()),
        },
        {
          label: 'Add Meeting',
          icon: CalendarPlus,
          onClick: run(() => ui.addMeeting()),
        },
        {
          label: 'Add Meeting Recording',
          icon: Video,
          onClick: run(() => ui.addRecording()),
        },
        {
          label: 'Add Feedback',
          icon: MessageSquarePlus,
          onClick: run(() => ui.addFeedback()),
        },
        {
          label: 'Transfer Work',
          icon: ArrowLeftRight,
          onClick: run(() => ui.addTransfer()),
        },
      ],
    },
    {
      label: 'Organisation',
      items: [
        {
          label: 'Add Client',
          icon: Building2,
          onClick: run(() => ui.addClient()),
        },
        {
          label: 'Add Team Member',
          icon: UserPlus,
          onClick: run(() => ui.addTeamMember()),
        },
      ],
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-primary px-3 py-2"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Quick Add</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-40 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-ink-200/80 bg-white p-2 shadow-card"
          >
            {groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-500',
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
