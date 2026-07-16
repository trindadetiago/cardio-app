import { StyleSheet } from 'react-native';

import { fontFamily, fontSize } from '@/src/theme/tokens';
import { Txt } from './txt';
import { Card } from './card';

export function Stat({
  label,
  value,
  testID,
}: {
  label: string;
  value: string | number;
  testID?: string;
}) {
  return (
    <Card testID={testID} padded={false} style={styles.card}>
      <Txt style={styles.value}>{String(value)}</Txt>
      <Txt variant="caption">{label}</Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 2 },
  value: { fontFamily: fontFamily.bold, fontSize: fontSize.h2 },
});
