import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, Txt } from '@/components/ui/kit';
import { EvoluacaoChart } from '@/components/evolucao-chart';
import { useResponsive } from '@/hooks/use-responsive';
import { usePaciente } from '@/src/features/pacientes/pacientes-hooks';
import { useVisitasByPaciente } from '@/src/features/visitas/visitas-hooks';
import { construirSeries } from '@/src/features/visitas/metricas';
import { formatIsoToBR } from '@/src/lib/date';
import { colors, radius, spacing } from '@/src/theme/tokens';

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

  const linhasTabela = useMemo(
    () => [...(visitas ?? [])].sort((a, b) => b.dataVisita.localeCompare(a.dataVisita)),
    [visitas]
  );

  const toggleMetrica = (key: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const semDados = series.length === 0;

  return (
    <>
      <Stack.Screen options={{ title: paciente ? `Evolução — ${paciente.nome}` : 'Evolução' }} />
      <ScrollView style={styles.flex} contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        <View style={styles.toggleRow} testID="evolucao-modo">
          <ModoButton label="Gráfico" active={modo === 'grafico'} onPress={() => setModo('grafico')} />
          <ModoButton label="Tabela" active={modo === 'tabela'} onPress={() => setModo('tabela')} />
        </View>

        {semDados ? (
          <View style={styles.emptyState} testID="evolucao-empty">
            <View style={styles.emptyIcon}>
              <Ionicons name="analytics-outline" size={30} color={colors.textMuted} />
            </View>
            <Txt variant="subtitle">Sem dados para exibir</Txt>
            <Txt variant="caption" style={styles.emptyMuted}>
              Registre visitas com medições para visualizar a evolução.
            </Txt>
          </View>
        ) : (
          <>
            <Txt variant="caption">Toque nas métricas para mostrar/ocultar.</Txt>
            <View style={styles.chips}>
              {series.map((s) => (
                <Chip
                  key={s.key}
                  testID={`metrica-${s.key}`}
                  label={s.label}
                  active={!ocultas.has(s.key)}
                  color={s.color}
                  dotColor={s.color}
                  onPress={() => toggleMetrica(s.key)}
                />
              ))}
            </View>

            {seriesVisiveis.length === 0 ? (
              <Txt variant="caption">Selecione ao menos uma métrica.</Txt>
            ) : modo === 'grafico' ? (
              <Card testID="evolucao-grafico">
                <EvoluacaoChart series={seriesVisiveis} />
              </Card>
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
    <Card padded={false} testID="evolucao-tabela" style={styles.tableCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={[styles.tr, styles.trHeader]}>
            <Txt variant="caption" style={[styles.th, styles.cellData]}>
              Data
            </Txt>
            {series.map((s) => (
              <Txt key={s.key} variant="caption" style={[styles.th, styles.cell]} numberOfLines={2}>
                {s.label}
                {s.unit ? `\n(${s.unit})` : ''}
              </Txt>
            ))}
          </View>
          {linhas.map((linha, i) => (
            <View key={i} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
              <Txt variant="caption" color={colors.text} style={[styles.td, styles.cellData]}>
                {formatIsoToBR(linha.dataVisita)}
              </Txt>
              {series.map((s) => {
                const v = linha[s.key];
                return (
                  <Txt key={s.key} variant="caption" color={colors.text} style={[styles.td, styles.cell]}>
                    {typeof v === 'number' ? v : '—'}
                  </Txt>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </Card>
  );
}

function ModoButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      testID={`modo-${label.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.modoButton, active && styles.modoButtonActive]}>
      <Txt variant="bodyMedium" color={active ? colors.onPrimary : colors.textSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  toggleRow: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modoButton: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  modoButtonActive: { backgroundColor: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: 56 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  emptyMuted: { textAlign: 'center', maxWidth: 260 },
  tableCard: { overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  trHeader: { backgroundColor: colors.surfaceAlt, borderBottomWidth: 1, borderBottomColor: colors.border },
  trAlt: { backgroundColor: colors.surfaceAlt },
  th: { padding: spacing.sm, fontWeight: '700' },
  td: { padding: spacing.sm },
  cell: { width: 92, textAlign: 'center' },
  cellData: { width: 96, textAlign: 'left' },
});
