import { create } from 'zustand';

import { queryClient } from '@/src/lib/query-client';
import { isOnline, pushPending, sync, type SyncResult } from './sync-service';

/**
 * Estado de UI da sincronização, compartilhado entre o indicador do cabeçalho e o Perfil.
 * A sincronização é automática — o usuário nunca precisa gerenciá-la:
 *   - push (envio) automático ao salvar dados, ao abrir o app e ao voltar para o app;
 *   - sync completo (envio + recebimento) ao reconectar e no comando manual do Perfil.
 */
type PullToast = { text: string; key: number };

type SyncUiState = {
  syncing: boolean;
  lastResult: SyncResult | null;
  lastError: string | null;
  /** Última notificação de dados recebidos (para o toast). */
  pullToast: PullToast | null;
};

export const useSyncUi = create<SyncUiState>(() => ({
  syncing: false,
  lastResult: null,
  lastError: null,
  pullToast: null,
}));

function announcePull(result: SyncResult) {
  const p = result.pulledPacientes;
  const v = result.pulledVisitas;
  if (p + v === 0) return;
  let text: string;
  if (p > 0 && v > 0) text = `${p} paciente(s) e ${v} visita(s) atualizados`;
  else if (p > 0) text = `${p} paciente(s) atualizados`;
  else text = `${v} visita(s) atualizadas`;
  useSyncUi.setState({ pullToast: { text, key: Date.now() } });
}

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
  // Re-checa após o único `await` acima: fecha a janela em que um segundo
  // gatilho (foreground, reconexão, etc.) poderia passar pelas checagens
  // síncronas antes desta e disparar um push duplicado concorrente.
  if (useSyncUi.getState().syncing) return;
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
    announcePull(result);
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
