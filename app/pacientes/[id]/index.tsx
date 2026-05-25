import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePaciente } from '@/src/features/pacientes/pacientes-hooks';
import { useVisitasByPaciente } from '@/src/features/visitas/visitas-hooks';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade, formatIsoToBR } from '@/src/lib/date';

export default function PacienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: paciente, isLoading, error } = usePaciente(id ?? '');
  const { data: visitas } = useVisitasByPaciente(id ?? '');

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

  return (
    <>
      <Stack.Screen options={{ title: paciente.nome }} />
      <ScrollView contentContainerStyle={styles.container}>
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
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => router.push(`/pacientes/${paciente.id}/visitas/nova` as Href)}>
          <Text style={styles.primaryButtonText}>Nova visita</Text>
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
  container: { padding: 24, gap: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b00020' },
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
});
