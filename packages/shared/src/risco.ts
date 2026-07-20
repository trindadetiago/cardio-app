import { diffEmDias } from './date.ts';
import type { RiscoNivel } from './types.ts';

/**
 * Classificação de risco cardiovascular — UC03.
 *
 * O documento define meta para três parâmetros:
 *   - Pressão arterial (PA):  meta = PA < 140/90
 *   - HbA1c:                  meta = HbA1c < 7%
 *   - LDL:                    meta = LDL < 130 mg/dL
 *
 * Regras:
 *   - Controlado (verde):  todos os parâmetros dentro da meta e sem evento CV no último ano.
 *   - Moderado (amarelo):  1 ou 2 parâmetros fora da meta e SEM histórico de evento CV aterosclerótico.
 *   - Grave (vermelho):    3+ parâmetros fora da meta OU evento recente (dentro de um ano).
 *
 * Decisões de projeto (pontos em aberto no documento — ver PLANO §2.1):
 *   - PA conta como UM parâmetro composto (sistólica e/ou diastólica).
 *   - 1–2 parâmetros fora da meta em paciente COM histórico aterosclerótico (mesmo não recente)
 *     escala para vermelho, pois o documento restringe "amarelo" a pacientes sem histórico.
 *   - Sem visita registrada (ou sem nenhum dos três parâmetros coletados) e sem evento recente
 *     => "sem_dados": não há base para afirmar que está controlado.
 */

export const META = {
  PA_SISTOLICA_MAX: 140,
  PA_DIASTOLICA_MAX: 90,
  HBA1C_MAX: 7,
  LDL_MAX: 130,
} as const;

export const JANELA_EVENTO_DIAS = 365;

export type ParametrosVisita = {
  paSistolica: number | null;
  paDiastolica: number | null;
  hba1c: number | null;
  ldl: number | null;
};

export type RiscoInput = {
  historicoCv: boolean;
  /** Data do evento cardiovascular (ISO). Null se não houver. */
  dataEventoCv: string | null;
  /** Parâmetros da visita mais recente, ou null se o paciente nunca teve visita. */
  ultimaVisita: ParametrosVisita | null;
};

export type RiscoResultado = {
  nivel: RiscoNivel;
  /** Quantidade de parâmetros fora da meta (0–3). */
  parametrosForaDaMeta: number;
  /** Quantos dos três parâmetros tinham dados para avaliar. */
  parametrosAvaliados: number;
  eventoRecente: boolean;
  motivo: string;
};

function paForaDaMeta(sist: number | null, dias: number | null): boolean | null {
  if (sist == null && dias == null) return null;
  const s = sist ?? 0;
  const d = dias ?? 0;
  return s >= META.PA_SISTOLICA_MAX || d >= META.PA_DIASTOLICA_MAX;
}

function eventoRecente(dataEventoCv: string | null, hojeIso: string): boolean {
  if (!dataEventoCv) return false;
  const dias = diffEmDias(dataEventoCv, hojeIso);
  // Evento no futuro (dias < 0) ou dentro da janela conta como recente.
  return dias <= JANELA_EVENTO_DIAS;
}

export function classificarRisco(
  input: RiscoInput,
  hoje: Date = new Date()
): RiscoResultado {
  const hojeIso = hoje.toISOString().slice(0, 10);
  const recente = eventoRecente(input.dataEventoCv, hojeIso);

  const v = input.ultimaVisita;
  const avaliacoes: (boolean | null)[] = v
    ? [
        paForaDaMeta(v.paSistolica, v.paDiastolica),
        v.hba1c == null ? null : v.hba1c >= META.HBA1C_MAX,
        v.ldl == null ? null : v.ldl >= META.LDL_MAX,
      ]
    : [null, null, null];

  const avaliados = avaliacoes.filter((a) => a !== null) as boolean[];
  const parametrosAvaliados = avaliados.length;
  const parametrosForaDaMeta = avaliados.filter(Boolean).length;

  const base = { parametrosForaDaMeta, parametrosAvaliados, eventoRecente: recente };

  if (recente) {
    return { ...base, nivel: 'vermelho', motivo: 'Evento cardiovascular recente (≤ 1 ano)' };
  }
  if (parametrosAvaliados === 0) {
    return { ...base, nivel: 'sem_dados', motivo: 'Sem dados de exame para classificar' };
  }
  if (parametrosForaDaMeta >= 3) {
    return { ...base, nivel: 'vermelho', motivo: '3 ou mais parâmetros fora da meta' };
  }
  if (parametrosForaDaMeta >= 1) {
    if (input.historicoCv) {
      return {
        ...base,
        nivel: 'vermelho',
        motivo: 'Parâmetros fora da meta com histórico cardiovascular',
      };
    }
    return {
      ...base,
      nivel: 'amarelo',
      motivo: `${parametrosForaDaMeta} parâmetro(s) fora da meta`,
    };
  }
  return { ...base, nivel: 'verde', motivo: 'Parâmetros dentro da meta' };
}

// Tons escurecidos em relação ao verde-600/amber-600/red-600 originais para
// atender contraste AA (4.5:1) como texto sobre fundo branco/claro.
export const RISCO_COR: Record<RiscoNivel, string> = {
  verde: '#047857',
  amarelo: '#B45309',
  vermelho: '#B91C1C',
  sem_dados: '#64748B',
};

export const RISCO_LABEL: Record<RiscoNivel, string> = {
  verde: 'Controlado',
  amarelo: 'Moderado',
  vermelho: 'Grave',
  sem_dados: 'Sem dados',
};
