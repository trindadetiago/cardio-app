import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { Txt } from '@/components/ui/kit';
import { useSyncUi } from '@/src/features/sync/sync-manager';
import { colors, fontFamily, radius, spacing } from '@/src/theme/tokens';

/**
 * Toast discreto que anuncia dados recebidos numa sincronização.
 * Aparece por ~3s e some sozinho; não bloqueia toques (pointerEvents none).
 */
export function SyncToast() {
  const pullToast = useSyncUi((s) => s.pullToast);
  const [text, setText] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pullToast) return;
    setText(pullToast.text);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const timeout = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setText(null);
        }
      );
    }, 3000);
    return () => clearTimeout(timeout);
  }, [pullToast?.key]);

  if (!text) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.wrap,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}>
      <Animated.View style={styles.toast} testID="sync-toast">
        <Ionicons name="cloud-done-outline" size={16} color={colors.onPrimary} />
        <Txt style={styles.text}>{text}</Txt>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  text: { color: colors.onPrimary, fontFamily: fontFamily.medium, fontSize: 14 },
});
