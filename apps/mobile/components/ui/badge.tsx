import { View, StyleSheet } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/src/theme/tokens';
import { Txt } from './txt';

type Props = {
  label: string;
  color: string;
  testID?: string;
};

/** Etiqueta pequena com ponto colorido — usada para nível de risco. */
export function Badge({ label, color, testID }: Props) {
  return (
    <View
      testID={testID}
      style={[styles.badge, { backgroundColor: `${color}14`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Txt style={[styles.text, { color }]}>{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs },
});
