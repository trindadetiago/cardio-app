import * as SecureStore from 'expo-secure-store';

const ATTEMPTS_KEY = 'cardio.login-attempts';

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

type AttemptsState = {
  failures: number;
  lockedUntil: number | null;
};

const EMPTY: AttemptsState = { failures: 0, lockedUntil: null };

async function read(): Promise<AttemptsState> {
  const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY);
  if (!raw) return EMPTY;
  try {
    return JSON.parse(raw) as AttemptsState;
  } catch {
    return EMPTY;
  }
}

async function write(state: AttemptsState): Promise<void> {
  await SecureStore.setItemAsync(ATTEMPTS_KEY, JSON.stringify(state));
}

export async function getLockoutRemainingMs(): Promise<number> {
  const { lockedUntil } = await read();
  if (!lockedUntil) return 0;
  const remaining = lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function registerFailure(): Promise<{ failures: number; lockedUntil: number | null }> {
  const current = await read();
  const failures = current.failures + 1;
  const lockedUntil = failures >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null;
  const next: AttemptsState = { failures, lockedUntil };
  await write(next);
  return next;
}

export async function clearAttempts(): Promise<void> {
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}
