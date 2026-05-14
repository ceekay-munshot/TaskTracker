import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { NAV_ITEMS } from '@/config/navigation';
import { GlobalSearch } from './GlobalSearch';
import { GlobalQuickAdd } from '@/components/GlobalQuickAdd';

function usePageMeta() {
  const { pathname } = useLocation();
  const exact = NAV_ITEMS.find((n) => n.to === pathname);
  if (exact) return exact;
  const prefixed = NAV_ITEMS.find(
    (n) => n.to !== '/' && pathname.startsWith(n.to),
  );
  return prefixed ?? NAV_ITEMS[0];
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const meta = usePageMeta();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onMenuClick}
            className="icon-btn lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-extrabold leading-tight text-ink-800">
              {meta.label}
            </h1>
            <p className="hidden truncate text-xs text-ink-400 sm:block">
              {meta.description}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-400 transition hover:border-ink-300 hover:text-ink-600"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="hidden rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-400 sm:inline">
                ⌘K
              </kbd>
            </button>
            <GlobalQuickAdd />
          </div>
        </div>
      </header>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
