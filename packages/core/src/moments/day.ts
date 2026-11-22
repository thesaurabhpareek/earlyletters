/**
 * Local calendar day through `offsetAt(ms)`: the UTC offset in seconds the phone's zone has at that
 * instant (NS-53-R39, R223). Core never reads a zone database (no Intl; scoped to `moments/`).
 */
export type OffsetAt = (ms: number) => number;

/** Days since 1970-01-01 to a civil date (proleptic Gregorian; Hinnant's algorithm). */
function civil(z: number): [number, number, number] {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return [yoe + era * 400 + (m <= 2 ? 1 : 0), m, d];
}

/** Local ISO date (`YYYY-MM-DD`, no zone) of an instant. */
export function dayKeyOf(ms: number, offsetAt: OffsetAt): string {
  // ASSUMED: a non-finite offset reads as UTC, so the key is always a real date.
  const raw = offsetAt(ms);
  const off = Number.isFinite(raw) ? raw : 0;
  const [y, m, d] = civil(Math.floor((ms / 1000 + off) / 86400));
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
