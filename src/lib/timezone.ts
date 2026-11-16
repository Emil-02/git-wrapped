/** Parses a timezone offset in minutes east of UTC (e.g. 420 for UTC+7). */
export function parseTzOffset(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (!/^-?\d{1,3}$/.test(value)) return null;
  const offset = Number(value);
  return offset >= -720 && offset <= 840 ? offset : null;
}
