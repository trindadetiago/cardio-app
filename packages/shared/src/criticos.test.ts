import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  avaliarGlicemiaJejum,
  avaliarLdl,
  avaliarPressaoArterial,
} from './criticos.ts';

// Limiares de alerta definidos no documento de requisitos (UC05 / seção 3):
//   - PA ≥ 180/120 mmHg ou PA < 90/60 mmHg  → alerta
//   - Glicemia ≥ 250 mg/dL ou < 70 mg/dL     → alerta
//   - LDL ≥ 190 mg/dL                        → alerta

test('PA: sem valores não gera alerta', () => {
  assert.equal(avaliarPressaoArterial(null, null).severidade, 'ok');
});

test('PA: crise hipertensiva ≥180/120 é crítica', () => {
  assert.equal(avaliarPressaoArterial(180, 100).severidade, 'critico');
  assert.equal(avaliarPressaoArterial(120, 120).severidade, 'critico');
});

test('PA: hipotensão <90/60 gera alerta', () => {
  assert.notEqual(avaliarPressaoArterial(85, 55).severidade, 'ok');
});

test('PA: valores normais não geram alerta', () => {
  assert.equal(avaliarPressaoArterial(120, 80).severidade, 'ok');
});

test('Glicemia: limiar crítico do documento é 250 (não 200)', () => {
  assert.equal(avaliarGlicemiaJejum(200).severidade, 'alerta');
  assert.equal(avaliarGlicemiaJejum(249).severidade, 'alerta');
  assert.equal(avaliarGlicemiaJejum(250).severidade, 'critico');
});

test('Glicemia: hipoglicemia <70 gera alerta', () => {
  assert.notEqual(avaliarGlicemiaJejum(65).severidade, 'ok');
});

test('Glicemia: valor normal não gera alerta', () => {
  assert.equal(avaliarGlicemiaJejum(90).severidade, 'ok');
});

test('LDL: ≥190 gera alerta', () => {
  assert.notEqual(avaliarLdl(190).severidade, 'ok');
});

test('LDL: valor na meta não gera alerta', () => {
  assert.equal(avaliarLdl(100).severidade, 'ok');
});
