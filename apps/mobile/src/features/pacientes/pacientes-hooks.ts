import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/features/auth/auth-context';
import type { PacienteFormValues } from './paciente-schema';
import {
  createPaciente,
  findPacienteById,
  listPacientes,
  listPacientesComRisco,
} from './pacientes-service';

export const PACIENTES_QUERY_KEY = ['pacientes'] as const;
export const PACIENTES_RISCO_QUERY_KEY = ['pacientes', 'risco'] as const;
export const pacienteByIdKey = (id: string) => ['paciente', id] as const;

export function usePacientes() {
  return useQuery({
    queryKey: PACIENTES_QUERY_KEY,
    queryFn: listPacientes,
  });
}

/** Pacientes com risco (UC03) e prioridade de visita (UC04) já calculados. */
export function usePacientesComRisco() {
  return useQuery({
    queryKey: PACIENTES_RISCO_QUERY_KEY,
    queryFn: listPacientesComRisco,
  });
}

export function usePaciente(id: string) {
  return useQuery({
    queryKey: pacienteByIdKey(id),
    queryFn: () => findPacienteById(id),
    enabled: !!id,
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: (values: PacienteFormValues) => {
      if (!session) throw new Error('Sessão não encontrada');
      return createPaciente(values, session.agenteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACIENTES_QUERY_KEY });
    },
  });
}
