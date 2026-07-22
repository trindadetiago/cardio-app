import {
  calcularPrioridade,
  classificarRisco,
  temHistoricoCv,
  type PrioridadeVisita,
  type RiscoResultado,
} from '@cardio/shared';
import type { Paciente } from '@/src/db/schema';

/** Campos da visita mais recente necessários para classificar risco (UC03). */
export type UltimaVisitaParams = {
  dataVisita: string;
  paSistolica: number | null;
  paDiastolica: number | null;
  hba1c: number | null;
  ldl: number | null;
};

export type PacienteComRisco = {
  paciente: Paciente;
  risco: RiscoResultado;
  prioridade: PrioridadeVisita;
};

export function avaliarPaciente(
  paciente: Paciente,
  ultimaVisita: UltimaVisitaParams | null,
  hoje?: Date
): PacienteComRisco {
  const risco = classificarRisco(
    {
      historicoCv: temHistoricoCv(paciente.historicoCv),
      dataEventoCv: paciente.dataEventoCv,
      ultimaVisita: ultimaVisita
        ? {
            paSistolica: ultimaVisita.paSistolica,
            paDiastolica: ultimaVisita.paDiastolica,
            hba1c: ultimaVisita.hba1c,
            ldl: ultimaVisita.ldl,
          }
        : null,
    },
    hoje
  );

  const prioridade = calcularPrioridade(
    { visitaMaisRecente: paciente.visitaMaisRecente, risco: risco.nivel },
    hoje
  );

  return { paciente, risco, prioridade };
}
