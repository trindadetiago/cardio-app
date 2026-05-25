import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { agentesSaude } from '@/src/db/schema';
import { verifySenha } from '@/src/lib/hash';
import {
  clearAttempts,
  getLockoutRemainingMs,
  MAX_ATTEMPTS,
  registerFailure,
} from './attempts-store';
import { clearSession, saveSession, type Session } from './session-store';

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'locked'; lockedUntilMs: number }
  | { ok: false; reason: 'invalid'; attemptsLeft: number };

export async function login(email: string, senha: string): Promise<LoginResult> {
  const lockoutRemaining = await getLockoutRemainingMs();
  if (lockoutRemaining > 0) {
    return { ok: false, reason: 'locked', lockedUntilMs: lockoutRemaining };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(agentesSaude)
    .where(eq(agentesSaude.email, normalizedEmail))
    .limit(1);

  const agente = rows[0];
  const valid = agente ? await verifySenha(senha, agente.senhaHash) : false;

  if (!valid || !agente) {
    const result = await registerFailure();
    if (result.lockedUntil) {
      return { ok: false, reason: 'locked', lockedUntilMs: result.lockedUntil - Date.now() };
    }
    return { ok: false, reason: 'invalid', attemptsLeft: MAX_ATTEMPTS - result.failures };
  }

  await clearAttempts();
  const session: Session = {
    agenteId: agente.id,
    agenteNome: agente.nome,
    agenteEmail: agente.email,
  };
  await saveSession(session);
  return { ok: true, session };
}

export async function logout(): Promise<void> {
  await clearSession();
}
