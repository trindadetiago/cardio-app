import { z } from 'zod';

import { parseBRDate } from '@/src/lib/date';

const numStr = z.string().refine((v) => {
  if (v === '') return true;
  const parsed = Number(v.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0;
}, 'Valor inválido');

export const MEASUREMENT_FIELDS = [
  'peso',
  'altura',
  'circunferenciaAbdominal',
  'paSistolica',
  'paDiastolica',
  'frequenciaCardiaca',
  'glicemiaJejum',
  'hba1c',
  'colesterolTotal',
  'ldl',
  'hdl',
  'triglicerides',
  'creatinina',
] as const;

export const visitaFormSchema = z
  .object({
    dataVisita: z
      .string()
      .min(1, 'Informe a data')
      .refine((v) => parseBRDate(v) !== null, 'Data inválida'),
    peso: numStr,
    altura: numStr,
    circunferenciaAbdominal: numStr,
    paSistolica: numStr,
    paDiastolica: numStr,
    frequenciaCardiaca: numStr,
    glicemiaJejum: numStr,
    hba1c: numStr,
    colesterolTotal: numStr,
    ldl: numStr,
    hdl: numStr,
    triglicerides: numStr,
    creatinina: numStr,
    observacoes: z.string(),
  })
  .superRefine((data, ctx) => {
    const algumPreenchido = MEASUREMENT_FIELDS.some((k) => data[k].trim() !== '');
    if (!algumPreenchido) {
      ctx.addIssue({
        code: 'custom',
        path: ['peso'],
        message: 'Preencha ao menos um campo da visita',
      });
    }
    const sis = parseOptionalNumber(data.paSistolica);
    const dia = parseOptionalNumber(data.paDiastolica);
    if (sis != null && dia != null && dia >= sis) {
      ctx.addIssue({
        code: 'custom',
        path: ['paDiastolica'],
        message: 'Diastólica deve ser menor que sistólica',
      });
    }
  });

export type VisitaFormValues = z.infer<typeof visitaFormSchema>;

export function parseOptionalNumber(s: string | undefined): number | null {
  if (!s || s.trim() === '') return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
