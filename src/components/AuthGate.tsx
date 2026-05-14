import type { ReactNode } from 'react';
import { useAuth } from '@/store/AuthContext';
import { LoginPage } from '@/components/LoginPage';

/** Renders the login screen until a team member is signed in. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginPage />;
  return <>{children}</>;
}
