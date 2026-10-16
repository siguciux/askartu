const DAYS = [
  'sekmadienis',
  'pirmadienis',
  'antradienis',
  'trečiadienis',
  'ketvirtadienis',
  'penktadienis',
  'šeštadienis',
];

const MONTHS = [
  'sausio',
  'vasario',
  'kovo',
  'balandžio',
  'gegužės',
  'birželio',
  'liepos',
  'rugpjūčio',
  'rugsėjo',
  'spalio',
  'lapkričio',
  'gruodžio',
];

/** „08:05“ */
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** „penktadienis“ */
export function formatWeekday(date: Date): string {
  return DAYS[date.getDay()];
}

/** „spalio 16 d.“ */
export function formatDayMonth(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()} d.`;
}

/** Pasisveikinimas pagal paros laiką. */
export function greeting(date: Date): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Labas rytas';
  if (h >= 12 && h < 18) return 'Laba diena';
  return 'Labas vakaras';
}
