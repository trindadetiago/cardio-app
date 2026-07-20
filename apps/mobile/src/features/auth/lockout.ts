/**
 * Lógica pura do bloqueio por tentativas (RF001/UC01): 5 tentativas inválidas
 * bloqueiam o login por 15 minutos. Separado de attempts-store.ts (que lida com
 * I/O via expo-secure-store) para poder ser testado sem depender de módulos nativos.
 */
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export type AttemptsState = {
  failures: number;
  lockedUntil: number | null;
};

export const EMPTY_ATTEMPTS_STATE: AttemptsState = { failures: 0, lockedUntil: null };

/** Aplica uma nova tentativa inválida; bloqueia ao atingir MAX_ATTEMPTS. */
export function registerFailureAt(current: AttemptsState, now: number): AttemptsState {
  const failures = current.failures + 1;
  const lockedUntil = failures >= MAX_ATTEMPTS ? now + LOCKOUT_MS : null;
  return { failures, lockedUntil };
}

/** Tempo restante de bloqueio em ms (0 se não bloqueado ou já expirado). */
export function remainingLockoutMsAt(state: AttemptsState, now: number): number {
  if (!state.lockedUntil) return 0;
  const remaining = state.lockedUntil - now;
  return remaining > 0 ? remaining : 0;
}
