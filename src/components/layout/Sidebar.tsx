import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Database,
  LineChart,
  LogOut,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from '@/config/navigation';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/store/AuthContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { resetMockData, clearAllData, data } = useStore();
  const { currentUser, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();

  const totalRecords =
    data.teamMembers.length +
    data.clients.length +
    data.workItems.length +
    data.tasks.length +
    data.recordings.length +
    data.transfers.length;

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset to mock data?',
      description:
        'This replaces all current data with the original Munshot demo dataset. Any edits you have made will be lost.',
      confirmLabel: 'Reset data',
      tone: 'danger',
    });
    if (ok) {
      resetMockData();
      toast.success('Mock data restored', 'The demo dataset has been reloaded.');
      onClose();
    }
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Clear all data?',
      description:
        'This permanently removes every team member, client, work item, task, recording, transfer and feedback entry. The workflow stages are kept.',
      confirmLabel: 'Clear everything',
      tone: 'danger',
    });
    if (ok) {
      clearAllData();
      toast.success('All data cleared', 'Start fresh, or reset the mock data.');
      onClose();
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-200/70 bg-white/85 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-fuchsia-500 to-pink-500 shadow-glow">
            <LineChart className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold leading-tight text-ink-800">
              Munshot OS
            </p>
            <p className="text-[11px] font-medium text-ink-400">
              Equity Research Command
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn ml-auto lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-ink-500 hover:bg-ink-100/80 hover:text-ink-800',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative flex items-center gap-3">
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex flex-col">
                      <span className="leading-tight">{item.label}</span>
                      <span
                        className={cn(
                          'text-[10px] font-medium leading-tight',
                          isActive ? 'text-white/70' : 'text-ink-400',
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Signed-in user */}
        {currentUser && (
          <div className="border-t border-ink-200/70 p-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 p-2.5">
              <Avatar
                name={currentUser.name}
                src={currentUser.photoUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink-800">
                  {currentUser.name}
                </p>
                <p className="truncate text-[11px] text-ink-400">
                  {currentUser.role}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="icon-btn shrink-0"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Data controls */}
        <div className="border-t border-ink-200/70 p-3">
          <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            <Database className="h-3.5 w-3.5" />
            Data · {totalRecords} records
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Mock Data
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All Data
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
