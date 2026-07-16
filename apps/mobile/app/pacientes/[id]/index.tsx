import { useMemo } from 'react';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RISCO_COR, RISCO_LABEL } from '@cardio/shared';
import { usePaciente } from '@/src/features/pacientes/pacientes-hooks';
import { avaliarPaciente } from '@/src/features/pacientes/paciente-risco';
import { useVisitasByPaciente } from '@/src/features/visitas/visitas-hooks';
import { useResponsive } from '@/hooks/use-responsive';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade, formatIsoToBR } from '@/src/lib/date';
import { descreverPrioridade } from '@/src/lib/visita-prioridade';

export default function PacienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();
  const { data: paciente, isLoading, error } = usePaciente(id ?? '');
  const { data: visitas } = useVisitasByPaciente(id ?? '');

  const avaliacao = useMemo(() => {
    if (!paciente) return null;
    const ultima = visitas?.[0] ?? null; // visitas vêm ordenadas por data desc
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
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !paciente) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ? `Erro: ${error.message}` : 'Paciente não encontrado'}
        </Text>
      </View>
    );
  }

  const idade = calcularIdade(paciente.dataNascimento);
  const sexoLabel = paciente.sexo === 'M' ? 'Masculino' : 'Feminino';
  const cor = avaliacao ? RISCO_COR[avaliacao.risco.nivel] : '#9aa5ad';

  return (
    <>
      <Stack.Screen options={{ title: paciente.nome }} />
      <ScrollView contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
        {avaliacao && (
          <View style={[styles.riscoCard, { borderColor: cor, backgroundColor: `${cor}12` }]}>
            <View style={styles.riscoHeader}>
              <View style={[styles.riscoDot, { backgroundColor: cor }]} />
              <Text style={[styles.riscoTitulo, { color: cor }]} testID="detalhe-risco">
                {RISCO_LABEL[avaliacao.risco.nivel]}
              </Text>
            </View>
            <Text style={styles.riscoMotivo}>{avaliacao.risco.motivo}</Text>
            <Text style={styles.riscoPrioridade}>
              Próxima visita: {descreverPrioridade(avaliacao.prioridade)}
            </Text>
          </View>
        )}

        <Section title="Dados do paciente">
          <Row label="CPF" value={formatCpf(paciente.cpf)} />
          <Row
            label="Nascimento"
            value={`${formatIsoToBR(paciente.dataNascimento)}${idade != null ? ` (${idade} anos)` : ''}`}
          />
          <Row label="Sexo" value={sexoLabel} />
        </Section>

        <Section title="Fatores de risco">
          <Row label="Tabagismo" value={paciente.tabagismo ? 'Sim' : 'Não'} />
          <Row label="Atividade física" value={paciente.atividadeFisica ? 'Sim' : 'Não'} />
          <Row label="Usa estatina" value={paciente.estatina ? 'Sim' : 'Não'} />
          <Row label="Histórico de evento CV" value={paciente.historicoCv ? 'Sim' : 'Não'} />
          {paciente.historicoCv && paciente.dataEventoCv && (
            <Row label="Data do evento" value={formatIsoToBR(paciente.dataEventoCv)} />
          )}
        </Section>

        <Section title="Visitas">
          <Row
            label="Última visita"
            value={
              paciente.visitaMaisRecente
                ? formatIsoToBR(paciente.visitaMaisRecente)
                : 'Sem visitas registradas'
            }
          />
          <Row label="Total" value={String(visitas?.length ?? 0)} />
        </Section>

        <Pressable
          testID="btn-nova-visita"
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => router.push(`/pacientes/${paciente.id}/visitas/nova` as Href)}>
          <Text style={styles.primaryButtonText}>Nova visita</Text>
        </Pressable>

        <Pressable
          testID="btn-evolucao"
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={() => router.push(`/pacientes/${paciente.id}/evolucao` as Href)}>
          <Text style={styles.secondaryButtonText}>Ver evolução</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b00020' },
  riscoCard: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  riscoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riscoDot: { width: 12, height: 12, borderRadius: 6 },
  riscoTitulo: { fontSize: 16, fontWeight: '700' },
  riscoMotivo: { fontSize: 13, color: '#444' },
  riscoPrioridade: { fontSize: 13, color: '#444', fontWeight: '500' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  sectionBody: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    gap: 12,
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: {
    backgroundColor: '#eef3f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: { color: '#0a7ea4', fontWeight: '600', fontSize: 16 },
});
