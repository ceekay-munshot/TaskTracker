import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Database, LineChart, LogIn } from 'lucide-react';
import type { TeamRole } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/store/AuthContext';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';

const ROLE_ORDER: Record<TeamRole, number> = {
  Founder: 0,
  'Team Lead - Intern': 1,
  'Equity Research Intern': 2,
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-fuchsia-500 to-pink-500 shadow-glow">
        <LineChart className="h-5.5 w-5.5 text-white" style={{ height: 22, width: 22 }} />
      </div>
      <div>
        <p className="font-display text-lg font-extrabold leading-tight text-ink-800">
          Munshot OS
        </p>
        <p className="text-[11px] font-medium text-ink-400">
          Equity Research Command
        </p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { data, resetMockData } = useStore();
  const { login } = useAuth();

  const members = useMemo(
    () =>
      [...data.teamMembers].sort((a, b) => {
        const r = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
        return r !== 0 ? r : a.name.localeCompare(b.name);
      }),
    [data.teamMembers],
  );

  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(memberId, password);
    if (!result.ok) setError(result.error ?? 'Sign in failed.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        className="card w-full max-w-md overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-500 via-fuchsia-500 to-pink-500" />
        <div className="p-6 sm:p-8">
          <Brand />

          {members.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Database}
                title="No team members yet"
                description="The data has been cleared. Load the Munshot demo dataset to sign in."
                action={
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={resetMockData}
                  >
                    <Database className="h-4 w-4" /> Load demo data
                  </button>
                }
              />
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <h1 className="font-display text-xl font-extrabold text-ink-800">
                  Sign in
                </h1>
                <p className="mt-0.5 text-sm text-ink-400">
                  Equity Research Delivery Operating System
                </p>
              </div>

              <Field label="Team member" required>
                <Select
                  value={memberId}
                  onChange={(v) => {
                    setMemberId(v);
                    setError('');
                  }}
                  options={members.map((m) => ({
                    value: m.id,
                    label: `${m.name} · ${m.role}`,
                  }))}
                />
              </Field>

              <Field label="Password" required error={error || undefined}>
                <TextInput
                  type="password"
                  value={password}
                  invalid={!!error}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
              </Field>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                <LogIn className="h-4 w-4" /> Sign in
              </button>

              <p className="text-center text-[11px] text-ink-400">
                Password is your full name in lowercase, no spaces, followed
                by <span className="font-semibold text-ink-500">123</span>.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
