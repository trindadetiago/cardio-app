import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/use-responsive';
import { API_BASE_URL } from '@/src/lib/api-config';
import { formatIsoToBR } from '@/src/lib/date';
import {
  usePendingCount,
  useOnlineStatus,
  useSync,
  useSyncState,
} from '@/src/features/sync/sync-hooks';
import type { SyncResult } from '@/src/features/sync/sync-service';

export default function SyncScreen() {
  const pending = usePendingCount();
  const online = useOnlineStatus();
  const syncState = useSyncState();
  const syncM = useSync();
  const { isTablet } = useResponsive();
  const [ultimo, setUltimo] = useState<SyncResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const estaOnline = online.data !== false;
  const pendentes = pending.data ?? 0;

  const onSync = async () => {
    setErro(null);
    setUltimo(null);
    try {
      const result = await syncM.mutateAsync();
      setUltimo(result);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na sincronização');
    }
  };

  const lastSyncAt = syncState.data?.lastSyncAt;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        <Text style={styles.title}>Sincronização</Text>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View
              testID="sync-status"
              style={[styles.statusDot, { backgroundColor: estaOnline ? '#2e9e5b' : '#b00020' }]}
            />
            <Text style={styles.statusText}>{estaOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <Text style={styles.serverText}>Servidor: {API_BASE_URL}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Pendentes" value={pendentes} testID="sync-pending" />
          <Stat
            label="Última sync"
            value={lastSyncAt ? formatIsoToBR(lastSyncAt) : '—'}
          />
        </View>

        <Pressable
          testID="btn-sincronizar"
          accessibilityRole="button"
          style={[
            styles.button,
            (syncM.isPending || !estaOnline) && styles.buttonDisabled,
          ]}
          onPress={onSync}
          disabled={syncM.isPending || !estaOnline}>
          {syncM.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sincronizar agora</Text>
          )}
        </Pressable>

        {!estaOnline && (
          <Text style={styles.muted}>
            Conecte o dispositivo à internet para sincronizar com o banco central.
          </Text>
        )}

        {ultimo && (
          <View style={[styles.resultCard, styles.resultOk]} testID="sync-result">
            <Text style={styles.resultTitle}>Sincronização concluída</Text>
            <Text style={styles.resultText}>Enviados: {ultimo.pushed}</Text>
            <Text style={styles.resultText}>
              Recebidos: {ultimo.pulledPacientes} paciente(s), {ultimo.pulledVisitas} visita(s)
            </Text>
          </View>
        )}

        {erro && (
          <View style={[styles.resultCard, styles.resultErr]} testID="sync-error">
            <Text style={styles.resultTitleErr}>Não foi possível sincronizar</Text>
            <Text style={styles.resultText}>{erro}</Text>
          </View>
        )}

        <Text style={styles.help}>
          A sincronização envia os registros pendentes e busca atualizações do banco central
          (last-write-wins). Também ocorre automaticamente quando a conexão é restabelecida.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, testID }: { label: string; value: string | number; testID?: string }) {
  return (
    <View style={styles.stat} testID={testID}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 16, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 16, gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusText: { fontSize: 16, fontWeight: '600' },
  serverText: { fontSize: 12, color: '#666' },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#666' },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  muted: { color: '#666', fontSize: 13, textAlign: 'center' },
  resultCard: { borderWidth: 1, borderRadius: 8, padding: 14, gap: 4 },
  resultOk: { borderColor: '#2e9e5b', backgroundColor: '#2e9e5b12' },
  resultErr: { borderColor: '#b00020', backgroundColor: '#b0002012' },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#2e9e5b' },
  resultTitleErr: { fontSize: 15, fontWeight: '700', color: '#b00020' },
  resultText: { fontSize: 14, color: '#333' },
  help: { fontSize: 12, color: '#999', lineHeight: 18 },
});
