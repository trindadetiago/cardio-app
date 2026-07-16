export function formatBRDate(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function parseBRDate(input: string): string | null {
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (year < 1900) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  if (date.getTime() > Date.now()) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function formatIsoToBR(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function calcularIdade(isoDate: string, reference: Date = new Date()): number | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  let age = reference.getFullYear() - year;
  const monthDiff = reference.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < day)) {
    age--;
  }
  return age >= 0 ? age : null;
}

/** Dias inteiros entre duas datas ISO (b - a). Positivo se b for posterior a a. */
export function diffEmDias(aIso: string, bIso: string): number {
  const a = new Date(aIso.slice(0, 10) + 'T00:00:00Z').getTime();
  const b = new Date(bIso.slice(0, 10) + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Soma `dias` a uma data ISO (usa apenas a parte de data) e devolve YYYY-MM-DD. */
export function somarDias(iso: string, dias: number): string {
  const base = new Date(iso.slice(0, 10) + 'T00:00:00Z').getTime();
  const d = new Date(base + dias * 86_400_000);
  return d.toISOString().slice(0, 10);
}
