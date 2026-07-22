import * as Crypto from 'expo-crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { pacientes, syncQueue, visitas, type Visita } from '@/src/db/schema';
import { parseBRDate } from '@/src/lib/date';
import { calcularImc } from '@/src/lib/imc';
import {
  parseOptionalNumber,
  type VisitaFormValues,
} from './visita-schema';

export async function listVisitasByPaciente(pacienteId: string): Promise<Visita[]> {
  return db
    .select()
    .from(visitas)
    .where(and(eq(visitas.pacienteId, pacienteId), isNull(visitas.deletedAt)))
    .orderBy(desc(visitas.dataVisita));
}

export async function createVisita(
  pacienteId: string,
  values: VisitaFormValues,
  agenteId: string
): Promise<Visita> {
  const dataVisitaIso = parseBRDate(values.dataVisita);
  if (!dataVisitaIso) throw new Error('Data da visita inválida');

  const peso = parseOptionalNumber(values.peso);
  const altura = parseOptionalNumber(values.altura);
  const imc = peso != null && altura != null ? calcularImc(peso, altura) : null;

  const paSistolica = parseOptionalNumber(values.paSistolica);
  const paDiastolica = parseOptionalNumber(values.paDiastolica);
  const frequenciaCardiaca = parseOptionalNumber(values.frequenciaCardiaca);

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const record = {
    id,
    pacienteId,
    agenteId,
    dataVisita: dataVisitaIso,
    peso,
    altura,
    imc,
    circunferenciaAbdominal: parseOptionalNumber(values.circunferenciaAbdominal),
    paSistolica: paSistolica != null ? Math.round(paSistolica) : null,
    paDiastolica: paDiastolica != null ? Math.round(paDiastolica) : null,
    frequenciaCardiaca: frequenciaCardiaca != null ? Math.round(frequenciaCardiaca) : null,
    glicemiaCapilar: parseOptionalNumber(values.glicemiaCapilar),
    glicemiaJejum: parseOptionalNumber(values.glicemiaJejum),
    hba1c: parseOptionalNumber(values.hba1c),
    colesterolTotal: parseOptionalNumber(values.colesterolTotal),
    ldl: parseOptionalNumber(values.ldl),
    hdl: parseOptionalNumber(values.hdl),
    triglicerides: parseOptionalNumber(values.triglicerides),
    creatinina: parseOptionalNumber(values.creatinina),
    ureia: parseOptionalNumber(values.ureia),
    tsh: parseOptionalNumber(values.tsh),
    tgo: parseOptionalNumber(values.tgo),
    tgp: parseOptionalNumber(values.tgp),
    cpk: parseOptionalNumber(values.cpk),
    relacaoAlbuminaCreatinina: parseOptionalNumber(values.relacaoAlbuminaCreatinina),
    observacoes: values.observacoes.trim() || null,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    deletedAt: null,
  };

  await db.transaction(async (tx) => {
    await tx.insert(visitas).values(record);

    const [paciente] = await tx
      .select({ visitaMaisRecente: pacientes.visitaMaisRecente })
      .from(pacientes)
      .where(eq(pacientes.id, pacienteId))
      .limit(1);

    if (
      !paciente?.visitaMaisRecente ||
      paciente.visitaMaisRecente < dataVisitaIso
    ) {
      await tx
        .update(pacientes)
        .set({ visitaMaisRecente: dataVisitaIso, updatedAt: now })
        .where(eq(pacientes.id, pacienteId));

      await tx.insert(syncQueue).values({
        recordType: 'paciente',
        recordId: pacienteId,
        operation: 'update',
        payload: { id: pacienteId, visitaMaisRecente: dataVisitaIso, updatedAt: now },
      });
    }

    await tx.insert(syncQueue).values({
      recordType: 'visita',
      recordId: id,
      operation: 'insert',
      payload: record,
    });
  });

  return record;
}
