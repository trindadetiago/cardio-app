import { create } from 'zustand';

import { queryClient } from '@/src/lib/query-client';
import { isOnline, pushPending, sync, type SyncResult } from './sync-service';

/**
 * Estado de UI da sincronização, compartilhado entre o indicador do cabeçalho e o Perfil.
 * A sincronização é automática — o usuário nunca precisa gerenciá-la:
 *   - push (envio) automático ao salvar dados, ao abrir o app e ao voltar para o app;
 *   - sync completo (envio + recebimento) ao reconectar e no comando manual do Perfil.
 */
type SyncUiState = {
  syncing: boolean;
  lastResult: SyncResult | null;
  lastError: string | null;
};

export const useSyncUi = create<SyncUiState>(() => ({
  syncing: false,
  lastResult: null,
  lastError: null,
}));

function invalidate() {
  ['pacientes', 'paciente', 'visitas', 'sync', 'dev-stats'].forEach((k) =>
    queryClient.invalidateQueries({ queryKey: [k] })
  );
}

let lastAutoAt = 0;

/** Envia pendências em segundo plano (silencioso). Usado por gatilhos automáticos. */
export async function autoPush(agenteId?: string): Promise<void> {
  if (useSyncUi.getState().syncing) return;
  if (Date.now() - lastAutoAt < 3000) return;
  if (!(await isOnline())) return;
  lastAutoAt = Date.now();
  useSyncUi.setState({ syncing: true, lastError: null });
  try {
    await pushPending(agenteId);
    invalidate();
  } catch {
    // silencioso: dados permanecem locais e serão reenviados depois
  } finally {
    useSyncUi.setState({ syncing: false });
  }
}

/** Sincronização completa (envio + recebimento). Usado no reconectar e no comando manual. */
export async function runSync(agenteId?: string): Promise<SyncResult> {
  if (useSyncUi.getState().syncing) {
    throw new Error('Sincronização já em andamento');
  }
  useSyncUi.setState({ syncing: true, lastError: null });
  try {
    const result = await sync(agenteId);
    useSyncUi.setState({ lastResult: result });
    invalidate();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha na sincronização';
    useSyncUi.setState({ lastError: msg });
    throw err;
  } finally {
    useSyncUi.setState({ syncing: false });
  }
}

/** Sync completo automático (silencioso) — usado ao reconectar. */
export async function autoSync(agenteId?: string): Promise<void> {
  if (useSyncUi.getState().syncing) return;
  if (!(await isOnline())) return;
  try {
    await runSync(agenteId);
  } catch {
    // silencioso
  }
}
