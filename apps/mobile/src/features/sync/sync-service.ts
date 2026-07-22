import NetInfo from '@react-native-community/netinfo';
import { asc, count, eq, inArray } from 'drizzle-orm';

import {
  ATIVIDADE_FISICA_OPCOES,
  HISTORICO_CV_OPCOES,
  shouldApply,
  TABAGISMO_OPCOES,
  type PullResponse,
  type PushRequest,
  type PushResponse,
  type SyncMutation,
} from '@cardio/shared';
import { db } from '@/src/db/client';
import { pacientes, syncQueue, visitas } from '@/src/db/schema';
import { API_BASE_URL } from '@/src/lib/api-config';
import { loadSyncState, saveSyncState } from './sync-store';

export type SyncResult = {
  pushed: number;
  pulledPacientes: number;
  pulledVisitas: number;
  cursor: number;
};

const TIMEOUT_MS = 10_000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`Servidor respondeu ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    // isConnected null => desconhecido; tratamos como online para tentar.
    return state.isConnected !== false;
  } catch {
    return true;
  }
}

// Toda linha em sync_queue é, por construção, uma mutação pendente: criada ao
// enfileirar a mudança e apagada assim que o push correspondente é confirmado
// (abaixo). Não há bookkeeping de status/retry — por isso as consultas aqui
// não filtram nada, apenas leem a fila inteira.

export async function getPendingCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(syncQueue);
  return row?.n ?? 0;
}

export async function pushPending(agenteId?: string): Promise<{ pushed: number }> {
  const pendentes = await db.select().from(syncQueue).orderBy(asc(syncQueue.id));

  if (pendentes.length === 0) return { pushed: 0 };

  const mutations: SyncMutation[] = pendentes.map((q) => ({
    recordType: q.recordType,
    recordId: q.recordId,
    operation: q.operation,
    payload: q.payload as Record<string, unknown>,
  }));

  const body: PushRequest = { agenteId, mutations };
  const data = await fetchJson<PushResponse>(`${API_BASE_URL}/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const now = new Date().toISOString();
  const ids = pendentes.map((q) => q.id);
  const pacienteIds = pendentes.filter((q) => q.recordType === 'paciente').map((q) => q.recordId);
  const visitaIds = pendentes.filter((q) => q.recordType === 'visita').map((q) => q.recordId);

  await db.transaction(async (tx) => {
    await tx.delete(syncQueue).where(inArray(syncQueue.id, ids));
    if (pacienteIds.length) {
      await tx.update(pacientes).set({ syncedAt: now }).where(inArray(pacientes.id, pacienteIds));
    }
    if (visitaIds.length) {
      await tx.update(visitas).set({ syncedAt: now }).where(inArray(visitas.id, visitaIds));
    }
  });

  return { pushed: data.applied };
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function enumOr<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

async function upsertPaciente(payload: Record<string, unknown>): Promise<boolean> {
  const id = str(payload.id);
  if (!id) return false;
  const [existing] = await db
    .select({ updatedAt: pacientes.updatedAt })
    .from(pacientes)
    .where(eq(pacientes.id, id))
    .limit(1);
  if (existing && !shouldApply(payload.updatedAt as string, existing.updatedAt)) return false;

  const now = new Date().toISOString();
  const rec = {
    id,
    cpf: str(payload.cpf),
    nome: str(payload.nome),
    dataNascimento: str(payload.dataNascimento),
    sexo: (payload.sexo === 'F' ? 'F' : 'M') as 'M' | 'F',
    tabagismo: enumOr(payload.tabagismo, TABAGISMO_OPCOES, 'nao_fumante'),
    atividadeFisica: enumOr(payload.atividadeFisica, ATIVIDADE_FISICA_OPCOES, 'nao_praticante'),
    estatina: !!payload.estatina,
    historicoCv: enumOr(payload.historicoCv, HISTORICO_CV_OPCOES, 'nao'),
    dataEventoCv: (payload.dataEventoCv as string | null) ?? null,
    visitaMaisRecente: (payload.visitaMaisRecente as string | null) ?? null,
    agenteId: str(payload.agenteId),
    createdAt: str(payload.createdAt, now),
    updatedAt: str(payload.updatedAt, now),
    syncedAt: now,
    deletedAt: (payload.deletedAt as string | null) ?? null,
  };

  await db.insert(pacientes).values(rec).onConflictDoUpdate({ target: pacientes.id, set: rec });
  return true;
}

async function upsertVisita(payload: Record<string, unknown>): Promise<boolean> {
  const id = str(payload.id);
  if (!id) return false;
  const [existing] = await db
    .select({ updatedAt: visitas.updatedAt })
    .from(visitas)
    .where(eq(visitas.id, id))
    .limit(1);
  if (existing && !shouldApply(payload.updatedAt as string, existing.updatedAt)) return false;

  const now = new Date().toISOString();
  const rec = {
    id,
    pacienteId: str(payload.pacienteId),
    agenteId: str(payload.agenteId),
    dataVisita: str(payload.dataVisita),
    peso: num(payload.peso),
    altura: num(payload.altura),
    imc: num(payload.imc),
    circunferenciaAbdominal: num(payload.circunferenciaAbdominal),
    paSistolica: num(payload.paSistolica),
    paDiastolica: num(payload.paDiastolica),
    frequenciaCardiaca: num(payload.frequenciaCardiaca),
    glicemiaCapilar: num(payload.glicemiaCapilar),
    glicemiaJejum: num(payload.glicemiaJejum),
    hba1c: num(payload.hba1c),
    colesterolTotal: num(payload.colesterolTotal),
    ldl: num(payload.ldl),
    hdl: num(payload.hdl),
    triglicerides: num(payload.triglicerides),
    creatinina: num(payload.creatinina),
    ureia: num(payload.ureia),
    tsh: num(payload.tsh),
    tgo: num(payload.tgo),
    tgp: num(payload.tgp),
    cpk: num(payload.cpk),
    relacaoAlbuminaCreatinina: num(payload.relacaoAlbuminaCreatinina),
    observacoes: (payload.observacoes as string | null) ?? null,
    createdAt: str(payload.createdAt, now),
    updatedAt: str(payload.updatedAt, now),
    syncedAt: now,
    deletedAt: (payload.deletedAt as string | null) ?? null,
  };

  await db.insert(visitas).values(rec).onConflictDoUpdate({ target: visitas.id, set: rec });
  return true;
}

async function pullChanges(): Promise<{ pac: number; vis: number; cursor: number }> {
  const { cursor } = await loadSyncState();
  const data = await fetchJson<PullResponse>(`${API_BASE_URL}/sync/pull?since=${cursor}`);

  let pac = 0;
  let vis = 0;
  for (const p of data.pacientes) {
    try {
      if (await upsertPaciente(p)) pac++;
    } catch {
      // Registro incompatível (ex.: agente inexistente localmente) — ignora e segue.
    }
  }
  for (const v of data.visitas) {
    try {
      if (await upsertVisita(v)) vis++;
    } catch {
      // ignora registro problemático
    }
  }
  return { pac, vis, cursor: data.cursor };
}

/**
 * Sincronização completa (UC07): envia pendências e busca alterações do servidor.
 * Requer conexão; lança erro se offline ou em falha de rede, sem perder dados locais.
 */
export async function sync(agenteId?: string): Promise<SyncResult> {
  if (!(await isOnline())) {
    throw new Error('Sem conexão. Não é possível sincronizar agora.');
  }
  const push = await pushPending(agenteId);
  const pull = await pullChanges();
  await saveSyncState({ cursor: pull.cursor, lastSyncAt: new Date().toISOString() });
  return {
    pushed: push.pushed,
    pulledPacientes: pull.pac,
    pulledVisitas: pull.vis,
    cursor: pull.cursor,
  };
}
