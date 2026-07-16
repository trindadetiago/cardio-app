import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/src/features/auth/auth-context';
import { getPendingCount, isOnline, sync } from './sync-service';
import { loadSyncState } from './sync-store';

export const SYNC_PENDING_QUERY_KEY = ['sync', 'pending'] as const;
export const SYNC_STATE_QUERY_KEY = ['sync', 'state'] as const;
export const SYNC_ONLINE_QUERY_KEY = ['sync', 'online'] as const;

export function usePendingCount() {
  return useQuery({ queryKey: SYNC_PENDING_QUERY_KEY, queryFn: getPendingCount });
}

export function useSyncState() {
  return useQuery({ queryKey: SYNC_STATE_QUERY_KEY, queryFn: loadSyncState });
}

export function useOnlineStatus() {
  return useQuery({
    queryKey: SYNC_ONLINE_QUERY_KEY,
    queryFn: isOnline,
    refetchInterval: 5000,
  });
}

export function useSync() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: () => sync(session?.agenteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente'] });
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
      queryClient.invalidateQueries({ queryKey: ['sync'] });
      queryClient.invalidateQueries({ queryKey: ['dev-stats'] });
    },
  });
}

/**
 * Sincronização passiva (RFN001): dispara um sync ao detectar que o dispositivo
 * recuperou a conexão. Deve ser montado uma única vez (ex.: no layout das abas).
 */
export function usePassiveSync() {
  const syncM = useSync();
  const ref = useRef(syncM);
  ref.current = syncM;
  const wasOnline = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      if (wasOnline.current === false && online && !ref.current.isPending) {
        ref.current.mutate();
      }
      wasOnline.current = online;
    });
    return () => unsubscribe();
  }, []);
}
