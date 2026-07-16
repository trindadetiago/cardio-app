import { useMemo, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RISCO_COR, RISCO_LABEL, type RiscoNivel } from '@cardio/shared';
import { compararPrioridade, descreverPrioridade } from '@/src/lib/visita-prioridade';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade } from '@/src/lib/date';
import { usePacientesComRisco } from '@/src/features/pacientes/pacientes-hooks';
import type { PacienteComRisco } from '@/src/features/pacientes/paciente-risco';
import { useResponsive } from '@/hooks/use-responsive';

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
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [ordem, setOrdem] = useState<Ordem>('prioridade');

  const lista = useMemo(() => {
    const items = data ?? [];
    const filtrada = filtro === 'todos' ? items : items.filter((i) => i.risco.nivel === filtro);
    const ordenada = [...filtrada];
    if (ordem === 'prioridade') {
      ordenada.sort((a, b) => compararPrioridade(a.prioridade, b.prioridade));
    } else {
      ordenada.sort((a, b) => a.paciente.nome.localeCompare(b.paciente.nome, 'pt-BR'));
    }
    return ordenada;
  }, [data, filtro, ordem]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} testID="pacientes-title">
          Pacientes
        </Text>
        <Text style={styles.count} testID="pacientes-count">
          {lista.length}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {FILTROS.map((f) => {
          const active = filtro === f.key;
          const cor = f.key === 'todos' ? '#0a7ea4' : RISCO_COR[f.key];
          return (
            <Pressable
              key={f.key}
              testID={`filtro-${f.key}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFiltro(f.key)}
              style={[styles.chip, active && { backgroundColor: cor, borderColor: cor }]}>
              {f.key !== 'todos' && (
                <View style={[styles.chipDot, { backgroundColor: active ? '#fff' : cor }]} />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Ordenar por</Text>
        <Pressable
          testID="sort-toggle"
          accessibilityRole="button"
          onPress={() => setOrdem((o) => (o === 'prioridade' ? 'nome' : 'prioridade'))}
          style={styles.sortButton}>
          <Text style={styles.sortButtonText}>
            {ordem === 'prioridade' ? 'Prioridade de visita' : 'Nome (A–Z)'}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Erro ao carregar: {error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(p) => p.paciente.id}
          contentContainerStyle={[
            lista.length === 0 ? styles.emptyContainer : styles.listContent,
            isTablet && styles.listContentTablet,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState} testID="pacientes-empty">
              <Text style={styles.emptyTitle}>
                {filtro === 'todos'
                  ? 'Nenhum paciente cadastrado'
                  : 'Nenhum paciente neste filtro'}
              </Text>
              <Text style={styles.emptyMuted}>
                {filtro === 'todos'
                  ? 'Toque no botão + para cadastrar o primeiro paciente.'
                  : 'Ajuste o filtro de risco para ver outros pacientes.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <PacienteRow
              index={index}
              item={item}
              onPress={() => router.push(pacienteHref(item.paciente.id))}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        />
      )}

      <Pressable
        testID="fab-novo-paciente"
        accessibilityRole="button"
        accessibilityLabel="Cadastrar paciente"
        style={styles.fab}
        onPress={() => router.push('/pacientes/novo' as Href)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function PacienteRow({
  item,
  index,
  onPress,
}: {
  item: PacienteComRisco;
  index: number;
  onPress: () => void;
}) {
  const { paciente, risco, prioridade } = item;
  const idade = calcularIdade(paciente.dataNascimento);
  const cor = RISCO_COR[risco.nivel];
  return (
    <Pressable
      testID={`paciente-row-${index}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.row}>
      <View style={[styles.riscoBar, { backgroundColor: cor }]} testID={`risco-${risco.nivel}`} />
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{paciente.nome}</Text>
        <Text style={styles.rowMeta}>
          {formatCpf(paciente.cpf)} · {paciente.sexo} · {idade ?? '?'} anos
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: `${cor}1a`, borderColor: cor }]}>
            <View style={[styles.badgeDot, { backgroundColor: cor }]} />
            <Text style={[styles.badgeText, { color: cor }]}>{RISCO_LABEL[risco.nivel]}</Text>
          </View>
          <Text style={[styles.prioridade, prioridade.atrasada && styles.prioridadeAtrasada]}>
            {descreverPrioridade(prioridade)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '700' },
  count: { fontSize: 14, color: '#666' },
  chipsRow: { paddingHorizontal: 24, gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 36,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 14, color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sortLabel: { fontSize: 13, color: '#666' },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eef3f6',
    minHeight: 32,
    justifyContent: 'center',
  },
  sortButtonText: { fontSize: 13, fontWeight: '600', color: '#0a7ea4' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b00020' },
  listContent: { paddingBottom: 96 },
  listContentTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  emptyState: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyMuted: { fontSize: 14, color: '#666', textAlign: 'center' },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riscoBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 44 },
  rowMain: { flex: 1, gap: 4 },
  rowName: { fontSize: 16, fontWeight: '500' },
  rowMeta: { fontSize: 13, color: '#666' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  prioridade: { fontSize: 12, color: '#666' },
  prioridadeAtrasada: { color: '#b00020', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#eee', marginHorizontal: 24 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '300' },
});
