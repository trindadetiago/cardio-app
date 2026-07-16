import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fontFamily, fontSize } from '@/src/theme/tokens';

export type TxtVariant =
  | 'h1'
  | 'h2'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption'
  | 'overline';

const VARIANTS: Record<TxtVariant, TextStyle> = {
  h1: { fontFamily: fontFamily.bold, fontSize: fontSize.h1, color: colors.text, letterSpacing: -0.5 },
  h2: { fontFamily: fontFamily.bold, fontSize: fontSize.h2, color: colors.text, letterSpacing: -0.3 },
  title: { fontFamily: fontFamily.semibold, fontSize: fontSize.xxl, color: colors.text },
  subtitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.xl, color: colors.text },
  body: { fontFamily: fontFamily.regular, fontSize: fontSize.base, color: colors.text, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.text },
  label: { fontFamily: fontFamily.medium, fontSize: fontSize.md, color: colors.text },
  caption: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
};

type Props = TextProps & {
  variant?: TxtVariant;
  color?: string;
};

export function Txt({ variant = 'body', color, style, ...rest }: Props) {
  return <Text {...rest} style={[VARIANTS[variant], color ? { color } : null, style]} />;
}
