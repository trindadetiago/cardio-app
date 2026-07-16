import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/src/theme/tokens';
import { Txt } from './txt';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Cor de destaque quando ativo (padrão: primária). */
  color?: string;
  /** Ponto colorido à esquerda (ex.: cor de risco). */
  dotColor?: string;
  testID?: string;
};

export function Chip({ label, active, onPress, color = colors.primary, dotColor, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        active ? { backgroundColor: color, borderColor: color } : styles.inactive,
      ]}>
      {dotColor && <View style={[styles.dot, { backgroundColor: active ? '#fff' : dotColor }]} />}
      <Txt style={[styles.text, active ? styles.textActive : undefined]}>{label}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 38,
  },
  inactive: { backgroundColor: colors.surface, borderColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: fontFamily.medium, fontSize: fontSize.md, color: colors.textSecondary },
  textActive: { color: colors.onPrimary },
});
