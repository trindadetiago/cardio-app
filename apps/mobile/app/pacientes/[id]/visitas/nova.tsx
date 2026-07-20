import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Field, Input, SectionLabel, Txt } from '@/components/ui/kit';
import { useResponsive } from '@/hooks/use-responsive';
import { parseOptionalNumber, visitaFormSchema, type VisitaFormValues } from '@/src/features/visitas/visita-schema';
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
import { colors, fontFamily, radius, spacing } from '@/src/theme/tokens';

const todayBR = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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
      peso: '', altura: '', circunferenciaAbdominal: '',
      paSistolica: '', paDiastolica: '', frequenciaCardiaca: '',
      glicemiaJejum: '', hba1c: '', colesterolTotal: '', ldl: '', hdl: '', triglicerides: '', creatinina: '',
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
    return imc == null ? null : { imc, classificacao: classificarImc(imc) };
  }, [peso, altura]);

  const paResult = useMemo(
    () => avaliarPressaoArterial(parseOptionalNumber(paSistolica), parseOptionalNumber(paDiastolica)),
    [paSistolica, paDiastolica]
  );
  const glicemiaResult = useMemo(() => avaliarGlicemiaJejum(parseOptionalNumber(glicemiaJejum)), [glicemiaJejum]);
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.section}>
          <SectionLabel>Data</SectionLabel>
          <Card style={styles.group}>
            <Field label="Data da visita" error={errors.dataVisita?.message}>
              <Controller
                control={control}
                name="dataVisita"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input testID="visita-data" keyboardType="number-pad" placeholder="DD/MM/AAAA" value={formatBRDate(value)} onChangeText={(t) => onChange(formatBRDate(t))} onBlur={onBlur} maxLength={10} />
                )}
              />
            </Field>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel>Antropométricos</SectionLabel>
          <Card style={styles.group}>
            <View style={styles.row}>
              <NumericField control={control} name="peso" label="Peso" unit="kg" error={errors.peso?.message} />
              <NumericField control={control} name="altura" label="Altura" unit="m" error={errors.altura?.message} />
            </View>
            {imcInfo && (
              <View style={styles.computed}>
                <Txt variant="caption">IMC</Txt>
                <Txt variant="bodyMedium">
                  {imcInfo.imc.toFixed(1)} · {classificacaoLabel(imcInfo.classificacao)}
                </Txt>
              </View>
            )}
            <NumericField control={control} name="circunferenciaAbdominal" label="Circunferência abdominal" unit="cm" error={errors.circunferenciaAbdominal?.message} />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel>Sinais vitais</SectionLabel>
          <Card style={styles.group}>
            <View style={styles.row}>
              <NumericField control={control} name="paSistolica" label="PA sistólica" unit="mmHg" severidade={paResult.severidade} error={errors.paSistolica?.message} />
              <NumericField control={control} name="paDiastolica" label="PA diastólica" unit="mmHg" severidade={paResult.severidade} error={errors.paDiastolica?.message} />
            </View>
            {paResult.mensagem && <Alerta severidade={paResult.severidade} texto={paResult.mensagem} />}
            <NumericField control={control} name="frequenciaCardiaca" label="Frequência cardíaca" unit="bpm" error={errors.frequenciaCardiaca?.message} />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel>Exames laboratoriais</SectionLabel>
          <Card style={styles.group}>
            <NumericField control={control} name="glicemiaJejum" label="Glicemia em jejum" unit="mg/dL" severidade={glicemiaResult.severidade} error={errors.glicemiaJejum?.message} />
            {glicemiaResult.mensagem && <Alerta severidade={glicemiaResult.severidade} texto={glicemiaResult.mensagem} />}
            <NumericField control={control} name="hba1c" label="HbA1c" unit="%" error={errors.hba1c?.message} />
            <View style={styles.row}>
              <NumericField control={control} name="colesterolTotal" label="Colesterol total" unit="mg/dL" error={errors.colesterolTotal?.message} />
              <NumericField control={control} name="ldl" label="LDL" unit="mg/dL" severidade={ldlResult.severidade} error={errors.ldl?.message} />
            </View>
            {ldlResult.mensagem && <Alerta severidade={ldlResult.severidade} texto={ldlResult.mensagem} />}
            <View style={styles.row}>
              <NumericField control={control} name="hdl" label="HDL" unit="mg/dL" error={errors.hdl?.message} />
              <NumericField control={control} name="triglicerides" label="Triglicérides" unit="mg/dL" error={errors.triglicerides?.message} />
            </View>
            <NumericField control={control} name="creatinina" label="Creatinina" unit="mg/dL" error={errors.creatinina?.message} />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel>Observações</SectionLabel>
          <Card style={styles.group}>
            <Controller
              control={control}
              name="observacoes"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input style={styles.textArea} multiline numberOfLines={4} placeholder="Anotações da visita…" value={value} onChangeText={onChange} onBlur={onBlur} textAlignVertical="top" />
              )}
            />
          </Card>
        </View>

        {submitError && (
          <Txt variant="caption" color={colors.danger}>
            {submitError}
          </Txt>
        )}

        <View style={styles.actions}>
          <Button title="Cancelar" variant="secondary" onPress={() => router.back()} style={styles.flex1} disabled={createVisita.isPending} />
          <Button testID="btn-salvar-visita" title="Salvar visita" onPress={onSubmit} loading={createVisita.isPending} style={styles.flex1} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  const tone = severidade && severidade !== 'ok' ? SEVERIDADE_COR[severidade] : undefined;
  return (
    <View style={styles.flex1}>
      <Field label={`${label}${unit ? ` (${unit})` : ''}`} error={error}>
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input testID={`visita-${name}`} keyboardType="decimal-pad" placeholder="—" value={value} onChangeText={onChange} onBlur={onBlur} tone={tone} />
          )}
        />
      </Field>
    </View>
  );
}

function Alerta({ severidade, texto }: { severidade: Severidade; texto: string }) {
  const cor = SEVERIDADE_COR[severidade];
  const critico = severidade === 'critico';
  return (
    <View
      style={[
        styles.alerta,
        { borderColor: `${cor}55`, backgroundColor: `${cor}12` },
        critico && styles.alertaCritico,
      ]}>
      <Ionicons name={critico ? 'alert-circle' : 'warning-outline'} size={critico ? 18 : 16} color={cor} />
      <Txt variant="caption" color={cor} style={[styles.alertaText, critico && styles.alertaTextCritico]}>
        {critico ? `CRÍTICO — ${texto}` : texto}
      </Txt>
    </View>
  );
}

function classificacaoLabel(c: ReturnType<typeof classificarImc>): string {
  const map: Record<ReturnType<typeof classificarImc>, string> = {
    baixo: 'Baixo peso',
    normal: 'Normal',
    sobrepeso: 'Sobrepeso',
    obesidade1: 'Obesidade I',
    obesidade2: 'Obesidade II',
    obesidade3: 'Obesidade III',
  };
  return map[c];
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 48 },
  containerTablet: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { gap: spacing.sm },
  group: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  textArea: { minHeight: 96, paddingTop: spacing.md },
  computed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  alertaCritico: { borderWidth: 2 },
  alertaText: { fontFamily: fontFamily.medium, flexShrink: 1 },
  alertaTextCritico: { fontFamily: fontFamily.bold },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
