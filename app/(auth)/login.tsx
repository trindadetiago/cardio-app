import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { getLockoutRemainingMs } from '@/src/features/auth/attempts-store';
import { useAuth } from '@/src/features/auth/auth-context';

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
    const interval = setInterval(() => {
      setLockoutMs((ms) => Math.max(0, ms - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutMs]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const result = await login(values.email, values.senha);
    if (result.ok) return;
    if (result.reason === 'locked') {
      setLockoutMs(result.lockedUntilMs);
      setSubmitError(`Muitas tentativas. Tente novamente em ${formatRemaining(result.lockedUntilMs)}.`);
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
            <Text style={styles.title}>CardioRemoto</Text>
            <Text style={styles.subtitle}>Acesso do agente de saúde</Text>
          </View>

          <View style={styles.form}>
            <Field label="E-mail" error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={styles.input}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
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
                  <TextInput
                    style={styles.input}
                    secureTextEntry
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
              <Text style={styles.errorText}>
                Bloqueado. Tente novamente em {formatRemaining(lockoutMs)}.
              </Text>
            )}
            {submitError && !locked && <Text style={styles.errorText}>{submitError}</Text>}

            <Pressable
              accessibilityRole="button"
              style={[styles.button, disabled && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={disabled}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    gap: 32,
  },
  header: { alignItems: 'center', gap: 4 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666' },
  form: { gap: 16 },
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
  errorText: { color: '#b00020', fontSize: 13 },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
