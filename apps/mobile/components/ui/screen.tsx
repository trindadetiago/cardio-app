import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/tokens';

/** Contêiner de tela com fundo do tema e safe-area. */
export function Screen({
  edges = ['top'],
  style,
  children,
  ...rest
}: ViewProps & { edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View {...rest} style={[styles.inner, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1 },
});
