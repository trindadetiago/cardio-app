import { useRouter, type Href } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade, formatIsoToBR } from '@/src/lib/date';
import { usePacientes } from '@/src/features/pacientes/pacientes-hooks';
import type { Paciente } from '@/src/db/schema';

const pacienteHref = (id: string): Href => `/pacientes/${id}` as Href;

export default function PacientesScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = usePacientes();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pacientes</Text>
        <Text style={styles.count}>{data?.length ?? 0}</Text>
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
          data={data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={
            (data?.length ?? 0) === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum paciente cadastrado</Text>
              <Text style={styles.emptyMuted}>
                Toque no botão + para cadastrar o primeiro paciente.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PacienteRow paciente={item} onPress={() => router.push(pacienteHref(item.id))} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
        />
      )}

      <Pressable
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
  paciente,
  onPress,
}: {
  paciente: Paciente;
  onPress: () => void;
}) {
  const idade = calcularIdade(paciente.dataNascimento);
  const ultima = paciente.visitaMaisRecente
    ? formatIsoToBR(paciente.visitaMaisRecente)
    : 'sem visitas';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{paciente.nome}</Text>
        <Text style={styles.rowMeta}>
          {formatCpf(paciente.cpf)} · {paciente.sexo} · {idade ?? '?'} anos
        </Text>
      </View>
      <Text style={styles.rowDate}>Última: {ultima}</Text>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b00020' },
  listContent: { paddingBottom: 96 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  emptyState: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyMuted: { fontSize: 14, color: '#666', textAlign: 'center' },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: { fontSize: 16, fontWeight: '500' },
  rowMeta: { fontSize: 13, color: '#666' },
  rowDate: { fontSize: 12, color: '#999' },
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
