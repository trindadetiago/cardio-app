import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { RISCO_COR, RISCO_LABEL } from '@cardio/shared';
import { Button, InfoRow, SectionCard, Txt } from '@/components/ui/kit';
import { usePaciente } from '@/src/features/pacientes/pacientes-hooks';
import { avaliarPaciente } from '@/src/features/pacientes/paciente-risco';
import { useVisitasByPaciente } from '@/src/features/visitas/visitas-hooks';
import { useResponsive } from '@/hooks/use-responsive';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade, formatIsoToBR } from '@/src/lib/date';
import { descreverPrioridade } from '@/src/lib/visita-prioridade';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function PacienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();
  const { data: paciente, isLoading, error } = usePaciente(id ?? '');
  const { data: visitas } = useVisitasByPaciente(id ?? '');

  const avaliacao = useMemo(() => {
    if (!paciente) return null;
    const ultima = visitas?.[0] ?? null;
    return avaliarPaciente(
      paciente,
      ultima
        ? {
            dataVisita: ultima.dataVisita,
            paSistolica: ultima.paSistolica,
            paDiastolica: ultima.paDiastolica,
            hba1c: ultima.hba1c,
            ldl: ultima.ldl,
          }
        : null
    );
  }, [paciente, visitas]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !paciente) {
    return (
      <View style={styles.center}>
        <Txt variant="body" color={colors.danger}>
          {error ? `Erro: ${error.message}` : 'Paciente não encontrado'}
        </Txt>
      </View>
    );
  }

  const idade = calcularIdade(paciente.dataNascimento);
  const sexoLabel = paciente.sexo === 'M' ? 'Masculino' : 'Feminino';
  const cor = avaliacao ? RISCO_COR[avaliacao.risco.nivel] : colors.semDados;

  return (
    <>
      <Stack.Screen options={{ title: paciente.nome }} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        {avaliacao && (
          <View style={[styles.riscoCard, { borderColor: `${cor}55`, backgroundColor: `${cor}10` }]}>
            <View style={styles.riscoHeader}>
              <View style={[styles.riscoDot, { backgroundColor: cor }]} />
              <Txt variant="subtitle" color={cor} testID="detalhe-risco">
                {RISCO_LABEL[avaliacao.risco.nivel]}
              </Txt>
            </View>
            <Txt variant="caption" color={colors.textSecondary}>
              {avaliacao.risco.motivo}
            </Txt>
            <View style={styles.riscoPrioridade}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Txt variant="caption" color={colors.textSecondary}>
                Próxima visita: {descreverPrioridade(avaliacao.prioridade)}
              </Txt>
            </View>
          </View>
        )}

        <SectionCard title="Dados do paciente">
          <InfoRow first label="CPF" value={formatCpf(paciente.cpf)} />
          <InfoRow
            label="Nascimento"
            value={`${formatIsoToBR(paciente.dataNascimento)}${idade != null ? ` (${idade} anos)` : ''}`}
          />
          <InfoRow label="Sexo" value={sexoLabel} />
        </SectionCard>

        <SectionCard title="Fatores de risco">
          <InfoRow first label="Tabagismo" value={paciente.tabagismo ? 'Sim' : 'Não'} />
          <InfoRow label="Atividade física" value={paciente.atividadeFisica ? 'Sim' : 'Não'} />
          <InfoRow label="Usa estatina" value={paciente.estatina ? 'Sim' : 'Não'} />
          <InfoRow label="Histórico de evento CV" value={paciente.historicoCv ? 'Sim' : 'Não'} />
          {paciente.historicoCv && paciente.dataEventoCv && (
            <InfoRow label="Data do evento" value={formatIsoToBR(paciente.dataEventoCv)} />
          )}
        </SectionCard>

        <SectionCard title="Visitas">
          <InfoRow
            first
            label="Última visita"
            value={
              paciente.visitaMaisRecente
                ? formatIsoToBR(paciente.visitaMaisRecente)
                : 'Sem visitas registradas'
            }
          />
          <InfoRow label="Total" value={String(visitas?.length ?? 0)} />
        </SectionCard>

        <View style={styles.actions}>
          <Button
            testID="btn-nova-visita"
            title="Nova visita"
            onPress={() => router.push(`/pacientes/${paciente.id}/visitas/nova` as Href)}
          />
          <Button
            testID="btn-evolucao"
            title="Ver evolução"
            variant="secondary"
            onPress={() => router.push(`/pacientes/${paciente.id}/evolucao` as Href)}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.background },
  riscoCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 6 },
  riscoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  riscoDot: { width: 12, height: 12, borderRadius: 6 },
  riscoPrioridade: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  actions: { gap: spacing.md, marginTop: spacing.xs },
});
