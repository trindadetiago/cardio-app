import { forwardRef } from 'react';
import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/src/theme/tokens';
import { Txt } from './txt';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Txt variant="label">{label}</Txt>
        {hint ? <Txt variant="caption">{hint}</Txt> : null}
      </View>
      {children}
      {error ? (
        <Txt variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

type InputProps = TextInputProps & {
  /** Cor de borda para realce de estado (ex.: alerta/crítico). */
  tone?: string;
};

export const Input = forwardRef<TextInput, InputProps>(({ tone, style, ...rest }, ref) => {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, tone ? { borderColor: tone, borderWidth: 1.5 } : null, style]}
      {...rest}
    />
  );
});
Input.displayName = 'Input';

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  error: { marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    color: colors.text,
    minHeight: 50,
  },
});
