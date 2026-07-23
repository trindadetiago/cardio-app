import { useState } from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { formatIsoToBR } from '@/src/lib/date';
import type { SerieMetrica } from '@/src/features/visitas/metricas';
import { colors, fontFamily, fontSize } from '@/src/theme/tokens';

const ROW_HEIGHT = 90;
const PAD_Y = 12;
const LEGEND_WIDTH = 108;

const LIMITES: Record<string, { valor: number; label: string }> = {
  pa_sistolica:   { valor: 140, label: '140' },
  pa_diastolica:  { valor: 90,  label: '90'  },
  glicemia_jejum: { valor: 126, label: '126' },
  hba1c:          { valor: 7,   label: '7%'  },
  ldl:            { valor: 130, label: '130' },
};

export function EvoluacaoChart({ series }: { series: SerieMetrica[] }) {
  const [width, setWidth] = useState(0);
  const [tooltip, setTooltip] = useState<{
    key: string; index: number; x: number; y: number; valor: number; unit: string;
  } | null>(null);

  const todosTss = series.flatMap((s) => s.pontos.map((p) => p.t));
  const tMin = Math.min(...todosTss);
  const tMax = Math.max(...todosTss);
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
    <View
      style={styles.container}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 &&
        series.map((s) => {
          const valores = s.pontos.map((p) => p.v);
          const vMin = Math.min(...valores);
          const vMax = Math.max(...valores);
          const range = vMax - vMin || 1;

          const scaleY = (v: number) =>
            ROW_HEIGHT - PAD_Y - ((v - vMin) / range) * (ROW_HEIGHT - PAD_Y * 2);

          const pointsStr = s.pontos
            .map((p) => `${scaleX(p.t)},${scaleY(p.v)}`)
            .join(' ');

          const firstX = scaleX(s.pontos[0].t);
          const lastX  = scaleX(s.pontos[s.pontos.length - 1].t);
          const areaStr = `${firstX},${ROW_HEIGHT - PAD_Y} ${pointsStr} ${lastX},${ROW_HEIGHT - PAD_Y}`;

          const ultimo = s.pontos[s.pontos.length - 1];
          const limite = LIMITES[s.key];
          const limiteY = limite
            ? scaleY(Math.min(Math.max(limite.valor, vMin), vMax))
            : null;

          const tooltipAtivo = tooltip?.key === s.key ? tooltip : null;

          return (
            <View key={s.key} style={styles.row} testID={`chart-${s.key}`}>

              {/* Legenda */}
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

              {/* Gráfico SVG */}
              <View style={styles.plot}>
                <Svg width={plotWidth} height={ROW_HEIGHT}>

                  {/* Linha base */}
                  <Line
                    x1={0} y1={ROW_HEIGHT - 1}
                    x2={plotWidth} y2={ROW_HEIGHT - 1}
                    stroke={colors.border}
                    strokeWidth={1}
                  />

                  {/* Área preenchida */}
                  {s.pontos.length > 1 && (
                    <Polygon
                      points={areaStr}
                      fill={s.color}
                      fillOpacity={0.08}
                    />
                  )}

                  {/* Linha de referência clínica */}
                  {limiteY !== null && (
                    <>
                      <Line
                        x1={0} y1={limiteY}
                        x2={plotWidth} y2={limiteY}
                        stroke={colors.danger ?? '#EF4444'}
                        strokeWidth={1}
                        strokeDasharray="4,3"
                      />
                      <SvgText
                        x={plotWidth - 2}
                        y={limiteY - 3}
                        fontSize={9}
                        fill={colors.danger ?? '#EF4444'}
                        textAnchor="end"
                        fontFamily={fontFamily.regular}
                      >
                        {limite!.label}
                      </SvgText>
                    </>
                  )}

                  {/* Linha do gráfico */}
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

                  {/* Valores numéricos sobre cada ponto */}
                  {s.pontos.map((p, i) => (
                    <SvgText
                      key={`val-${i}`}
                      x={scaleX(p.t)}
                      y={scaleY(p.v) - 7}
                      fontSize={9}
                      fill={s.color}
                      textAnchor="middle"
                      fontFamily={fontFamily.medium}
                    >
                      {p.v}
                    </SvgText>
                  ))}

                  {/* Pontos tocáveis */}
                  {s.pontos.map((p, i) => {
                    const cx = scaleX(p.t);
                    const cy = scaleY(p.v);
                    const ativo = tooltipAtivo?.index === i;
                    return (
                      <TouchableWithoutFeedback
                        key={i}
                        onPress={() =>
                          setTooltip(
                            ativo
                              ? null
                              : { key: s.key, index: i, x: cx, y: cy, valor: p.v, unit: s.unit }
                          )
                        }
                      >
                        <Circle
                          cx={cx} cy={cy}
                          r={ativo ? 5 : 3}
                          fill={ativo ? colors.background : s.color}
                          stroke={s.color}
                          strokeWidth={ativo ? 2 : 0}
                        />
                      </TouchableWithoutFeedback>
                    );
                  })}

                  {/* Tooltip do ponto tocado */}
                  {tooltipAtivo && (() => {
                    const tx = tooltipAtivo.x;
                    const ty = tooltipAtivo.y;
                    const boxW = 52;
                    const boxH = 22;
                    const bx = Math.min(Math.max(tx - boxW / 2, 2), plotWidth - boxW - 2);
                    const by = ty - boxH - 6 < 0 ? ty + 8 : ty - boxH - 6;
                    return (
                      <>
                        <Line
                          x1={tx} y1={0}
                          x2={tx} y2={ROW_HEIGHT - 1}
                          stroke={s.color}
                          strokeWidth={1}
                          strokeDasharray="3,2"
                          strokeOpacity={0.4}
                        />
                        <Polygon
                          points={`${bx},${by} ${bx + boxW},${by} ${bx + boxW},${by + boxH} ${bx},${by + boxH}`}
                          fill={colors.surface ?? '#1E293B'}
                        />
                        <SvgText
                          x={bx + boxW / 2}
                          y={by + boxH / 2 + 4}
                          fontSize={11}
                          fill={colors.text}
                          textAnchor="middle"
                          fontFamily={fontFamily.medium}
                        >
                          {tooltipAtivo.valor}{tooltipAtivo.unit ? ` ${tooltipAtivo.unit}` : ''}
                        </SvgText>
                      </>
                    );
                  })()}

                </Svg>
              </View>
            </View>
          );
        })}

      {/* Eixo de datas */}
      {width > 0 && isoMin && (
        <View style={styles.axis}>
          <View style={styles.axisSpacer} />
          <View style={styles.axisDates}>
            <Text style={styles.axisText}>{formatIsoToBR(isoMin)}</Text>
            {isoMax !== isoMin && (
              <Text style={styles.axisText}>{formatIsoToBR(isoMax)}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { gap: 4 },
  row:         { flexDirection: 'row', alignItems: 'center' },
  legend:      { width: LEGEND_WIDTH, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { flex: 1 },
  legendLabel: { fontSize: fontSize.xs, color: colors.text, fontFamily: fontFamily.medium },
  legendValue: { fontSize: fontSize.xs, color: colors.textSecondary, fontFamily: fontFamily.regular },
  plot:        { flex: 1, height: ROW_HEIGHT },
  axis:        { flexDirection: 'row' },
  axisSpacer:  { width: LEGEND_WIDTH },
  axisDates:   { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  axisText:    { fontSize: 11, color: colors.textMuted, fontFamily: fontFamily.regular },
});