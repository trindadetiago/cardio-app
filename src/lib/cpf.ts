export function onlyDigits(input: string): string {
  return input.replace(/\D/g, '');
}

export function formatCpf(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function isValidCpf(input: string): boolean {
  const d = onlyDigits(input);
  if (d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;

  const calcCheck = (slice: string, weightStart: number): number => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i], 10) * (weightStart - i);
    }
    const remainder = 11 - (sum % 11);
    return remainder >= 10 ? 0 : remainder;
  };

  const d1 = calcCheck(d.slice(0, 9), 10);
  if (d1 !== parseInt(d[9], 10)) return false;
  const d2 = calcCheck(d.slice(0, 10), 11);
  return d2 === parseInt(d[10], 10);
}
