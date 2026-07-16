import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Stat, Txt } from '@/components/ui/kit';
import { useResponsive } from '@/hooks/use-responsive';
import { API_BASE_URL } from '@/src/lib/api-config';
import { formatIsoToBR } from '@/src/lib/date';
import { usePendingCount, useOnlineStatus, useSync, useSyncState } from '@/src/features/sync/sync-hooks';
import type { SyncResult } from '@/src/features/sync/sync-service';
import { colors, radius, spacing } from '@/src/theme/tokens';

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
  const lastSyncAt = syncState.data?.lastSyncAt;

  const onSync = async () => {
    setErro(null);
    setUltimo(null);
    try {
      setUltimo(await syncM.mutateAsync());
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na sincronização');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        <Txt variant="h1">Sincronização</Txt>

        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              testID="sync-status"
              style={[styles.statusDot, { backgroundColor: estaOnline ? colors.accent : colors.danger }]}
            />
            <Txt variant="subtitle">{estaOnline ? 'Online' : 'Offline'}</Txt>
          </View>
          <View style={styles.serverRow}>
            <Ionicons name="server-outline" size={14} color={colors.textMuted} />
            <Txt variant="caption">{API_BASE_URL}</Txt>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Stat testID="sync-pending" label="Pendentes" value={pendentes} />
          <Stat label="Última sync" value={lastSyncAt ? formatIsoToBR(lastSyncAt) : '—'} />
        </View>

        <Button
          testID="btn-sincronizar"
          title="Sincronizar agora"
          onPress={onSync}
          loading={syncM.isPending}
          disabled={!estaOnline}
        />

        {!estaOnline && (
          <Txt variant="caption" style={styles.center}>
            Conecte o dispositivo à internet para sincronizar com o banco central.
          </Txt>
        )}

        {ultimo && (
          <Card testID="sync-result" tone={colors.accent} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Txt variant="bodyMedium" color={colors.accent}>
                Sincronização concluída
              </Txt>
            </View>
            <Txt variant="caption">Enviados: {ultimo.pushed}</Txt>
            <Txt variant="caption">
              Recebidos: {ultimo.pulledPacientes} paciente(s), {ultimo.pulledVisitas} visita(s)
            </Txt>
          </Card>
        )}

        {erro && (
          <Card testID="sync-error" tone={colors.danger} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Txt variant="bodyMedium" color={colors.danger}>
                Não foi possível sincronizar
              </Txt>
            </View>
            <Txt variant="caption">{erro}</Txt>
          </Card>
        )}

        <Txt variant="caption" style={styles.help}>
          A sincronização envia os registros pendentes e busca atualizações do banco central
          (last-write-wins). Também ocorre automaticamente quando a conexão é restabelecida.
        </Txt>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  statusCard: { gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  serverRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  center: { textAlign: 'center' },
  resultCard: { gap: 4, borderRadius: radius.lg },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  help: { lineHeight: 19 },
});
