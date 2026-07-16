import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularPrioridade,
  compararPrioridade,
  descreverPrioridade,
} from './visita-prioridade.ts';

const HOJE = new Date('2026-07-15T12:00:00Z');

test('controlado (verde) usa intervalo de 90 dias', () => {
  // Visita há 30 dias => faltam 60 dias.
  const p = calcularPrioridade({ visitaMaisRecente: '2026-06-15', risco: 'verde' }, HOJE);
  assert.equal(p.diasRestantes, 60);
  assert.equal(p.atrasada, false);
});

test('não controlado usa intervalo de 30 dias', () => {
  // Visita há 30 dias => vence hoje.
  const p = calcularPrioridade({ visitaMaisRecente: '2026-06-15', risco: 'vermelho' }, HOJE);
  assert.equal(p.diasRestantes, 0);
});

test('visita atrasada tem diasRestantes negativo', () => {
  const p = calcularPrioridade({ visitaMaisRecente: '2026-05-01', risco: 'amarelo' }, HOJE);
  assert.ok(p.diasRestantes !== null && p.diasRestantes < 0);
  assert.equal(p.atrasada, true);
});

test('paciente sem visita é sempre a maior prioridade', () => {
  const semVisita = calcularPrioridade({ visitaMaisRecente: null, risco: 'sem_dados' }, HOJE);
  assert.equal(semVisita.nuncaVisitado, true);
  assert.equal(semVisita.atrasada, true);
});

test('ordenação: nunca visitado, depois mais atrasado primeiro', () => {
  const nunca = calcularPrioridade({ visitaMaisRecente: null, risco: 'sem_dados' }, HOJE);
  const atrasado3 = calcularPrioridade({ visitaMaisRecente: '2026-06-12', risco: 'vermelho' }, HOJE); // vence 07-12 => -3
  const atrasado1 = calcularPrioridade({ visitaMaisRecente: '2026-06-14', risco: 'vermelho' }, HOJE); // vence 07-14 => -1
  const futuro = calcularPrioridade({ visitaMaisRecente: '2026-07-10', risco: 'verde' }, HOJE);

  const ordenado = [futuro, atrasado1, nunca, atrasado3].sort(compararPrioridade);
  assert.equal(ordenado[0], nunca);
  assert.equal(ordenado[1], atrasado3);
  assert.equal(ordenado[2], atrasado1);
  assert.equal(ordenado[3], futuro);
});

test('descrição textual bate com o documento (UC04)', () => {
  const atrasado = calcularPrioridade({ visitaMaisRecente: '2026-06-12', risco: 'vermelho' }, HOJE);
  assert.equal(descreverPrioridade(atrasado), '3 dias atrasado');
  const futuro = calcularPrioridade({ visitaMaisRecente: '2026-06-20', risco: 'verde' }, HOJE);
  assert.equal(descreverPrioridade(futuro), '65 dias para visita');
  const nunca = calcularPrioridade({ visitaMaisRecente: null, risco: 'sem_dados' }, HOJE);
  assert.equal(descreverPrioridade(nunca), 'Sem visitas');
});
