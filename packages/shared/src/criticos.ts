export type Severidade = 'ok' | 'alerta' | 'critico';

export type ResultadoCritico = {
  severidade: Severidade;
  mensagem: string | null;
};

const OK: ResultadoCritico = { severidade: 'ok', mensagem: null };

export function avaliarPressaoArterial(
  sistolica: number | null,
  diastolica: number | null
): ResultadoCritico {
  if (sistolica == null && diastolica == null) return OK;
  const s = sistolica ?? 0;
  const d = diastolica ?? 0;
  if (s >= 180 || d >= 120) {
    return { severidade: 'critico', mensagem: 'Crise hipertensiva (≥180/120)' };
  }
  if (s >= 140 || d >= 90) {
    return { severidade: 'alerta', mensagem: 'Hipertensão (≥140/90)' };
  }
  if ((s > 0 && s < 90) || (d > 0 && d < 60)) {
    return { severidade: 'alerta', mensagem: 'Hipotensão (<90/60)' };
  }
  return OK;
}

export function avaliarGlicemiaJejum(valor: number | null): ResultadoCritico {
  if (valor == null) return OK;
  // Limiar de alerta vermelho definido no documento de requisitos (UC05): ≥ 250 mg/dL.
  if (valor >= 250) return { severidade: 'critico', mensagem: 'Hiperglicemia grave (≥250)' };
  if (valor >= 126) return { severidade: 'alerta', mensagem: 'Glicemia elevada (≥126)' };
  if (valor < 70) return { severidade: 'alerta', mensagem: 'Hipoglicemia (<70)' };
  return OK;
}

export function avaliarLdl(valor: number | null): ResultadoCritico {
  if (valor == null) return OK;
  if (valor >= 190) return { severidade: 'critico', mensagem: 'LDL muito alto (≥190)' };
  if (valor >= 130) return { severidade: 'alerta', mensagem: 'LDL alto (≥130)' };
  return OK;
}

// Tons escurecidos em relação ao amber-600/red-600 originais para atender
// contraste AA (4.5:1) como texto sobre fundo branco/claro.
export const SEVERIDADE_COR: Record<Severidade, string> = {
  ok: '#CBD5E1',
  alerta: '#B45309',
  critico: '#B91C1C',
};
