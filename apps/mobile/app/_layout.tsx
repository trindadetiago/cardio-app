import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDbMigrations } from '@/src/db/use-db-migrations';
import { AuthProvider, useAuth } from '@/src/features/auth/auth-context';
import { queryClient } from '@/src/lib/query-client';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useDbMigrations();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider enabled={success}>
          {error ? (
            <CenteredMessage text={`Erro ao iniciar banco: ${error.message}`} />
          ) : !success ? (
            <CenteredLoader text="Preparando dados…" />
          ) : (
            <RootStack />
          )}
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function RootStack() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) return <CenteredLoader text="Carregando…" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="pacientes/novo"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Novo paciente',
        }}
      />
      <Stack.Screen
        name="pacientes/[id]/index"
        options={{ headerShown: true, title: 'Paciente' }}
      />
      <Stack.Screen
        name="pacientes/[id]/evolucao"
        options={{ headerShown: true, title: 'Evolução' }}
      />
      <Stack.Screen
        name="pacientes/[id]/visitas/nova"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Nova visita',
        }}
      />
    </Stack>
  );
}

function CenteredLoader({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.error}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  muted: { color: '#666' },
  error: { color: '#b00020', textAlign: 'center' },
});
