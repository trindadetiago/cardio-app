import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button, Field, Input, Txt } from '@/components/ui/kit';
import { getLockoutRemainingMs } from '@/src/features/auth/attempts-store';
import { useAuth } from '@/src/features/auth/auth-context';
import { colors, radius, spacing } from '@/src/theme/tokens';

const schema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lockoutMs, setLockoutMs] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  });

  useEffect(() => {
    getLockoutRemainingMs().then(setLockoutMs);
  }, []);

  useEffect(() => {
    if (lockoutMs <= 0) return;
    const interval = setInterval(() => setLockoutMs((ms) => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(interval);
  }, [lockoutMs]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const result = await login(values.email, values.senha);
    if (result.ok) return;
    if (result.reason === 'locked') {
      setLockoutMs(result.lockedUntilMs);
      setSubmitError(`Muitas tentativas. Tente em ${formatRemaining(result.lockedUntilMs)}.`);
    } else {
      setSubmitError(
        result.attemptsLeft > 0
          ? `Credenciais inválidas. ${result.attemptsLeft} tentativa(s) restante(s).`
          : 'Credenciais inválidas.'
      );
    }
  });

  const locked = lockoutMs > 0;
  const disabled = isSubmitting || locked;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="heart-pulse" size={34} color={colors.onPrimary} />
            </View>
            <Txt variant="h1">CardioRemoto</Txt>
            <Txt variant="caption" style={styles.subtitle}>
              Monitoramento de pacientes cardiovasculares
            </Txt>
          </View>

          <View style={styles.form}>
            <Field label="E-mail" error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    testID="input-email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    placeholder="agente@exemplo.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!disabled}
                  />
                )}
              />
            </Field>

            <Field label="Senha" error={errors.senha?.message}>
              <Controller
                control={control}
                name="senha"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    testID="input-senha"
                    secureTextEntry
                    textContentType="password"
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!disabled}
                  />
                )}
              />
            </Field>

            {locked && (
              <Txt variant="caption" color={colors.danger}>
                Bloqueado. Tente em {formatRemaining(lockoutMs)}.
              </Txt>
            )}
            {submitError && !locked && (
              <Txt variant="caption" color={colors.danger}>
                {submitError}
              </Txt>
            )}

            <Button
              testID="btn-entrar"
              title="Entrar"
              onPress={onSubmit}
              loading={isSubmitting}
              disabled={disabled}
              style={styles.submit}
            />
          </View>

          <Txt variant="caption" style={styles.footer}>
            Ecossistema mare.IA · Hospital Universitário
          </Txt>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  header: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: { textAlign: 'center' },
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.sm },
  footer: { textAlign: 'center', position: 'absolute', bottom: spacing.xl, alignSelf: 'center' },
});
