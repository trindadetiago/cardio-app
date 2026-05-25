import { eq } from 'drizzle-orm';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { db } from '@/src/db/client';
import { agentesSaude } from '@/src/db/schema';
import { login as loginService, logout as logoutService, type LoginResult } from './auth-service';
import { clearSession, loadSession, type Session } from './session-store';

async function agenteExiste(id: string): Promise<boolean> {
  const rows = await db
    .select({ id: agentesSaude.id })
    .from(agentesSaude)
    .where(eq(agentesSaude.id, id))
    .limit(1);
  return rows.length > 0;
}

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = { children: React.ReactNode; enabled: boolean };

export function AuthProvider({ children, enabled }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadSession();
        if (cancelled) return;
        if (stored && !(await agenteExiste(stored.agenteId))) {
          // Sessão sobreviveu ao DB (ex: Keychain do iOS Sim persiste reinstall).
          await clearSession();
          setSession(null);
        } else {
          setSession(stored);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const login = useCallback(async (email: string, senha: string) => {
    const result = await loginService(email, senha);
    if (result.ok) setSession(result.session);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, loading, login, logout }),
    [session, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
