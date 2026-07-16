import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { Button, Card, Field, Input, SectionLabel, Txt } from '@/components/ui/kit';
import { useResponsive } from '@/hooks/use-responsive';
import { useCreatePaciente } from '@/src/features/pacientes/pacientes-hooks';
import {
  pacienteFormSchema,
  type PacienteFormValues,
} from '@/src/features/pacientes/paciente-schema';
import { DuplicateCpfError } from '@/src/features/pacientes/pacientes-service';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade, formatBRDate, parseBRDate } from '@/src/lib/date';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function NovoPacienteScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const createPaciente = useCreatePaciente();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteFormSchema),
    defaultValues: {
      cpf: '',
      nome: '',
      dataNascimento: '',
      sexo: undefined as unknown as 'M',
      tabagismo: false,
      atividadeFisica: false,
      estatina: false,
      historicoCv: false,
      dataEventoCv: '',
    },
  });

  const dataNascimento = watch('dataNascimento');
  const historicoCv = watch('historicoCv');
  const sexo = watch('sexo');

  const idade = useMemo(() => {
    const iso = parseBRDate(dataNascimento ?? '');
    return iso ? calcularIdade(iso) : null;
  }, [dataNascimento]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createPaciente.mutateAsync(values);
      router.back();
    } catch (err) {
      if (err instanceof DuplicateCpfError) {
        Alert.alert('Paciente já cadastrado', `${err.existing.nome} já está cadastrado com este CPF.`);
        return;
      }
      const cause = err instanceof Error ? (err as Error & { cause?: unknown }).cause : null;
      const causeMsg = cause instanceof Error ? cause.message : cause ? String(cause) : '';
      const raw = err instanceof Error ? err.message : String(err);
      const haystack = `${causeMsg}\n${raw}`;
      const friendly = /FOREIGN KEY/i.test(haystack)
        ? 'Sessão inconsistente com o banco. Faça logout e entre novamente.'
        : /UNIQUE constraint failed/i.test(haystack)
          ? 'Já existe um registro com este CPF.'
          : causeMsg || raw;
      setSubmitError(friendly);
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.section}>
          <SectionLabel>Identificação</SectionLabel>
          <Card style={styles.group}>
            <Field label="CPF" error={errors.cpf?.message}>
              <Controller
                control={control}
                name="cpf"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    testID="input-cpf"
                    keyboardType="number-pad"
                    placeholder="000.000.000-00"
                    value={formatCpf(value)}
                    onChangeText={(t) => onChange(formatCpf(t))}
                    onBlur={onBlur}
                    maxLength={14}
                  />
                )}
              />
            </Field>

            <Field label="Nome completo" error={errors.nome?.message}>
              <Controller
                control={control}
                name="nome"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    testID="input-nome"
                    autoCapitalize="words"
                    placeholder="Nome do paciente"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </Field>

            <Field
              label="Data de nascimento"
              hint={idade !== null ? `${idade} anos` : undefined}
              error={errors.dataNascimento?.message}>
              <Controller
                control={control}
                name="dataNascimento"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    testID="input-nascimento"
                    keyboardType="number-pad"
                    placeholder="DD/MM/AAAA"
                    value={formatBRDate(value ?? '')}
                    onChangeText={(t) => onChange(formatBRDate(t))}
                    onBlur={onBlur}
                    maxLength={10}
                  />
                )}
              />
            </Field>

            <Field label="Sexo" error={errors.sexo?.message}>
              <Controller
                control={control}
                name="sexo"
                render={({ field: { onChange } }) => (
                  <View style={styles.segmented}>
                    <SegmentedOption testID="sexo-masculino" label="Masculino" selected={sexo === 'M'} onPress={() => onChange('M')} />
                    <SegmentedOption testID="sexo-feminino" label="Feminino" selected={sexo === 'F'} onPress={() => onChange('F')} />
                  </View>
                )}
              />
            </Field>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel>Fatores de risco</SectionLabel>
          <Card style={styles.group}>
            <BooleanField control={control} name="tabagismo" label="Tabagismo" />
            <BooleanField control={control} name="atividadeFisica" label="Pratica atividade física" />
            <BooleanField control={control} name="estatina" label="Usa estatina" />
            <BooleanField control={control} name="historicoCv" label="Histórico de evento CV" />
            {historicoCv && (
              <Field label="Data do evento CV" error={errors.dataEventoCv?.message}>
                <Controller
                  control={control}
                  name="dataEventoCv"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      keyboardType="number-pad"
                      placeholder="DD/MM/AAAA"
                      value={formatBRDate(value ?? '')}
                      onChangeText={(t) => onChange(formatBRDate(t))}
                      onBlur={onBlur}
                      maxLength={10}
                    />
                  )}
                />
              </Field>
            )}
          </Card>
        </View>

        {submitError && (
          <Txt variant="caption" color={colors.danger}>
            {submitError}
          </Txt>
        )}

        <View style={styles.actions}>
          <Button title="Cancelar" variant="secondary" onPress={() => router.back()} style={styles.flex1} disabled={createPaciente.isPending} />
          <Button testID="btn-salvar-paciente" title="Salvar" onPress={onSubmit} loading={createPaciente.isPending} style={styles.flex1} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SegmentedOption({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.segment, selected && styles.segmentSelected]}
      onPress={onPress}>
      <Txt variant="bodyMedium" color={selected ? colors.onPrimary : colors.textSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}

type BooleanFieldProps = {
  control: ReturnType<typeof useForm<PacienteFormValues>>['control'];
  name: 'tabagismo' | 'atividadeFisica' | 'estatina' | 'historicoCv';
  label: string;
};

function BooleanField({ control, name, label }: BooleanFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View style={styles.switchRow}>
          <Txt variant="body">{label}</Txt>
          <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
            ios_backgroundColor={colors.borderStrong}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { gap: spacing.sm },
  group: { gap: spacing.lg },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    padding: 3,
    gap: 3,
  },
  segment: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: radius.sm },
  segmentSelected: { backgroundColor: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
