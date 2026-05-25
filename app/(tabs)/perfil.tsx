import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDbStats,
  seedFakePacientes,
  seedFakeVisitas,
  wipeDados,
  wipeTudoEReseedAgent,
} from '@/src/db/dev-tools';
import { useAuth } from '@/src/features/auth/auth-context';

export default function PerfilScreen() {
  const { session, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.card}>
          <Field label="Nome" value={session?.agenteNome ?? '—'} />
          <Field label="E-mail" value={session?.agenteEmail ?? '—'} />
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.logoutButton}
          onPress={confirmLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>

        {__DEV__ && <DevPanel />}
      </ScrollView>
    </SafeAreaView>
  );
}

function DevPanel() {
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const stats = useQuery({
    queryKey: ['dev-stats'],
    queryFn: getDbStats,
    refetchOnMount: 'always',
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    queryClient.invalidateQueries({ queryKey: ['paciente'] });
    queryClient.invalidateQueries({ queryKey: ['visitas'] });
    queryClient.invalidateQueries({ queryKey: ['dev-stats'] });
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
    run('seed-pacientes', async () => {
      const n = await seedFakePacientes(10, agenteId);
      return `${n} pacientes inseridos.`;
    });
  };

  const onSeedVisitas = () => {
    const agenteId = requireSession();
    if (!agenteId) return;
    run('seed-visitas', async () => {
      const n = await seedFakeVisitas(3, agenteId);
      return `${n} visitas inseridas.`;
    });
  };

  const onWipeDados = () => {
    Alert.alert('Apagar dados?', 'Remove todos os pacientes, visitas e fila de sync.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () =>
          run('wipe-dados', async () => {
            await wipeDados();
            return 'Dados apagados.';
          }),
      },
    ]);
  };

  const onWipeTudo = () => {
    Alert.alert(
      'Apagar tudo?',
      'Remove pacientes, visitas, fila e agentes. Reseed do admin dev. Você será deslogado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () =>
            run('wipe-tudo', async () => {
              await wipeTudoEReseedAgent();
              await logout();
              return 'Banco resetado. Faça login novamente com admin@cardio.local / admin123.';
            }),
        },
      ]
    );
  };

  return (
    <View style={styles.devSection}>
      <Text style={styles.devTitle}>Ferramentas de dev</Text>

      <View style={styles.statsRow}>
        <StatCell label="Pacientes" value={stats.data?.pacientes} />
        <StatCell label="Visitas" value={stats.data?.visitas} />
        <StatCell label="Sync pend." value={stats.data?.syncPending} />
      </View>

      <DevButton
        label="Adicionar 10 pacientes fake"
        onPress={onSeedPacientes}
        busy={busy === 'seed-pacientes'}
        disabled={!!busy}
      />
      <DevButton
        label="Adicionar 3 visitas por paciente"
        onPress={onSeedVisitas}
        busy={busy === 'seed-visitas'}
        disabled={!!busy}
      />
      <DevButton
        label="Apagar pacientes e visitas"
        onPress={onWipeDados}
        busy={busy === 'wipe-dados'}
        disabled={!!busy}
        variant="warning"
      />
      <DevButton
        label="Resetar tudo (incl. agentes)"
        onPress={onWipeTudo}
        busy={busy === 'wipe-tudo'}
        disabled={!!busy}
        variant="danger"
      />
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: number | undefined }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DevButton({
  label,
  onPress,
  busy,
  disabled,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const base =
    variant === 'danger'
      ? styles.devButtonDanger
      : variant === 'warning'
        ? styles.devButtonWarning
        : styles.devButtonDefault;
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.devButton, base, disabled && styles.devButtonDisabled]}
      onPress={onPress}
      disabled={disabled}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.devButtonText}>{label}</Text>}
    </Pressable>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  field: { gap: 4 },
  label: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  value: { fontSize: 16 },
  logoutButton: {
    backgroundColor: '#b00020',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  devSection: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f4f6f8',
    borderWidth: 1,
    borderColor: '#dde3e8',
  },
  devTitle: { fontSize: 12, fontWeight: '700', color: '#444', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCell: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3e8ec',
  },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#666' },
  devButton: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  devButtonDefault: { backgroundColor: '#0a7ea4' },
  devButtonWarning: { backgroundColor: '#e8a93b' },
  devButtonDanger: { backgroundColor: '#b00020' },
  devButtonDisabled: { opacity: 0.5 },
  devButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
