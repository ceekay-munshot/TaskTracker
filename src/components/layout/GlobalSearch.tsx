import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  ListChecks,
  MessageSquare,
  Search,
  Users,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';

interface SearchResult {
  id: string;
  group: string;
  icon: LucideIcon;
  primary: string;
  secondary: string;
  run: () => void;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const { data } = useStore();
  const ui = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    data.workItems.forEach((w) => {
      if (
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.type.toLowerCase().includes(q)
      ) {
        out.push({
          id: w.id,
          group: 'Work Items',
          icon: ListChecks,
          primary: w.title,
          secondary: `${w.type} · ${w.currentStage}`,
          run: () => {
            ui.openWorkItem(w.id);
            onClose();
          },
        });
      }
    });

    data.clients.forEach((c) => {
      const pocText = c.pocs
        .map((p) => `${p.name} ${p.email}`)
        .join(' ')
        .toLowerCase();
      if (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        pocText.includes(q)
      ) {
        out.push({
          id: c.id,
          group: 'Clients',
          icon: Building2,
          primary: c.name,
          secondary: `${c.city} · ${c.pocs[0]?.name ?? 'No POC'}`,
          run: () => {
            navigate(`/clients/${c.id}`);
            onClose();
          },
        });
      }
    });

    data.teamMembers.forEach((m) => {
      if (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q))
      ) {
        out.push({
          id: m.id,
          group: 'Team',
          icon: Users,
          primary: m.name,
          secondary: `${m.role} · ${m.city}`,
          run: () => {
            navigate(`/team/${m.id}`);
            onClose();
          },
        });
      }
    });

    data.recordings.forEach((r) => {
      if (
        r.title.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      ) {
        out.push({
          id: r.id,
          group: 'Recordings',
          icon: Video,
          primary: r.title,
          secondary: r.meetingType,
          run: () => {
            navigate(`/meetings?recording=${r.id}`);
            onClose();
          },
        });
      }
    });

    data.feedback.forEach((f) => {
      if (f.feedbackText.toLowerCase().includes(q)) {
        out.push({
          id: f.id,
          group: 'Feedback',
          icon: MessageSquare,
          primary: f.feedbackText,
          secondary: `${f.source} · ${f.status}`,
          run: () => {
            if (f.workItemId) ui.openWorkItem(f.workItemId);
            else if (f.clientId) navigate(`/clients/${f.clientId}`);
            onClose();
          },
        });
      }
    });

    return out.slice(0, 24);
  }, [query, data, navigate, ui, onClose]);

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, results.length - 1)));
  }, [results.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      e.preventDefault();
      results[selected].run();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-card"
          >
            <div className="flex items-center gap-3 border-b border-ink-100 px-4">
              <Search className="h-5 w-5 shrink-0 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search work, clients, team, recordings, feedback…"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-ink-400"
              />
              <kbd className="hidden shrink-0 rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-400 sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[22rem] overflow-y-auto p-2">
              {query.trim() === '' ? (
                <p className="px-3 py-8 text-center text-sm text-ink-400">
                  Start typing to search across everything in Munshot OS.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-ink-400">
                  No matches for “{query}”.
                </p>
              ) : (
                results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.group}-${result.id}`}
                      type="button"
                      onMouseEnter={() => setSelected(index)}
                      onClick={result.run}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                        index === selected
                          ? 'bg-brand-50'
                          : 'hover:bg-ink-50',
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-fuchsia-50 text-brand-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {result.primary}
                        </p>
                        <p className="truncate text-xs text-ink-400">
                          {result.secondary}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                        {result.group}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
