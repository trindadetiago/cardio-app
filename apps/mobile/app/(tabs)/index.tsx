import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Chip, Screen, Txt } from '@/components/ui/kit';
import { SyncIndicator } from '@/components/sync-indicator';
import { RISCO_COR, RISCO_LABEL, type RiscoNivel } from '@cardio/shared';
import { compararPrioridade, descreverPrioridade } from '@/src/lib/visita-prioridade';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade } from '@/src/lib/date';
import { usePacientesComRisco } from '@/src/features/pacientes/pacientes-hooks';
import type { PacienteComRisco } from '@/src/features/pacientes/paciente-risco';
import { useAuth } from '@/src/features/auth/auth-context';
import { runSync, useSyncUi } from '@/src/features/sync/sync-manager';
import { useResponsive } from '@/hooks/use-responsive';
import { colors, elevation, radius, spacing } from '@/src/theme/tokens';

const pacienteHref = (id: string): Href => `/pacientes/${id}` as Href;

type Filtro = 'todos' | RiscoNivel;
type Ordem = 'prioridade' | 'nome';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'verde', label: 'Controlado' },
  { key: 'amarelo', label: 'Moderado' },
  { key: 'vermelho', label: 'Grave' },
];

export default function PacientesScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = usePacientesComRisco();
  const { isTablet } = useResponsive();
  const { session } = useAuth();
  const syncing = useSyncUi((s) => s.syncing);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [ordem, setOrdem] = useState<Ordem>('prioridade');

  // Pull-to-refresh: força um sync completo (envia + recebe do banco central).
  const onPullRefresh = () => {
    runSync(session?.agenteId).catch(() => refetch());
  };

  const lista = useMemo(() => {
    const items = data ?? [];
    const filtrada = filtro === 'todos' ? items : items.filter((i) => i.risco.nivel === filtro);
    const ordenada = [...filtrada];
    if (ordem === 'prioridade') ordenada.sort((a, b) => compararPrioridade(a.prioridade, b.prioridade));
    else ordenada.sort((a, b) => a.paciente.nome.localeCompare(b.paciente.nome, 'pt-BR'));
    return ordenada;
  }, [data, filtro, ordem]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Txt variant="h1" testID="pacientes-title">
              Pacientes
            </Txt>
            <View style={styles.countPill}>
              <Txt variant="caption" color={colors.primaryDark} testID="pacientes-count" style={styles.countText}>
                {lista.length}
              </Txt>
            </View>
          </View>
          <SyncIndicator />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {FILTROS.map((f) => (
            <Chip
              key={f.key}
              testID={`filtro-${f.key}`}
              label={f.label}
              active={filtro === f.key}
              onPress={() => setFiltro(f.key)}
              color={f.key === 'todos' ? colors.primary : RISCO_COR[f.key]}
              dotColor={f.key === 'todos' ? undefined : RISCO_COR[f.key]}
            />
          ))}
        </ScrollView>

        <View style={styles.sortRow}>
          <Txt variant="caption">Ordenar por</Txt>
          <Pressable
            testID="sort-toggle"
            accessibilityRole="button"
            onPress={() => setOrdem((o) => (o === 'prioridade' ? 'nome' : 'prioridade'))}
            style={styles.sortButton}>
            <Ionicons name="swap-vertical" size={15} color={colors.primaryDark} />
            <Txt variant="caption" color={colors.primaryDark} style={styles.sortText}>
              {ordem === 'prioridade' ? 'Prioridade de visita' : 'Nome (A–Z)'}
            </Txt>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Txt variant="body" color={colors.danger}>
            Erro ao carregar: {error.message}
          </Txt>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(p) => p.paciente.id}
          style={styles.list}
          contentContainerStyle={[
            lista.length === 0 ? styles.emptyContainer : styles.listContent,
            isTablet && styles.listContentTablet,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState} testID="pacientes-empty">
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={30} color={colors.textMuted} />
              </View>
              <Txt variant="subtitle">
                {filtro === 'todos' ? 'Nenhum paciente cadastrado' : 'Nenhum paciente neste filtro'}
              </Txt>
              <Txt variant="caption" style={styles.emptyMuted}>
                {filtro === 'todos'
                  ? 'Toque no botão + para cadastrar o primeiro paciente.'
                  : 'Ajuste o filtro de risco para ver outros pacientes.'}
              </Txt>
            </View>
          }
          renderItem={({ item, index }) => (
            <PacienteRow index={index} item={item} onPress={() => router.push(pacienteHref(item.paciente.id))} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={syncing || isRefetching}
              onRefresh={onPullRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <Pressable
        testID="fab-novo-paciente"
        accessibilityRole="button"
        accessibilityLabel="Cadastrar paciente"
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={() => router.push('/pacientes/novo' as Href)}>
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>
    </Screen>
  );
}

function PacienteRow({ item, index, onPress }: { item: PacienteComRisco; index: number; onPress: () => void }) {
  const { paciente, risco, prioridade } = item;
  const idade = calcularIdade(paciente.dataNascimento);
  const cor = RISCO_COR[risco.nivel];
  return (
    <Pressable
      testID={`paciente-row-${index}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.riscoBar, { backgroundColor: cor }]} testID={`risco-${risco.nivel}`} />
      <View style={styles.rowMain}>
        <Txt variant="subtitle" numberOfLines={1}>
          {paciente.nome}
        </Txt>
        <Txt variant="caption">
          {formatCpf(paciente.cpf)} · {paciente.sexo} · {idade ?? '?'} anos
        </Txt>
        <View style={styles.badgeRow}>
          <Badge label={RISCO_LABEL[risco.nivel]} color={cor} />
          <View style={styles.prioridade}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={prioridade.atrasada ? colors.danger : colors.textMuted}
            />
            <Txt variant="caption" color={prioridade.atrasada ? colors.danger : colors.textSecondary}>
              {descreverPrioridade(prioridade)}
            </Txt>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  countPill: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: { fontVariant: ['tabular-nums'] },
  chipsRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.xxl },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryTint,
    minHeight: 32,
  },
  sortText: { fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 110 },
  listContentTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyState: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyMuted: { textAlign: 'center', maxWidth: 260 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    paddingRight: spacing.sm,
    ...elevation.card,
  },
  rowPressed: { backgroundColor: colors.surfaceAlt },
  riscoBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 52 },
  rowMain: { flex: 1, gap: 3 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  prioridade: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fab: {
    position: 'absolute',
    right: spacing.xxl,
    bottom: spacing.xxl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.fab,
  },
});
