/**
 * Design tokens do CardioRemoto.
 *
 * Estilo "Accessible & Ethical" para saúde: cyan calmo + verde clínico, alto contraste,
 * cantos suaves, sombras discretas. Cores semânticas de risco (verde/amarelo/vermelho).
 * Tipografia: Figtree (uma família, hierarquia por peso).
 */

export const colors = {
  // Marca
  primary: '#0891B2', // cyan-600
  primaryDark: '#0E7490', // cyan-700
  primaryTint: '#E0F7FB', // fundo de chips/seleção
  onPrimary: '#FFFFFF',
  accent: '#059669', // green-600

  // Superfícies e neutros
  background: '#F4F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9', // slate-100
  border: '#E2E8F0', // slate-200
  borderStrong: '#CBD5E1', // slate-300

  // Texto
  text: '#0F172A', // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#94A3B8', // slate-400

  // Risco (UC03) e severidade (UC05)
  verde: '#059669',
  amarelo: '#D97706', // amber-600 (contraste suficiente para texto)
  vermelho: '#DC2626', // red-600
  semDados: '#64748B', // slate-500

  // Tints para fundos de estado
  verdeTint: '#ECFDF5',
  amareloTint: '#FFFBEB',
  vermelhoTint: '#FEF2F2',

  // Estados
  danger: '#DC2626',
  dangerTint: '#FEF2F2',
  disabledOpacity: 0.45,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  h2: 24,
  h1: 28,
} as const;

export const fontFamily = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

export const elevation = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  fab: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
