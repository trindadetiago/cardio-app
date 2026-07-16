import * as SecureStore from 'expo-secure-store';

const SYNC_STATE_KEY = 'cardio.sync-state';

export type SyncState = {
  /** Cursor monotônico do servidor (último `since` recebido no pull). */
  cursor: number;
  /** ISO do último sync bem-sucedido. */
  lastSyncAt: string | null;
};

const EMPTY: SyncState = { cursor: 0, lastSyncAt: null };

export async function loadSyncState(): Promise<SyncState> {
  const raw = await SecureStore.getItemAsync(SYNC_STATE_KEY);
  if (!raw) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<SyncState>) };
  } catch {
    return EMPTY;
  }
}

export async function saveSyncState(state: SyncState): Promise<void> {
  await SecureStore.setItemAsync(SYNC_STATE_KEY, JSON.stringify(state));
}

export async function clearSyncState(): Promise<void> {
  await SecureStore.deleteItemAsync(SYNC_STATE_KEY);
}
