/** Format an ISO date (YYYY-MM-DD) as a Chinese date, e.g. 2026年6月2日. */
export function formatDateZh(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  return `${y}年${Number(m)}月${Number(d)}日`;
}
