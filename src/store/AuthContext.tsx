/**
 * Client-side auth gate.
 * No backend exists (this is a localStorage app), so this is a soft sign-in
 * gate, not real security — structured so a real auth backend can slot in
 * later. The signed-in member id is persisted to localStorage so a refresh
 * keeps the session.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { TeamMember } from '@/types';
import { useStore } from '@/store/StoreContext';

const AUTH_KEY = 'munshot-os-auth-v1';

/** Password convention: lowercase full name, no spaces, then "123". */
export function expectedPassword(member: TeamMember): string {
  return `${member.name.toLowerCase().replace(/\s+/g, '')}123`;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  currentUser: TeamMember | undefined;
  login: (memberId: string, password: string) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_KEY);
    } catch {
      return null;
    }
  });

  // Derived — if the stored id no longer maps to a member (data reset/cleared),
  // currentUser is undefined and the gate falls back to the login screen.
  const currentUser = userId
    ? data.teamMembers.find((m) => m.id === userId)
    : undefined;

  const login = useCallback(
    (memberId: string, password: string): LoginResult => {
      const member = data.teamMembers.find((m) => m.id === memberId);
      if (!member) return { ok: false, error: 'Select a team member.' };
      if (password.trim() !== expectedPassword(member)) {
        return { ok: false, error: 'Incorrect password — try again.' };
      }
      try {
        localStorage.setItem(AUTH_KEY, member.id);
      } catch {
        /* storage unavailable — session stays in-memory only */
      }
      setUserId(member.id);
      return { ok: true };
    },
    [data.teamMembers],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setUserId(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, login, logout }),
    [currentUser, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
