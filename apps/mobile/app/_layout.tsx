import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useDbMigrations } from '@/src/db/use-db-migrations';
import { AuthProvider, useAuth } from '@/src/features/auth/auth-context';
import { queryClient } from '@/src/lib/query-client';
import { colors, fontFamily, fontSize } from '@/src/theme/tokens';

export const unstable_settings = {
  anchor: '(tabs)',
};

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const { success, error } = useDbMigrations();
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const ready = success && fontsLoaded;

  return (
    <ThemeProvider value={navTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider enabled={success}>
          {error ? (
            <CenteredMessage text={`Erro ao iniciar banco: ${error.message}`} />
          ) : !ready ? (
            <CenteredLoader text="Preparando dados…" />
          ) : (
            <RootStack />
          )}
          <StatusBar style="dark" />
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
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleStyle: { fontFamily: fontFamily.semibold, color: colors.text },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="pacientes/novo"
        options={{ presentation: 'modal', headerShown: true, title: 'Novo paciente' }}
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
        options={{ presentation: 'modal', headerShown: true, title: 'Nova visita' }}
      />
    </Stack>
  );
}

function CenteredLoader({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  muted: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: fontSize.md },
  error: { color: colors.danger, textAlign: 'center', fontFamily: fontFamily.medium },
});
