import { View, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/src/theme/tokens';
import { Txt } from './txt';
import { Card } from './card';

/** Título de seção discreto (overline). */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Txt variant="overline" style={styles.label}>
      {children}
    </Txt>
  );
}

/** Cartão de seção com título opcional e linhas rotuladas. */
export function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <Card padded={false} style={styles.card}>
        {children}
      </Card>
    </View>
  );
}

export function InfoRow({
  label,
  value,
  first,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <View style={[styles.row, !first && styles.rowBorder]}>
      <Txt variant="caption">{label}</Txt>
      <Txt variant="bodyMedium" style={styles.rowValue}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  label: { marginLeft: spacing.xs },
  card: { overflow: 'hidden', borderRadius: radius.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowValue: { flexShrink: 1, textAlign: 'right' },
});
