import { useWindowDimensions } from 'react-native';

/**
 * Breakpoints do RFN002:
 *   - small:  320–480px (mobile pequeno)
 *   - large:  481–767px (mobile grande)
 *   - tablet: 768–1024px (tablet)
 */
export type Breakpoint = 'small' | 'large' | 'tablet';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const breakpoint: Breakpoint = width >= 768 ? 'tablet' : width >= 481 ? 'large' : 'small';
  const isTablet = breakpoint === 'tablet';
  // Em telas largas, limita a largura do conteúdo e centraliza para evitar linhas enormes.
  const contentMaxWidth = isTablet ? 720 : undefined;
  return { width, breakpoint, isTablet, contentMaxWidth };
}
