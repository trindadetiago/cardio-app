import { View, StyleSheet, type ViewProps } from 'react-native';

import { colors, elevation, radius, spacing } from '@/src/theme/tokens';

type Props = ViewProps & {
  padded?: boolean;
  tone?: string; // borda/realce colorido opcional
};

export function Card({ padded = true, tone, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        padded && styles.padded,
        tone ? { borderColor: tone, borderWidth: 1 } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  padded: { padding: spacing.lg },
});
