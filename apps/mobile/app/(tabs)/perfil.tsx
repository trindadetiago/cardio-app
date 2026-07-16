import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Stat, Txt } from '@/components/ui/kit';
import {
  getDbStats,
  seedFakePacientes,
  seedFakeVisitas,
  wipeDados,
  wipeTudoEReseedAgent,
} from '@/src/db/dev-tools';
import { useAuth } from '@/src/features/auth/auth-context';
import { useResponsive } from '@/hooks/use-responsive';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function PerfilScreen() {
  const { session, logout } = useAuth();
  const { isTablet } = useResponsive();

  const confirmLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar sessão', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const initials = (session?.agenteNome ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        <Txt variant="h1">Perfil</Txt>

        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Txt variant="subtitle" color={colors.onPrimary}>
              {initials || '?'}
            </Txt>
          </View>
          <View style={styles.identityText}>
            <Txt variant="subtitle" numberOfLines={1}>
              {session?.agenteNome ?? '—'}
            </Txt>
            <Txt variant="caption" numberOfLines={1}>
              {session?.agenteEmail ?? '—'}
            </Txt>
            <View style={styles.rolePill}>
              <Ionicons name="medkit-outline" size={12} color={colors.primaryDark} />
              <Txt variant="caption" color={colors.primaryDark}>
                Agente de saúde
              </Txt>
            </View>
          </View>
        </Card>

        <Button title="Sair" variant="danger" onPress={confirmLogout} />

        {__DEV__ && <DevPanel />}
      </ScrollView>
    </Screen>
  );
}

function DevPanel() {
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const stats = useQuery({ queryKey: ['dev-stats'], queryFn: getDbStats, refetchOnMount: 'always' });

  const invalidateAll = () => {
    ['pacientes', 'paciente', 'visitas', 'dev-stats', 'sync'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  };

  const requireSession = (): string | null => {
    if (!session) {
      Alert.alert('Sem sessão', 'Faça login antes de usar as ferramentas de dev.');
      return null;
    }
    return session.agenteId;
  };

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    try {
      const msg = await fn();
      invalidateAll();
      Alert.alert('Pronto', msg);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const onSeedPacientes = () => {
    const agenteId = requireSession();
    if (!agenteId) return;
    run('seed-pacientes', async () => `${await seedFakePacientes(10, agenteId)} pacientes inseridos.`);
  };
  const onSeedVisitas = () => {
    const agenteId = requireSession();
    if (!agenteId) return;
    run('seed-visitas', async () => `${await seedFakeVisitas(3, agenteId)} visitas inseridas.`);
  };
  const onWipeDados = () =>
    Alert.alert('Apagar dados?', 'Remove pacientes, visitas e fila de sync.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => run('wipe', async () => { await wipeDados(); return 'Dados apagados.'; }) },
    ]);
  const onWipeTudo = () =>
    Alert.alert('Apagar tudo?', 'Remove tudo e recria o admin dev. Você será deslogado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar tudo', style: 'destructive', onPress: () => run('wipe-tudo', async () => { await wipeTudoEReseedAgent(); await logout(); return 'Banco resetado.'; }) },
    ]);

  return (
    <View style={styles.devSection}>
      <Txt variant="overline">Ferramentas de dev</Txt>
      <View style={styles.statsRow}>
        <Stat label="Pacientes" value={stats.data?.pacientes ?? '—'} />
        <Stat label="Visitas" value={stats.data?.visitas ?? '—'} />
        <Stat label="Sync pend." value={stats.data?.syncPending ?? '—'} />
      </View>
      <Button title="Adicionar 10 pacientes fake" variant="secondary" onPress={onSeedPacientes} loading={busy === 'seed-pacientes'} disabled={!!busy} />
      <Button title="Adicionar 3 visitas por paciente" variant="secondary" onPress={onSeedVisitas} loading={busy === 'seed-visitas'} disabled={!!busy} />
      <Button title="Apagar pacientes e visitas" variant="danger" onPress={onWipeDados} loading={busy === 'wipe'} disabled={!!busy} />
      <Button title="Resetar tudo (incl. agentes)" variant="danger" onPress={onWipeTudo} loading={busy === 'wipe-tudo'} disabled={!!busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  devSection: { gap: spacing.md, marginTop: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
});
