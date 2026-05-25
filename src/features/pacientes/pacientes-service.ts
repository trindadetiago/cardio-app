import * as Crypto from 'expo-crypto';
import { desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { pacientes, syncQueue, type Paciente } from '@/src/db/schema';
import { onlyDigits } from '@/src/lib/cpf';
import { parseBRDate } from '@/src/lib/date';
import type { PacienteFormValues } from './paciente-schema';

export class DuplicateCpfError extends Error {
  constructor(public existing: Paciente) {
    super('Paciente já cadastrado');
    this.name = 'DuplicateCpfError';
  }
}

export async function listPacientes(): Promise<Paciente[]> {
  return db
    .select()
    .from(pacientes)
    .where(isNull(pacientes.deletedAt))
    .orderBy(desc(pacientes.updatedAt));
}

export async function findPacienteByCpf(cpf: string): Promise<Paciente | null> {
  const rows = await db
    .select()
    .from(pacientes)
    .where(eq(pacientes.cpf, onlyDigits(cpf)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findPacienteById(id: string): Promise<Paciente | null> {
  const rows = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createPaciente(
  values: PacienteFormValues,
  agenteId: string
): Promise<Paciente> {
  const cpfDigits = onlyDigits(values.cpf);
  const nascIso = parseBRDate(values.dataNascimento);
  if (!nascIso) throw new Error('Data de nascimento inválida');

  const existing = await findPacienteByCpf(cpfDigits);
  if (existing) throw new DuplicateCpfError(existing);

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const dataEventoCv =
    values.historicoCv && values.dataEventoCv ? parseBRDate(values.dataEventoCv) : null;

  const record = {
    id,
    cpf: cpfDigits,
    nome: values.nome.trim(),
    dataNascimento: nascIso,
    sexo: values.sexo,
    tabagismo: values.tabagismo,
    atividadeFisica: values.atividadeFisica,
    estatina: values.estatina,
    historicoCv: values.historicoCv,
    dataEventoCv,
    visitaMaisRecente: null,
    agenteId,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    deletedAt: null,
  };

  await db.transaction(async (tx) => {
    await tx.insert(pacientes).values(record);
    await tx.insert(syncQueue).values({
      recordType: 'paciente',
      recordId: id,
      operation: 'insert',
      payload: record,
    });
  });

  return record;
}
