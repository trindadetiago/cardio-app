/** Contrato de sincronização entre o app (módulo de coleta) e o banco central — RF007 / UC07. */

export type SyncRecordType = 'paciente' | 'visita';
export type SyncOperation = 'insert' | 'update' | 'delete';

export type SyncMutation = {
  recordType: SyncRecordType;
  recordId: string;
  operation: SyncOperation;
  /** Registro completo (insert) ou parcial com id + updatedAt (update/delete). Chaves em camelCase. */
  payload: Record<string, unknown>;
};

export type PushRequest = {
  agenteId?: string;
  mutations: SyncMutation[];
};

export type PushResponse = {
  /** Mutações efetivamente aplicadas no servidor. */
  applied: number;
  /** Mutações ignoradas por serem mais antigas que o registro atual (last-write-wins). */
  skipped: number;
  /** Cursor monotônico do servidor após o push (use no próximo pull). */
  cursor: number;
};

export type PullResponse = {
  pacientes: Record<string, unknown>[];
  visitas: Record<string, unknown>[];
  /** Cursor monotônico: passe como `since` no próximo pull para receber apenas o que mudou. */
  cursor: number;
};

/**
 * Resolve conflitos por last-write-wins comparando `updatedAt` (ISO string).
 * Retorna true se o registro que chega deve substituir/mesclar com o atual.
 */
export function shouldApply(
  incomingUpdatedAt: string | null | undefined,
  currentUpdatedAt: string | null | undefined
): boolean {
  if (!currentUpdatedAt) return true;
  if (!incomingUpdatedAt) return false;
  return incomingUpdatedAt >= currentUpdatedAt;
}
