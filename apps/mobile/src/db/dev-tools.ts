import * as Crypto from 'expo-crypto';
import { count, eq } from 'drizzle-orm';

import { db } from './client';
import { agentesSaude, pacientes, syncQueue, visitas } from './schema';
import { seedDevAgent } from './seed';
import { clearSyncState } from '@/src/features/sync/sync-store';

const FIRST_NAMES = [
  'Maria',
  'José',
  'Ana',
  'João',
  'Pedro',
  'Antônio',
  'Francisco',
  'Carlos',
  'Paulo',
  'Lucas',
  'Mariana',
  'Beatriz',
  'Camila',
  'Daniela',
  'Eduardo',
  'Fernanda',
  'Gabriel',
  'Helena',
  'Isabela',
  'Juliana',
];

const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Alves',
  'Pereira',
  'Lima',
  'Gomes',
  'Costa',
  'Ribeiro',
  'Martins',
  'Carvalho',
  'Almeida',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function chance(p: number): boolean {
  return Math.random() < p;
}

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function generateValidCpf(): string {
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));
  if (digits.every((d) => d === digits[0])) return generateValidCpf();

  const calcCheck = (slice: number[], weightStart: number): number => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) sum += slice[i] * (weightStart - i);
    const rem = 11 - (sum % 11);
    return rem >= 10 ? 0 : rem;
  };

  digits.push(calcCheck(digits, 10));
  digits.push(calcCheck(digits, 11));
  return digits.join('');
}

function randomBirthDateIso(): string {
  const year = randInt(1940, 2005);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function randomVisitaDateIso(maxDaysAgo: number): string {
  const ms = Date.now() - randInt(0, maxDaysAgo) * 86_400_000;
  return new Date(ms).toISOString();
}

export type SeedSummary = {
  pacientesCriados: number;
  visitasCriadas: number;
};

export async function seedFakePacientes(quantidade: number, agenteId: string): Promise<number> {
  let created = 0;
  for (let i = 0; i < quantidade; i++) {
    const cpf = generateValidCpf();
    const nome = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
    const historicoCv = chance(0.25);
    const nascIso = randomBirthDateIso();
    const now = new Date().toISOString();
    const id = Crypto.randomUUID();
    const record = {
      id,
      cpf,
      nome,
      dataNascimento: nascIso,
      sexo: chance(0.5) ? ('M' as const) : ('F' as const),
      tabagismo: chance(0.3),
      atividadeFisica: chance(0.4),
      estatina: chance(0.35),
      historicoCv,
      dataEventoCv: historicoCv ? randomVisitaDateIso(365 * 5).slice(0, 10) : null,
      visitaMaisRecente: null,
      agenteId,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      deletedAt: null,
    };

    try {
      await db.transaction(async (tx) => {
        await tx.insert(pacientes).values(record);
        await tx.insert(syncQueue).values({
          recordType: 'paciente',
          recordId: id,
          operation: 'insert',
          payload: record,
        });
      });
      created++;
    } catch {
      // CPF collision (raro) — apenas pula este registro
    }
  }
  return created;
}

type VisitaRecord = typeof visitas.$inferInsert;

function buildFakeVisita(pacienteId: string, agenteId: string, dataIso: string): VisitaRecord {
  const peso = roundTo(rand(55, 110), 1);
  const altura = roundTo(rand(1.5, 1.9), 2);
  const imc = roundTo(peso / (altura * altura), 1);

  // Distribui severidade para exercitar o classificador de risco
  const r = Math.random();
  let sist: number;
  let dias: number;
  if (r < 0.6) {
    sist = randInt(110, 138);
    dias = randInt(70, 88);
  } else if (r < 0.9) {
    sist = randInt(140, 170);
    dias = randInt(90, 105);
  } else {
    sist = randInt(180, 210);
    dias = randInt(115, 130);
  }

  const glicemiaR = Math.random();
  const glicemia =
    glicemiaR < 0.6 ? rand(80, 99) : glicemiaR < 0.85 ? rand(100, 125) : rand(140, 220);

  const ldlR = Math.random();
  const ldl = ldlR < 0.6 ? rand(60, 99) : ldlR < 0.85 ? rand(100, 159) : rand(170, 220);

  const now = new Date().toISOString();
  return {
    id: Crypto.randomUUID(),
    pacienteId,
    agenteId,
    dataVisita: dataIso,
    peso,
    altura,
    imc,
    circunferenciaAbdominal: roundTo(rand(70, 120), 1),
    paSistolica: sist,
    paDiastolica: dias,
    frequenciaCardiaca: randInt(58, 95),
    glicemiaJejum: roundTo(glicemia, 0),
    hba1c: roundTo(rand(4.8, 9.5), 1),
    colesterolTotal: roundTo(rand(150, 280), 0),
    ldl: roundTo(ldl, 0),
    hdl: roundTo(rand(32, 75), 0),
    triglicerides: roundTo(rand(80, 320), 0),
    creatinina: roundTo(rand(0.6, 1.4), 2),
    observacoes: null,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    deletedAt: null,
  };
}

export async function seedFakeVisitas(
  visitasPorPaciente: number,
  agenteId: string
): Promise<number> {
  const todos = await db.select({ id: pacientes.id }).from(pacientes);
  if (todos.length === 0) return 0;

  let total = 0;
  for (const p of todos) {
    const dataIsos: string[] = [];
    for (let i = 0; i < visitasPorPaciente; i++) {
      dataIsos.push(randomVisitaDateIso(180));
    }
    dataIsos.sort();
    const maisRecente = dataIsos[dataIsos.length - 1];
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      for (const dataIso of dataIsos) {
        const record = buildFakeVisita(p.id, agenteId, dataIso);
        await tx.insert(visitas).values(record);
        await tx.insert(syncQueue).values({
          recordType: 'visita',
          recordId: record.id,
          operation: 'insert',
          payload: record,
        });
        total++;
      }
      await tx
        .update(pacientes)
        .set({ visitaMaisRecente: maisRecente, updatedAt: now })
        .where(eq(pacientes.id, p.id));
      // Mesma mutação parcial que createVisita (visitas-service.ts) enfileira ao
      // atualizar visitaMaisRecente — sem isso, o dado fica correto localmente mas
      // nunca chega ao backend, reaparecendo como "Sem visitas" após um resync.
      await tx.insert(syncQueue).values({
        recordType: 'paciente',
        recordId: p.id,
        operation: 'update',
        payload: { id: p.id, visitaMaisRecente: maisRecente, updatedAt: now },
      });
    });
  }
  return total;
}

export async function wipeDados(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(syncQueue);
    await tx.delete(visitas);
    await tx.delete(pacientes);
  });
  await clearSyncState();
}

export async function wipeTudoEReseedAgent(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(syncQueue);
    await tx.delete(visitas);
    await tx.delete(pacientes);
    await tx.delete(agentesSaude);
  });
  await clearSyncState();
  await seedDevAgent();
}

export type DbStats = {
  pacientes: number;
  visitas: number;
  syncPending: number;
};

export async function getDbStats(): Promise<DbStats> {
  const [p] = await db.select({ n: count() }).from(pacientes);
  const [v] = await db.select({ n: count() }).from(visitas);
  const [s] = await db.select({ n: count() }).from(syncQueue);
  return {
    pacientes: p?.n ?? 0,
    visitas: v?.n ?? 0,
    syncPending: s?.n ?? 0,
  };
}
