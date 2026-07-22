import type { Visita } from '@/src/db/schema';

/** Métricas numéricas de uma visita que podem ser plotadas na evolução (UC06). */
export type MetricaKey = keyof Pick<
  Visita,
  | 'paSistolica'
  | 'paDiastolica'
  | 'frequenciaCardiaca'
  | 'glicemiaCapilar'
  | 'glicemiaJejum'
  | 'hba1c'
  | 'colesterolTotal'
  | 'ldl'
  | 'hdl'
  | 'triglicerides'
  | 'peso'
  | 'imc'
  | 'circunferenciaAbdominal'
  | 'creatinina'
  | 'ureia'
  | 'tsh'
  | 'tgo'
  | 'tgp'
  | 'cpk'
  | 'relacaoAlbuminaCreatinina'
>;

export type Metrica = {
  key: MetricaKey;
  label: string;
  unit: string;
  color: string;
};

export const METRICAS: Metrica[] = [
  { key: 'paSistolica', label: 'PA sistólica', unit: 'mmHg', color: '#d1495b' },
  { key: 'paDiastolica', label: 'PA diastólica', unit: 'mmHg', color: '#e07a5f' },
  { key: 'frequenciaCardiaca', label: 'Freq. cardíaca', unit: 'bpm', color: '#3d5a80' },
  { key: 'glicemiaCapilar', label: 'Glicemia capilar', unit: 'mg/dL', color: '#1b998b' },
  { key: 'glicemiaJejum', label: 'Glicemia jejum', unit: 'mg/dL', color: '#2a9d8f' },
  { key: 'hba1c', label: 'HbA1c', unit: '%', color: '#457b9d' },
  { key: 'colesterolTotal', label: 'Colesterol total', unit: 'mg/dL', color: '#8338ec' },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL', color: '#9d4edd' },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL', color: '#00a5cf' },
  { key: 'triglicerides', label: 'Triglicérides', unit: 'mg/dL', color: '#f4a261' },
  { key: 'peso', label: 'Peso', unit: 'kg', color: '#606c38' },
  { key: 'imc', label: 'IMC', unit: '', color: '#7f5539' },
  { key: 'circunferenciaAbdominal', label: 'Circ. abdominal', unit: 'cm', color: '#bc6c25' },
  { key: 'creatinina', label: 'Creatinina', unit: 'mg/dL', color: '#5f0f40' },
  { key: 'ureia', label: 'Ureia', unit: 'mg/dL', color: '#9a6d38' },
  { key: 'tsh', label: 'TSH', unit: 'µUI/mL', color: '#386641' },
  { key: 'tgo', label: 'TGO', unit: 'U/L', color: '#a44a3f' },
  { key: 'tgp', label: 'TGP', unit: 'U/L', color: '#bc4749' },
  { key: 'cpk', label: 'CPK', unit: 'U/L', color: '#6a4c93' },
  { key: 'relacaoAlbuminaCreatinina', label: 'Alb./creat.', unit: 'mg/g', color: '#1d3557' },
];

export type PontoSerie = { t: number; v: number; iso: string };

export type SerieMetrica = Metrica & { pontos: PontoSerie[] };

/**
 * Constrói as séries temporais a partir das visitas (ordem cronológica),
 * incluindo apenas as métricas que possuem ao menos um valor registrado.
 */
export function construirSeries(visitas: Visita[]): SerieMetrica[] {
  const ordenadas = [...visitas].sort((a, b) => a.dataVisita.localeCompare(b.dataVisita));
  return METRICAS.map((m) => {
    const pontos: PontoSerie[] = [];
    for (const v of ordenadas) {
      const valor = v[m.key];
      if (typeof valor === 'number' && Number.isFinite(valor)) {
        pontos.push({ t: new Date(v.dataVisita).getTime(), v: valor, iso: v.dataVisita });
      }
    }
    return { ...m, pontos };
  }).filter((s) => s.pontos.length > 0);
}
