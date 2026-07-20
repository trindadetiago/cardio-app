import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EMPTY_ATTEMPTS_STATE,
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  registerFailureAt,
  remainingLockoutMsAt,
  type AttemptsState,
} from './lockout.ts';

const NOW = Date.parse('2026-07-20T12:00:00Z');

test('não bloqueia antes da 5ª tentativa', () => {
  let state: AttemptsState = EMPTY_ATTEMPTS_STATE;
  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    state = registerFailureAt(state, NOW);
    assert.equal(state.failures, i);
    assert.equal(state.lockedUntil, null);
  }
});

test('bloqueia exatamente na 5ª tentativa por LOCKOUT_MS', () => {
  let state: AttemptsState = EMPTY_ATTEMPTS_STATE;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    state = registerFailureAt(state, NOW);
  }
  assert.equal(state.failures, MAX_ATTEMPTS);
  assert.equal(state.lockedUntil, NOW + LOCKOUT_MS);
});

test('tentativa adicional após bloqueado mantém/renova o bloqueio', () => {
  const locked: AttemptsState = { failures: MAX_ATTEMPTS, lockedUntil: NOW + 1000 };
  const next = registerFailureAt(locked, NOW);
  assert.equal(next.failures, MAX_ATTEMPTS + 1);
  assert.equal(next.lockedUntil, NOW + LOCKOUT_MS);
});

test('tempo restante decresce corretamente e nunca é negativo', () => {
  const state: AttemptsState = { failures: MAX_ATTEMPTS, lockedUntil: NOW + LOCKOUT_MS };
  assert.equal(remainingLockoutMsAt(state, NOW), LOCKOUT_MS);
  assert.equal(remainingLockoutMsAt(state, NOW + LOCKOUT_MS / 2), LOCKOUT_MS / 2);
  assert.equal(remainingLockoutMsAt(state, NOW + LOCKOUT_MS), 0);
  assert.equal(remainingLockoutMsAt(state, NOW + LOCKOUT_MS + 1), 0);
});

test('estado sem bloqueio tem tempo restante zero', () => {
  assert.equal(remainingLockoutMsAt(EMPTY_ATTEMPTS_STATE, NOW), 0);
  const someFailures: AttemptsState = { failures: 2, lockedUntil: null };
  assert.equal(remainingLockoutMsAt(someFailures, NOW), 0);
});
