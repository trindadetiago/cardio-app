import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { formatIsoToBR } from '@/src/lib/date';
import type { SerieMetrica } from '@/src/features/visitas/metricas';
import { colors, fontFamily, fontSize } from '@/src/theme/tokens';

const ROW_HEIGHT = 64;
const PAD_Y = 10;
const LEGEND_WIDTH = 108;

/**
 * Small multiples alinhados temporalmente (UC06): um mini gráfico de linha por métrica,
 * todos compartilhando o mesmo eixo X (tempo). Cada gráfico tem sua própria escala Y.
 */
export function EvolucaoChart({ series }: { series: SerieMetrica[] }) {
  const [width, setWidth] = useState(0);

  // Domínio de tempo global (compartilhado por todas as linhas).
  const todosTs = series.flatMap((s) => s.pontos.map((p) => p.t));
  const tMin = Math.min(...todosTs);
  const tMax = Math.max(...todosTs);
  const isoMin = series[0]?.pontos[0]?.iso;
  const isoMax = series
    .flatMap((s) => s.pontos)
    .reduce((acc, p) => (p.t > acc.t ? p : acc), series[0].pontos[0]).iso;

  const plotWidth = Math.max(0, width - LEGEND_WIDTH);
  const scaleX = (t: number) => {
    if (tMax === tMin) return plotWidth / 2;
    return ((t - tMin) / (tMax - tMin)) * (plotWidth - 8) + 4;
  };

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 &&
        series.map((s) => {
          const valores = s.pontos.map((p) => p.v);
          const vMin = Math.min(...valores);
          const vMax = Math.max(...valores);
          const range = vMax - vMin || 1;
          const scaleY = (v: number) =>
            ROW_HEIGHT - PAD_Y - ((v - vMin) / range) * (ROW_HEIGHT - PAD_Y * 2);

          const pointsStr = s.pontos.map((p) => `${scaleX(p.t)},${scaleY(p.v)}`).join(' ');
          const ultimo = s.pontos[s.pontos.length - 1];

          return (
            <View key={s.key} style={styles.row} testID={`chart-${s.key}`}>
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <View style={styles.legendText}>
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Text style={styles.legendValue}>
                    {ultimo.v}
                    {s.unit ? ` ${s.unit}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.plot}>
                <Svg width={plotWidth} height={ROW_HEIGHT}>
                  <Line
                    x1={0}
                    y1={ROW_HEIGHT - 1}
                    x2={plotWidth}
                    y2={ROW_HEIGHT - 1}
                    stroke={colors.border}
                    strokeWidth={1}
                  />
                  {s.pontos.length > 1 && (
                    <Polyline
                      points={pointsStr}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {s.pontos.map((p, i) => (
                    <Circle key={i} cx={scaleX(p.t)} cy={scaleY(p.v)} r={3} fill={s.color} />
                  ))}
                </Svg>
              </View>
            </View>
          );
        })}
      {width > 0 && isoMin && (
        <View style={styles.axis}>
          <View style={styles.axisSpacer} />
          <View style={styles.axisDates}>
            <Text style={styles.axisText}>{formatIsoToBR(isoMin)}</Text>
            {isoMax !== isoMin && <Text style={styles.axisText}>{formatIsoToBR(isoMax)}</Text>}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  legend: { width: LEGEND_WIDTH, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { flex: 1 },
  legendLabel: { fontSize: fontSize.xs, color: colors.text, fontFamily: fontFamily.medium },
  legendValue: { fontSize: fontSize.xs, color: colors.textSecondary, fontFamily: fontFamily.regular },
  plot: { flex: 1, height: ROW_HEIGHT },
  axis: { flexDirection: 'row' },
  axisSpacer: { width: LEGEND_WIDTH },
  axisDates: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: 11, color: colors.textMuted, fontFamily: fontFamily.regular },
});
