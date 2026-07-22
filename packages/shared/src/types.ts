export type Sexo = 'M' | 'F';

/** Nível de classificação de risco cardiovascular (UC03). */
export type RiscoNivel = 'verde' | 'amarelo' | 'vermelho' | 'sem_dados';

/** Status de tabagismo (RF002): fumante / ex-fumante / não fumante. */
export type Tabagismo = 'fumante' | 'ex_fumante' | 'nao_fumante';

export const TABAGISMO_OPCOES: Tabagismo[] = ['nao_fumante', 'ex_fumante', 'fumante'];

export const TABAGISMO_LABEL: Record<Tabagismo, string> = {
  nao_fumante: 'Não fumante',
  ex_fumante: 'Ex-fumante',
  fumante: 'Fumante',
};

/** Nível de atividade física (RF002). */
export type AtividadeFisica =
  | 'nao_praticante'
  | 'raramente'
  | 'regularmente'
  | 'frequentemente';

export const ATIVIDADE_FISICA_OPCOES: AtividadeFisica[] = [
  'nao_praticante',
  'raramente',
  'regularmente',
  'frequentemente',
];

export const ATIVIDADE_FISICA_LABEL: Record<AtividadeFisica, string> = {
  nao_praticante: 'Não praticante',
  raramente: 'Raramente',
  regularmente: 'Regularmente',
  frequentemente: 'Frequentemente',
};

/** Histórico de evento cardiovascular aterosclerótico (RF002): Não / IAM / AVC / DAP / outro. */
export type HistoricoCv = 'nao' | 'iam' | 'avc' | 'dap' | 'outro';

export const HISTORICO_CV_OPCOES: HistoricoCv[] = ['nao', 'iam', 'avc', 'dap', 'outro'];

export const HISTORICO_CV_LABEL: Record<HistoricoCv, string> = {
  nao: 'Não',
  iam: 'IAM (infarto)',
  avc: 'AVC',
  dap: 'DAP',
  outro: 'Outro',
};

/** True quando o paciente tem qualquer histórico de evento CV aterosclerótico. */
export function temHistoricoCv(h: HistoricoCv): boolean {
  return h !== 'nao';
}
