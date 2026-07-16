import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/src/theme/tokens';
import { Txt } from './txt';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
};

const BG: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surfaceAlt,
  danger: colors.danger,
  ghost: 'transparent',
};

const FG: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.text,
  danger: colors.onPrimary,
  ghost: colors.primary,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BG[variant] },
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && { opacity: colors.disabledOpacity },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <Txt style={[styles.label, { color: FG[variant] }]}>{title}</Txt>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ghost: { borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fontFamily.semibold, fontSize: fontSize.lg },
});
