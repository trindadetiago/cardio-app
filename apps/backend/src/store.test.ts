import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CentralStore } from './store.ts';
import type { SyncMutation } from '@cardio/shared';

function paciente(id: string, updatedAt: string, extra: Record<string, unknown> = {}): SyncMutation {
  return {
    recordType: 'paciente',
    recordId: id,
    operation: 'insert',
    payload: { id, nome: 'Teste', updatedAt, ...extra },
  };
}

test('push aplica inserts e pull retorna registros', () => {
  const store = new CentralStore(':memory:');
  const r = store.push([paciente('p1', '2026-01-01T00:00:00Z')]);
  assert.equal(r.applied, 1);
  assert.equal(r.skipped, 0);

  const pull = store.pull(0);
  assert.equal(pull.pacientes.length, 1);
  assert.equal(pull.pacientes[0].id, 'p1');
  assert.equal(pull.cursor, r.cursor);
});

test('last-write-wins ignora updatedAt mais antigo', () => {
  const store = new CentralStore(':memory:');
  store.push([paciente('p1', '2026-05-01T00:00:00Z', { nome: 'Novo' })]);
  const r = store.push([paciente('p1', '2026-01-01T00:00:00Z', { nome: 'Antigo' })]);
  assert.equal(r.applied, 0);
  assert.equal(r.skipped, 1);
  const pull = store.pull(0);
  assert.equal(pull.pacientes[0].nome, 'Novo');
});

test('update parcial mescla no documento existente', () => {
  const store = new CentralStore(':memory:');
  store.push([paciente('p1', '2026-01-01T00:00:00Z', { cpf: '123', nome: 'Ana' })]);
  store.push([
    {
      recordType: 'paciente',
      recordId: 'p1',
      operation: 'update',
      payload: { id: 'p1', visitaMaisRecente: '2026-02-01', updatedAt: '2026-02-01T00:00:00Z' },
    },
  ]);
  const pull = store.pull(0);
  const p = pull.pacientes[0];
  assert.equal(p.cpf, '123'); // preservado
  assert.equal(p.nome, 'Ana'); // preservado
  assert.equal(p.visitaMaisRecente, '2026-02-01'); // aplicado
});

test('pull incremental usa cursor', () => {
  const store = new CentralStore(':memory:');
  const r1 = store.push([paciente('p1', '2026-01-01T00:00:00Z')]);
  const r2 = store.push([paciente('p2', '2026-01-02T00:00:00Z')]);
  const incremental = store.pull(r1.cursor);
  assert.equal(incremental.pacientes.length, 1);
  assert.equal(incremental.pacientes[0].id, 'p2');
  assert.equal(incremental.cursor, r2.cursor);
});

test('delete marca deletedAt', () => {
  const store = new CentralStore(':memory:');
  store.push([paciente('p1', '2026-01-01T00:00:00Z')]);
  store.push([
    {
      recordType: 'paciente',
      recordId: 'p1',
      operation: 'delete',
      payload: { id: 'p1', updatedAt: '2026-03-01T00:00:00Z', deletedAt: '2026-03-01T00:00:00Z' },
    },
  ]);
  const pull = store.pull(0);
  assert.equal(pull.pacientes[0].deletedAt, '2026-03-01T00:00:00Z');
});
