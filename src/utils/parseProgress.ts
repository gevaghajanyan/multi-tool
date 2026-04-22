const TIME_RE = /time=(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})/;
const DURATION_RE = /Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})/;

function toSeconds(
  h: string,
  m: string,
  s: string,
  ms: string,
): number {
  return (
    Number(h) * 3600 +
    Number(m) * 60 +
    Number(s) +
    Number(ms.padEnd(3, "0")) / 1000
  );
}

export function parseDuration(log: string): number | null {
  const m = log.match(DURATION_RE);
  if (!m) return null;
  return toSeconds(m[1], m[2], m[3], m[4]);
}

export function parseProgress(
  log: string,
  duration: number,
): number | null {
  if (!duration || duration <= 0) return null;
  const m = log.match(TIME_RE);
  if (!m) return null;
  const current = toSeconds(m[1], m[2], m[3], m[4]);
  const pct = Math.max(0, Math.min(100, (current / duration) * 100));
  return pct;
}
