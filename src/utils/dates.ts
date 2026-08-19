export function parseWeddingDate(value: string): Date | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatWeddingDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  const parsed = parseWeddingDate(value);
  return parsed ? new Intl.DateTimeFormat('en-ZA', options).format(parsed) : 'Date to be confirmed';
}
