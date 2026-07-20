import * as SecureStore from 'expo-secure-store';

import {
  EMPTY_ATTEMPTS_STATE,
  registerFailureAt,
  remainingLockoutMsAt,
  type AttemptsState,
} from './lockout';

export { MAX_ATTEMPTS, LOCKOUT_MS } from './lockout';

const ATTEMPTS_KEY = 'cardio.login-attempts';

async function read(): Promise<AttemptsState> {
  const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY);
  if (!raw) return EMPTY_ATTEMPTS_STATE;
  try {
    return JSON.parse(raw) as AttemptsState;
  } catch {
    return EMPTY_ATTEMPTS_STATE;
  }
}

async function write(state: AttemptsState): Promise<void> {
  await SecureStore.setItemAsync(ATTEMPTS_KEY, JSON.stringify(state));
}

export async function getLockoutRemainingMs(): Promise<number> {
  const current = await read();
  return remainingLockoutMsAt(current, Date.now());
}

export async function registerFailure(): Promise<AttemptsState> {
  const current = await read();
  const next = registerFailureAt(current, Date.now());
  await write(next);
  return next;
}

export async function clearAttempts(): Promise<void> {
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}
