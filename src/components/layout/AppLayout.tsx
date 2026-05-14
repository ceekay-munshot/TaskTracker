import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  // scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-[1640px] px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="px-6 pb-8 pt-2 text-center text-xs text-ink-300">
          Munshot OS · Equity Research Delivery Operating System ·
          Munshot Technologies Private Limited
        </footer>
      </div>
    </div>
  );
}
