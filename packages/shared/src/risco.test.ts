import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classificarRisco, type ParametrosVisita } from './risco.ts';

const HOJE = new Date('2026-07-15T12:00:00Z');

const dentroDaMeta: ParametrosVisita = {
  paSistolica: 120,
  paDiastolica: 80,
  hba1c: 6.0,
  ldl: 100,
};

function comVisita(over: Partial<ParametrosVisita>): ParametrosVisita {
  return { ...dentroDaMeta, ...over };
}

test('verde: todos os parâmetros na meta e sem evento recente', () => {
  const r = classificarRisco(
    { historicoCv: false, dataEventoCv: null, ultimaVisita: dentroDaMeta },
    HOJE
  );
  assert.equal(r.nivel, 'verde');
  assert.equal(r.parametrosForaDaMeta, 0);
});

test('amarelo: 1 parâmetro fora da meta, sem histórico', () => {
  const r = classificarRisco(
    { historicoCv: false, dataEventoCv: null, ultimaVisita: comVisita({ ldl: 160 }) },
    HOJE
  );
  assert.equal(r.nivel, 'amarelo');
  assert.equal(r.parametrosForaDaMeta, 1);
});

test('amarelo: 2 parâmetros fora da meta, sem histórico', () => {
  const r = classificarRisco(
    {
      historicoCv: false,
      dataEventoCv: null,
      ultimaVisita: comVisita({ ldl: 160, hba1c: 8 }),
    },
    HOJE
  );
  assert.equal(r.nivel, 'amarelo');
  assert.equal(r.parametrosForaDaMeta, 2);
});

test('vermelho: 3 parâmetros fora da meta', () => {
  const r = classificarRisco(
    {
      historicoCv: false,
      dataEventoCv: null,
      ultimaVisita: { paSistolica: 150, paDiastolica: 95, hba1c: 8, ldl: 160 },
    },
    HOJE
  );
  assert.equal(r.nivel, 'vermelho');
  assert.equal(r.parametrosForaDaMeta, 3);
});

test('vermelho: evento cardiovascular recente (< 1 ano) sobrepõe parâmetros na meta', () => {
  const r = classificarRisco(
    { historicoCv: true, dataEventoCv: '2026-05-01', ultimaVisita: dentroDaMeta },
    HOJE
  );
  assert.equal(r.nivel, 'vermelho');
  assert.equal(r.eventoRecente, true);
});

test('evento antigo (> 1 ano) não é recente', () => {
  const r = classificarRisco(
    { historicoCv: true, dataEventoCv: '2024-01-01', ultimaVisita: dentroDaMeta },
    HOJE
  );
  assert.equal(r.eventoRecente, false);
  // Histórico presente + parâmetros na meta e evento antigo => controlado.
  assert.equal(r.nivel, 'verde');
});

test('vermelho: 1-2 fora da meta COM histórico aterosclerótico escala para grave', () => {
  const r = classificarRisco(
    { historicoCv: true, dataEventoCv: '2020-01-01', ultimaVisita: comVisita({ ldl: 160 }) },
    HOJE
  );
  assert.equal(r.nivel, 'vermelho');
});

test('sem_dados: sem visita e sem evento recente', () => {
  const r = classificarRisco(
    { historicoCv: false, dataEventoCv: null, ultimaVisita: null },
    HOJE
  );
  assert.equal(r.nivel, 'sem_dados');
});

test('PA conta como um parâmetro composto (sistólica OU diastólica fora)', () => {
  const soDiastolica = classificarRisco(
    {
      historicoCv: false,
      dataEventoCv: null,
      ultimaVisita: comVisita({ paSistolica: 120, paDiastolica: 95 }),
    },
    HOJE
  );
  assert.equal(soDiastolica.parametrosForaDaMeta, 1);
  assert.equal(soDiastolica.nivel, 'amarelo');
});

test('parâmetros ausentes não contam como fora da meta', () => {
  const r = classificarRisco(
    {
      historicoCv: false,
      dataEventoCv: null,
      ultimaVisita: { paSistolica: null, paDiastolica: null, hba1c: null, ldl: 200 },
    },
    HOJE
  );
  assert.equal(r.parametrosAvaliados, 1);
  assert.equal(r.parametrosForaDaMeta, 1);
  assert.equal(r.nivel, 'amarelo');
});
