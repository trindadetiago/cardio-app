import { useMemo, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EvolucaoChart } from '@/components/evolucao-chart';
import { useResponsive } from '@/hooks/use-responsive';
import { usePaciente } from '@/src/features/pacientes/pacientes-hooks';
import { useVisitasByPaciente } from '@/src/features/visitas/visitas-hooks';
import { construirSeries } from '@/src/features/visitas/metricas';
import { formatIsoToBR } from '@/src/lib/date';

type Modo = 'grafico' | 'tabela';

export default function EvolucaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: paciente } = usePaciente(id ?? '');
  const { data: visitas, isLoading } = useVisitasByPaciente(id ?? '');
  const { isTablet } = useResponsive();
  const [modo, setModo] = useState<Modo>('grafico');
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  const series = useMemo(() => construirSeries(visitas ?? []), [visitas]);
  const seriesVisiveis = series.filter((s) => !ocultas.has(s.key));

  // Tabela: uma linha por data (mais recente primeiro), colunas = métricas com dados.
  const linhasTabela = useMemo(() => {
    const ordenadas = [...(visitas ?? [])].sort((a, b) => b.dataVisita.localeCompare(a.dataVisita));
    return ordenadas;
  }, [visitas]);

  const toggleMetrica = (key: string) => {
    setOcultas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const semDados = series.length === 0;

  return (
    <>
      <Stack.Screen options={{ title: paciente ? `Evolução — ${paciente.nome}` : 'Evolução' }} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        <View style={styles.toggleRow} testID="evolucao-modo">
          <ModoButton label="Gráfico" active={modo === 'grafico'} onPress={() => setModo('grafico')} />
          <ModoButton label="Tabela" active={modo === 'tabela'} onPress={() => setModo('tabela')} />
        </View>

        {semDados ? (
          <View style={styles.emptyState} testID="evolucao-empty">
            <Text style={styles.emptyTitle}>Sem dados para exibir</Text>
            <Text style={styles.emptyMuted}>
              Registre visitas com medições para visualizar a evolução.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.hint}>Toque nas métricas para mostrar/ocultar.</Text>
            <View style={styles.chips}>
              {series.map((s) => {
                const ativo = !ocultas.has(s.key);
                return (
                  <Pressable
                    key={s.key}
                    testID={`metrica-${s.key}`}
                    onPress={() => toggleMetrica(s.key)}
                    accessibilityState={{ selected: ativo }}
                    style={[
                      styles.chip,
                      { borderColor: s.color },
                      ativo && { backgroundColor: `${s.color}1a` },
                    ]}>
                    <View style={[styles.chipDot, { backgroundColor: s.color }]} />
                    <Text style={[styles.chipText, ativo ? { color: s.color } : styles.chipMuted]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {seriesVisiveis.length === 0 ? (
              <Text style={styles.emptyMuted}>Selecione ao menos uma métrica.</Text>
            ) : modo === 'grafico' ? (
              <View testID="evolucao-grafico">
                <EvolucaoChart series={seriesVisiveis} />
              </View>
            ) : (
              <TabelaEvolucao linhas={linhasTabela} series={seriesVisiveis} />
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function TabelaEvolucao({
  linhas,
  series,
}: {
  linhas: { dataVisita: string; [k: string]: unknown }[];
  series: { key: string; label: string; unit: string }[];
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll} testID="evolucao-tabela">
      <View>
        <View style={[styles.tr, styles.trHeader]}>
          <Text style={[styles.th, styles.cellData]}>Data</Text>
          {series.map((s) => (
            <Text key={s.key} style={[styles.th, styles.cell]} numberOfLines={2}>
              {s.label}
              {s.unit ? `\n(${s.unit})` : ''}
            </Text>
          ))}
        </View>
        {linhas.map((linha, i) => (
          <View key={i} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
            <Text style={[styles.td, styles.cellData]}>{formatIsoToBR(linha.dataVisita)}</Text>
            {series.map((s) => {
              const v = linha[s.key];
              return (
                <Text key={s.key} style={[styles.td, styles.cell]}>
                  {typeof v === 'number' ? v : '—'}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ModoButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`modo-${label.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.modoButton, active && styles.modoButtonActive]}>
      <Text style={[styles.modoText, active && styles.modoTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 16, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  modoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  modoButtonActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  modoText: { fontSize: 15, fontWeight: '600', color: '#333' },
  modoTextActive: { color: '#fff' },
  hint: { fontSize: 13, color: '#666' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipMuted: { color: '#999' },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyMuted: { fontSize: 14, color: '#666', textAlign: 'center' },
  tableScroll: { borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  tr: { flexDirection: 'row' },
  trHeader: { backgroundColor: '#f4f6f8', borderBottomWidth: 1, borderBottomColor: '#e3e8ec' },
  trAlt: { backgroundColor: '#fafbfc' },
  th: { fontSize: 12, fontWeight: '700', color: '#444', padding: 8 },
  td: { fontSize: 13, color: '#333', padding: 8 },
  cell: { width: 92, textAlign: 'center' },
  cellData: { width: 96, textAlign: 'left', fontWeight: '500' },
});
