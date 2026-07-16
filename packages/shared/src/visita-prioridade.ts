import { diffEmDias, somarDias } from './date.ts';
import type { RiscoNivel } from './types.ts';

/**
 * Prioridade de visita — UC04.
 *
 * Intervalo esperado entre visitas:
 *   - Controlado (verde):            a cada 3 meses (90 dias).
 *   - Não controlado (amarelo/verm.): a cada 1 mês (30 dias).
 *   - Sem dados: tratado como não controlado (precisa de acompanhamento) => 30 dias.
 *
 * A próxima visita = "visita mais recente" + intervalo.
 * `diasRestantes` positivo = ainda há prazo; negativo = atrasada.
 * Pacientes sem nenhuma visita são a maior prioridade (nunca visitados).
 */

export const INTERVALO_CONTROLADO_DIAS = 90;
export const INTERVALO_NAO_CONTROLADO_DIAS = 30;

export function intervaloDias(risco: RiscoNivel): number {
  return risco === 'verde' ? INTERVALO_CONTROLADO_DIAS : INTERVALO_NAO_CONTROLADO_DIAS;
}

export type PrioridadeInput = {
  /** Data ISO da visita mais recente, ou null se nunca visitado. */
  visitaMaisRecente: string | null;
  risco: RiscoNivel;
};

export type PrioridadeVisita = {
  nuncaVisitado: boolean;
  proximaVisitaIso: string | null;
  /** Dias até a próxima visita (negativo = atrasada). Null se nunca visitado. */
  diasRestantes: number | null;
  atrasada: boolean;
};

export function calcularPrioridade(
  input: PrioridadeInput,
  hoje: Date = new Date()
): PrioridadeVisita {
  if (!input.visitaMaisRecente) {
    return {
      nuncaVisitado: true,
      proximaVisitaIso: null,
      diasRestantes: null,
      atrasada: true,
    };
  }
  const hojeIso = hoje.toISOString().slice(0, 10);
  const proximaVisitaIso = somarDias(input.visitaMaisRecente, intervaloDias(input.risco));
  const diasRestantes = diffEmDias(hojeIso, proximaVisitaIso);
  return {
    nuncaVisitado: false,
    proximaVisitaIso,
    diasRestantes,
    atrasada: diasRestantes < 0,
  };
}

/**
 * Comparador para ordenar por prioridade (UC04): maior prioridade primeiro.
 * Ordem: nunca visitados → mais atrasados → menos tempo até a próxima visita.
 */
export function compararPrioridade(a: PrioridadeVisita, b: PrioridadeVisita): number {
  if (a.nuncaVisitado && !b.nuncaVisitado) return -1;
  if (!a.nuncaVisitado && b.nuncaVisitado) return 1;
  if (a.nuncaVisitado && b.nuncaVisitado) return 0;
  return (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0);
}

/** Texto amigável descrevendo a situação da visita (ex.: "3 dias atrasado", "5 dias para visita"). */
export function descreverPrioridade(p: PrioridadeVisita): string {
  if (p.nuncaVisitado) return 'Sem visitas';
  const d = p.diasRestantes ?? 0;
  if (d === 0) return 'Hoje';
  if (d < 0) return `${Math.abs(d)} ${Math.abs(d) === 1 ? 'dia' : 'dias'} atrasado`;
  return `${d} ${d === 1 ? 'dia' : 'dias'} para visita`;
}
