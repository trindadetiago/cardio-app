import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  parseOptionalNumber,
  visitaFormSchema,
  type VisitaFormValues,
} from '@/src/features/visitas/visita-schema';
import { useCreateVisita } from '@/src/features/visitas/visitas-hooks';
import {
  avaliarGlicemiaJejum,
  avaliarLdl,
  avaliarPressaoArterial,
  SEVERIDADE_COR,
  type Severidade,
} from '@/src/lib/criticos';
import { formatBRDate } from '@/src/lib/date';
import { calcularImc, classificarImc } from '@/src/lib/imc';
import { useResponsive } from '@/hooks/use-responsive';

const todayBR = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

export default function NovaVisitaScreen() {
  const { id: pacienteId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();
  const createVisita = useCreateVisita(pacienteId ?? '');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VisitaFormValues>({
    resolver: zodResolver(visitaFormSchema),
    defaultValues: {
      dataVisita: todayBR(),
      peso: '',
      altura: '',
      circunferenciaAbdominal: '',
      paSistolica: '',
      paDiastolica: '',
      frequenciaCardiaca: '',
      glicemiaJejum: '',
      hba1c: '',
      colesterolTotal: '',
      ldl: '',
      hdl: '',
      triglicerides: '',
      creatinina: '',
      observacoes: '',
    },
  });

  const peso = watch('peso');
  const altura = watch('altura');
  const paSistolica = watch('paSistolica');
  const paDiastolica = watch('paDiastolica');
  const glicemiaJejum = watch('glicemiaJejum');
  const ldl = watch('ldl');

  const imcInfo = useMemo(() => {
    const p = parseOptionalNumber(peso);
    const a = parseOptionalNumber(altura);
    if (p == null || a == null) return null;
    const imc = calcularImc(p, a);
    if (imc == null) return null;
    return { imc, classificacao: classificarImc(imc) };
  }, [peso, altura]);

  const paResult = useMemo(
    () =>
      avaliarPressaoArterial(parseOptionalNumber(paSistolica), parseOptionalNumber(paDiastolica)),
    [paSistolica, paDiastolica]
  );
  const glicemiaResult = useMemo(
    () => avaliarGlicemiaJejum(parseOptionalNumber(glicemiaJejum)),
    [glicemiaJejum]
  );
  const ldlResult = useMemo(() => avaliarLdl(parseOptionalNumber(ldl)), [ldl]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createVisita.mutateAsync(values);
      router.back();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar visita');
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}
        keyboardShouldPersistTaps="handled">
        <Section title="Data">
          <Field label="Data da visita" error={errors.dataVisita?.message}>
            <Controller
              control={control}
              name="dataVisita"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="DD/MM/AAAA"
                  value={formatBRDate(value)}
                  onChangeText={(text) => onChange(formatBRDate(text))}
                  onBlur={onBlur}
                  maxLength={10}
                />
              )}
            />
          </Field>
        </Section>

        <Section title="Antropométricos">
          <View style={styles.row}>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="peso"
                label="Peso"
                unit="kg"
                error={errors.peso?.message}
              />
            </View>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="altura"
                label="Altura"
                unit="m"
                error={errors.altura?.message}
              />
            </View>
          </View>
          {imcInfo && (
            <View style={styles.computed}>
              <Text style={styles.computedLabel}>IMC</Text>
              <Text style={styles.computedValue}>
                {imcInfo.imc.toFixed(1)} · {classificacaoLabel(imcInfo.classificacao)}
              </Text>
            </View>
          )}
          <NumericField
            control={control}
            name="circunferenciaAbdominal"
            label="Circunferência abdominal"
            unit="cm"
            error={errors.circunferenciaAbdominal?.message}
          />
        </Section>

        <Section title="Sinais vitais">
          <View style={styles.row}>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="paSistolica"
                label="PA sistólica"
                unit="mmHg"
                severidade={paResult.severidade}
                error={errors.paSistolica?.message}
              />
            </View>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="paDiastolica"
                label="PA diastólica"
                unit="mmHg"
                severidade={paResult.severidade}
                error={errors.paDiastolica?.message}
              />
            </View>
          </View>
          {paResult.mensagem && <Alerta severidade={paResult.severidade} texto={paResult.mensagem} />}
          <NumericField
            control={control}
            name="frequenciaCardiaca"
            label="Frequência cardíaca"
            unit="bpm"
            error={errors.frequenciaCardiaca?.message}
          />
        </Section>

        <Section title="Exames laboratoriais">
          <NumericField
            control={control}
            name="glicemiaJejum"
            label="Glicemia em jejum"
            unit="mg/dL"
            severidade={glicemiaResult.severidade}
            error={errors.glicemiaJejum?.message}
          />
          {glicemiaResult.mensagem && (
            <Alerta severidade={glicemiaResult.severidade} texto={glicemiaResult.mensagem} />
          )}
          <NumericField
            control={control}
            name="hba1c"
            label="HbA1c"
            unit="%"
            error={errors.hba1c?.message}
          />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="colesterolTotal"
                label="Colesterol total"
                unit="mg/dL"
                error={errors.colesterolTotal?.message}
              />
            </View>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="ldl"
                label="LDL"
                unit="mg/dL"
                severidade={ldlResult.severidade}
                error={errors.ldl?.message}
              />
            </View>
          </View>
          {ldlResult.mensagem && <Alerta severidade={ldlResult.severidade} texto={ldlResult.mensagem} />}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="hdl"
                label="HDL"
                unit="mg/dL"
                error={errors.hdl?.message}
              />
            </View>
            <View style={styles.flex1}>
              <NumericField
                control={control}
                name="triglicerides"
                label="Triglicérides"
                unit="mg/dL"
                error={errors.triglicerides?.message}
              />
            </View>
          </View>
          <NumericField
            control={control}
            name="creatinina"
            label="Creatinina"
            unit="mg/dL"
            error={errors.creatinina?.message}
          />
        </Section>

        <Section title="Observações">
          <Controller
            control={control}
            name="observacoes"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Anotações da visita…"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                textAlignVertical="top"
              />
            )}
          />
        </Section>

        {submitError && <Text style={styles.errorText}>{submitError}</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
            disabled={createVisita.isPending}>
            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
          </Pressable>
          <Pressable
            testID="btn-salvar-visita"
            accessibilityRole="button"
            style={[
              styles.button,
              styles.buttonPrimary,
              createVisita.isPending && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
            disabled={createVisita.isPending}>
            {createVisita.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Salvar visita</Text>
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type NumericFieldName = Exclude<keyof VisitaFormValues, 'dataVisita' | 'observacoes'>;

function NumericField({
  control,
  name,
  label,
  unit,
  severidade,
  error,
}: {
  control: Control<VisitaFormValues>;
  name: NumericFieldName;
  label: string;
  unit?: string;
  severidade?: Severidade;
  error?: string;
}) {
  const borderColor = severidade && severidade !== 'ok' ? SEVERIDADE_COR[severidade] : '#ccc';
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {unit ? ` (${unit})` : ''}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            testID={`visita-${name}`}
            style={[styles.input, { borderColor }]}
            keyboardType="decimal-pad"
            placeholder="—"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function Alerta({ severidade, texto }: { severidade: Severidade; texto: string }) {
  return (
    <View
      style={[
        styles.alerta,
        { borderColor: SEVERIDADE_COR[severidade], backgroundColor: `${SEVERIDADE_COR[severidade]}15` },
      ]}>
      <Text style={[styles.alertaText, { color: SEVERIDADE_COR[severidade] }]}>{texto}</Text>
    </View>
  );
}

function classificacaoLabel(c: ReturnType<typeof classificarImc>): string {
  switch (c) {
    case 'baixo':
      return 'Baixo peso';
    case 'normal':
      return 'Normal';
    case 'sobrepeso':
      return 'Sobrepeso';
    case 'obesidade1':
      return 'Obesidade I';
    case 'obesidade2':
      return 'Obesidade II';
    case 'obesidade3':
      return 'Obesidade III';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  container: { padding: 24, gap: 24, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  sectionBody: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: { minHeight: 96 },
  errorText: { color: '#b00020', fontSize: 13 },
  computed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f4f6f8',
    borderRadius: 8,
  },
  computedLabel: { fontSize: 14, color: '#666' },
  computedValue: { fontSize: 14, fontWeight: '600' },
  alerta: { borderWidth: 1, borderRadius: 8, padding: 10 },
  alertaText: { fontSize: 13, fontWeight: '500' },
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
