import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/kit';
import { useAuth } from '@/src/features/auth/auth-context';
import { useOnlineStatus, usePendingCount } from '@/src/features/sync/sync-hooks';
import { runSync, useSyncUi } from '@/src/features/sync/sync-manager';
import { colors, radius, spacing } from '@/src/theme/tokens';

/**
 * Indicador discreto de sincronização no cabeçalho. A sync é automática;
 * tocar aqui força um sync completo (útil para o agente puxar novidades na hora).
 */
export function SyncIndicator() {
  const { session } = useAuth();
  const syncing = useSyncUi((s) => s.syncing);
  const online = useOnlineStatus().data !== false;
  const pending = usePendingCount().data ?? 0;

  let icon: keyof typeof Ionicons.glyphMap = 'cloud-done-outline';
  let label = 'Em dia';
  let tint: string = colors.textMuted;
  if (!online) {
    icon = 'cloud-offline-outline';
    label = 'Offline';
    tint = colors.textMuted;
  } else if (pending > 0) {
    icon = 'cloud-upload-outline';
    label = `${pending}`;
    tint = colors.amarelo;
  }

  const onPress = () => {
    if (online && !syncing) runSync(session?.agenteId).catch(() => {});
  };

  return (
    <Pressable
      testID="sync-indicator"
      accessibilityRole="button"
      accessibilityLabel="Sincronizar"
      onPress={onPress}
      hitSlop={8}
      style={styles.pill}>
      {syncing ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons name={icon} size={16} color={tint} />
          <Txt variant="caption" color={tint} style={styles.label}>
            {label}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    minHeight: 32,
    minWidth: 32,
    justifyContent: 'center',
  },
  label: { fontVariant: ['tabular-nums'] },
});
