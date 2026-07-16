import NetInfo from '@react-native-community/netinfo';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/src/features/auth/auth-context';
import { autoPush, autoSync } from './sync-manager';
import { getPendingCount, isOnline } from './sync-service';
import { loadSyncState } from './sync-store';

export const SYNC_PENDING_QUERY_KEY = ['sync', 'pending'] as const;
export const SYNC_STATE_QUERY_KEY = ['sync', 'state'] as const;
export const SYNC_ONLINE_QUERY_KEY = ['sync', 'online'] as const;

export function usePendingCount() {
  return useQuery({ queryKey: SYNC_PENDING_QUERY_KEY, queryFn: getPendingCount, refetchInterval: 4000 });
}

export function useSyncState() {
  return useQuery({ queryKey: SYNC_STATE_QUERY_KEY, queryFn: loadSyncState });
}

export function useOnlineStatus() {
  return useQuery({ queryKey: SYNC_ONLINE_QUERY_KEY, queryFn: isOnline, refetchInterval: 5000 });
}

/**
 * Motor de sincronização automática (RFN001). Montado uma vez na área autenticada:
 *   - envia pendências ao montar e quando o app volta ao primeiro plano;
 *   - faz sync completo ao recuperar a conexão.
 * Assim a sincronização é invisível — o agente nunca precisa acioná-la.
 */
export function useAutoSync() {
  const { session } = useAuth();
  const agenteRef = useRef(session?.agenteId);
  agenteRef.current = session?.agenteId;

  // Envia pendências ao montar e ao voltar para o app.
  useEffect(() => {
    autoPush(agenteRef.current);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') autoPush(agenteRef.current);
    });
    return () => sub.remove();
  }, []);

  // Sync completo ao reconectar (transição offline -> online).
  useEffect(() => {
    let wasConnected: boolean | null = null;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected !== false;
      if (wasConnected === false && connected) autoSync(agenteRef.current);
      wasConnected = connected;
    });
    return () => unsubscribe();
  }, []);
}
