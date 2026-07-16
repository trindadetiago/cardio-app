import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, formatCpf, onlyDigits } from './cpf.ts';
import { calcularImc, classificarImc } from './imc.ts';
import { parseBRDate, formatIsoToBR, calcularIdade, diffEmDias, somarDias } from './date.ts';

test('isValidCpf valida dígitos verificadores', () => {
  assert.equal(isValidCpf('529.982.247-25'), true); // CPF válido conhecido
  assert.equal(isValidCpf('111.111.111-11'), false); // repetido
  assert.equal(isValidCpf('529.982.247-24'), false); // dígito errado
  assert.equal(isValidCpf('123'), false);
});

test('formatCpf e onlyDigits', () => {
  assert.equal(formatCpf('52998224725'), '529.982.247-25');
  assert.equal(onlyDigits('529.982.247-25'), '52998224725');
});

test('calcularImc e classificarImc', () => {
  assert.equal(calcularImc(80, 1.8), 24.7);
  assert.equal(classificarImc(24.7), 'normal');
  assert.equal(classificarImc(32), 'obesidade1');
  assert.equal(calcularImc(0, 1.8), null);
});

test('parseBRDate e formatIsoToBR', () => {
  assert.equal(parseBRDate('15/03/1990'), '1990-03-15');
  assert.equal(parseBRDate('31/02/1990'), null); // data inexistente
  assert.equal(formatIsoToBR('1990-03-15'), '15/03/1990');
});

test('calcularIdade', () => {
  assert.equal(calcularIdade('1990-03-15', new Date('2026-07-15')), 36);
  assert.equal(calcularIdade('1990-08-15', new Date('2026-07-15')), 35); // ainda não fez aniversário
});

test('diffEmDias e somarDias', () => {
  assert.equal(diffEmDias('2026-07-15', '2026-07-18'), 3);
  assert.equal(diffEmDias('2026-07-18', '2026-07-15'), -3);
  assert.equal(somarDias('2026-07-15', 90), '2026-10-13');
});
