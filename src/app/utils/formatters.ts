export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatCompactBRL(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return `R$ ${Math.round(value)}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-');
  const names = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const idx = Math.max(0, Math.min(11, Number(month) - 1));
  return `${names[idx]}/${year}`;
}

export function formatShortMonth(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [, month] = monthKey.split('-');
  const names = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return names[Math.max(0, Math.min(11, Number(month) - 1))];
}

export function addMonths(monthKey: string, offset: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + offset;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

export function monthDiff(fromMonthKey: string, toMonthKey: string): number {
  const [y1, m1] = fromMonthKey.split('-').map(Number);
  const [y2, m2] = toMonthKey.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
