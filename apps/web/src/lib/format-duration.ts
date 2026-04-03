/** Kart / oynatıcı için kısa süre metni (örn. "2 dk", "1 sa 4 dk"). */
export function formatDurationShort(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const s = Math.floor(seconds);
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} sa ${rm} dk` : `${h} sa`;
}
