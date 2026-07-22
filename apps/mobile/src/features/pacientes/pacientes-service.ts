import * as Crypto from 'expo-crypto';
import { desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { pacientes, syncQueue, visitas, type Paciente } from '@/src/db/schema';
import { onlyDigits } from '@/src/lib/cpf';
import { parseBRDate } from '@/src/lib/date';
import { avaliarPaciente, type PacienteComRisco } from './paciente-risco';
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

/**
 * Lista pacientes já com risco (UC03) e prioridade de visita (UC04) calculados,
 * usando os parâmetros da visita mais recente de cada paciente.
 */
export async function listPacientesComRisco(): Promise<PacienteComRisco[]> {
  const lista = await listPacientes();

  // Última visita (por data) de cada paciente, com os parâmetros de risco.
  const visitaRows = await db
    .select({
      pacienteId: visitas.pacienteId,
      dataVisita: visitas.dataVisita,
      paSistolica: visitas.paSistolica,
      paDiastolica: visitas.paDiastolica,
      hba1c: visitas.hba1c,
      ldl: visitas.ldl,
    })
    .from(visitas)
    .where(isNull(visitas.deletedAt))
    .orderBy(desc(visitas.dataVisita));

  const ultimaPorPaciente = new Map<string, (typeof visitaRows)[number]>();
  for (const v of visitaRows) {
    if (!ultimaPorPaciente.has(v.pacienteId)) ultimaPorPaciente.set(v.pacienteId, v);
  }

  const hoje = new Date();
  return lista.map((paciente) => {
    const v = ultimaPorPaciente.get(paciente.id) ?? null;
    return avaliarPaciente(
      paciente,
      v
        ? {
            dataVisita: v.dataVisita,
            paSistolica: v.paSistolica,
            paDiastolica: v.paDiastolica,
            hba1c: v.hba1c,
            ldl: v.ldl,
          }
        : null,
      hoje
    );
  });
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
    values.historicoCv !== 'nao' && values.dataEventoCv
      ? parseBRDate(values.dataEventoCv)
      : null;

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
