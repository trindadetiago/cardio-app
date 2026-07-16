import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/features/auth/auth-context';
import { autoPush } from '@/src/features/sync/sync-manager';
import { PACIENTES_QUERY_KEY, pacienteByIdKey } from '@/src/features/pacientes/pacientes-hooks';
import type { VisitaFormValues } from './visita-schema';
import { createVisita, listVisitasByPaciente } from './visitas-service';

export const visitasByPacienteKey = (pacienteId: string) =>
  ['visitas', pacienteId] as const;

export function useVisitasByPaciente(pacienteId: string) {
  return useQuery({
    queryKey: visitasByPacienteKey(pacienteId),
    queryFn: () => listVisitasByPaciente(pacienteId),
    enabled: !!pacienteId,
  });
}

export function useCreateVisita(pacienteId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: (values: VisitaFormValues) => {
      if (!session) throw new Error('Sessão não encontrada');
      return createVisita(pacienteId, values, session.agenteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visitasByPacienteKey(pacienteId) });
      queryClient.invalidateQueries({ queryKey: pacienteByIdKey(pacienteId) });
      queryClient.invalidateQueries({ queryKey: PACIENTES_QUERY_KEY });
      autoPush(session?.agenteId);
    },
  });
}
