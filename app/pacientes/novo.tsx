import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCreatePaciente } from '@/src/features/pacientes/pacientes-hooks';
import {
  pacienteFormSchema,
  type PacienteFormValues,
} from '@/src/features/pacientes/paciente-schema';
import { DuplicateCpfError } from '@/src/features/pacientes/pacientes-service';
import { formatCpf } from '@/src/lib/cpf';
import { calcularIdade, formatBRDate, parseBRDate } from '@/src/lib/date';

export default function NovoPacienteScreen() {
  const router = useRouter();
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
        Alert.alert(
          'Paciente já cadastrado',
          `${err.existing.nome} já está cadastrado com este CPF.`
        );
        return;
      }
      const cause = err instanceof Error ? (err as Error & { cause?: unknown }).cause : null;
      const causeMsg = cause instanceof Error ? cause.message : cause ? String(cause) : '';
      console.error('[cadastro paciente] insert falhou:', err, '\ncause:', causeMsg || cause);
      const raw = err instanceof Error ? err.message : String(err);
      const haystack = `${causeMsg}\n${raw}`;
      const friendly = /FOREIGN KEY/i.test(haystack)
        ? 'Sessão inconsistente com o banco. Faça logout e entre novamente.'
        : /no such column/i.test(haystack)
          ? 'Esquema do banco desatualizado. Apague o app e reinstale (npm run reset:ios && npm run ios).'
          : /UNIQUE constraint failed/i.test(haystack)
            ? 'Já existe um registro com este valor único (provavelmente CPF).'
            : causeMsg || raw;
      setSubmitError(friendly);
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <Section title="Identificação">
          <Field label="CPF" error={errors.cpf?.message}>
            <Controller
              control={control}
              name="cpf"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="000.000.000-00"
                  value={formatCpf(value)}
                  onChangeText={(text) => onChange(formatCpf(text))}
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
                <TextInput
                  style={styles.input}
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
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="DD/MM/AAAA"
                  value={formatBRDate(value ?? '')}
                  onChangeText={(text) => onChange(formatBRDate(text))}
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
                  <SegmentedOption
                    label="Masculino"
                    selected={sexo === 'M'}
                    onPress={() => onChange('M')}
                  />
                  <SegmentedOption
                    label="Feminino"
                    selected={sexo === 'F'}
                    onPress={() => onChange('F')}
                  />
                </View>
              )}
            />
          </Field>
        </Section>

        <Section title="Fatores de risco">
          <BooleanField control={control} name="tabagismo" label="Tabagismo" />
          <BooleanField
            control={control}
            name="atividadeFisica"
            label="Pratica atividade física"
          />
          <BooleanField control={control} name="estatina" label="Usa estatina" />
          <BooleanField control={control} name="historicoCv" label="Histórico de evento CV" />

          {historicoCv && (
            <Field label="Data do evento CV" error={errors.dataEventoCv?.message}>
              <Controller
                control={control}
                name="dataEventoCv"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="DD/MM/AAAA"
                    value={formatBRDate(value ?? '')}
                    onChangeText={(text) => onChange(formatBRDate(text))}
                    onBlur={onBlur}
                    maxLength={10}
                  />
                )}
              />
            </Field>
          )}
        </Section>

        {submitError && <Text style={styles.errorText}>{submitError}</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
            disabled={createPaciente.isPending}>
            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.button,
              styles.buttonPrimary,
              createPaciente.isPending && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
            disabled={createPaciente.isPending}>
            {createPaciente.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Salvar</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function SegmentedOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.segment, selected && styles.segmentSelected]}
      onPress={onPress}>
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
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
          <Text style={styles.switchLabel}>{label}</Text>
          <Switch value={value} onValueChange={onChange} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 24, paddingBottom: 48 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  sectionBody: { gap: 16 },
  field: { gap: 6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 14, fontWeight: '500' },
  hint: { fontSize: 12, color: '#666' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden' },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  segmentSelected: { backgroundColor: '#0a7ea4' },
  segmentText: { fontSize: 14, color: '#333' },
  segmentTextSelected: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  switchLabel: { fontSize: 15 },
  errorText: { color: '#b00020', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: { backgroundColor: '#0a7ea4' },
  buttonPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonSecondary: { backgroundColor: '#eee' },
  buttonSecondaryText: { color: '#333', fontWeight: '600', fontSize: 16 },
  buttonDisabled: { opacity: 0.5 },
});
