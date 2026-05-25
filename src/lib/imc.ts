export function calcularImc(pesoKg: number, alturaM: number): number | null {
  if (!Number.isFinite(pesoKg) || !Number.isFinite(alturaM)) return null;
  if (pesoKg <= 0 || alturaM <= 0) return null;
  const imc = pesoKg / (alturaM * alturaM);
  return Math.round(imc * 10) / 10;
}

export type ClassificacaoImc =
  | 'baixo'
  | 'normal'
  | 'sobrepeso'
  | 'obesidade1'
  | 'obesidade2'
  | 'obesidade3';

export function classificarImc(imc: number): ClassificacaoImc {
  if (imc < 18.5) return 'baixo';
  if (imc < 25) return 'normal';
  if (imc < 30) return 'sobrepeso';
  if (imc < 35) return 'obesidade1';
  if (imc < 40) return 'obesidade2';
  return 'obesidade3';
}
