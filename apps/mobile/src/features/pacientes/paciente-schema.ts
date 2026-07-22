import { z } from 'zod';

import { isValidCpf } from '@/src/lib/cpf';
import { parseBRDate } from '@/src/lib/date';

export const pacienteFormSchema = z
  .object({
    cpf: z.string().refine(isValidCpf, 'CPF inválido'),
    nome: z.string().trim().min(3, 'Nome muito curto'),
    dataNascimento: z
      .string()
      .min(1, 'Informe a data de nascimento')
      .refine((v) => parseBRDate(v) !== null, 'Data inválida'),
    sexo: z.enum(['M', 'F'], { message: 'Selecione o sexo' }),
    tabagismo: z.enum(['nao_fumante', 'ex_fumante', 'fumante'], {
      message: 'Selecione o tabagismo',
    }),
    atividadeFisica: z.enum(
      ['nao_praticante', 'raramente', 'regularmente', 'frequentemente'],
      { message: 'Selecione a atividade física' }
    ),
    estatina: z.boolean(),
    historicoCv: z.enum(['nao', 'iam', 'avc', 'dap', 'outro'], {
      message: 'Selecione o histórico CV',
    }),
    dataEventoCv: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.historicoCv === 'nao') return;
    if (!data.dataEventoCv || data.dataEventoCv.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['dataEventoCv'],
        message: 'Informe a data do evento CV',
      });
      return;
    }
    const eventoIso = parseBRDate(data.dataEventoCv);
    if (!eventoIso) {
      ctx.addIssue({ code: 'custom', path: ['dataEventoCv'], message: 'Data inválida' });
      return;
    }
    const nascIso = parseBRDate(data.dataNascimento);
    if (nascIso && eventoIso < nascIso) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataEventoCv'],
        message: 'Evento anterior à data de nascimento',
      });
    }
  });

export type PacienteFormValues = z.infer<typeof pacienteFormSchema>;
