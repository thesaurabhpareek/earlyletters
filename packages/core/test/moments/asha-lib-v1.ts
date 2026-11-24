/**
 * Fixture generator `asha-lib-v1` (NS-53-R107, spec 7.2a and the fixture paragraph of section 12).
 * Synthetic family Asha only: dates, ids and offsets are made by this script; no picture bytes, no
 * real place, no real library. Test-only; never imported from src.
 * Phone zone: America/Los_Angeles. Clock for most cases: Sat 21 Nov 2026 18:00 local.
 */
import { SUBTYPE, KIND_IMAGE, KIND_VIDEO } from '../../src/moments/columns';
import { MOMENTS_RULES, type LibraryWindow, type MomentsRules } from '../../src/moments';

export { KIND_IMAGE, KIND_VIDEO, SUBTYPE };

/** The rules under test: PR 1's data, never a copy (CODE-R13). */
export const ASHA_RULES_V1: MomentsRules = MOMENTS_RULES;

const nthSunday = (year: number, month0: number, n: number) => {
  const first = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
};

/** America/Los_Angeles offset in seconds (US rule: 2nd Sunday March 02:00 to 1st Sunday November 02:00). */
export function laOffsetAt(ms: number): number {
  const y = new Date(ms).getUTCFullYear();
  const start = Date.UTC(y, 2, nthSunday(y, 2, 2), 10); // 02:00 PST
  const end = Date.UTC(y, 10, nthSunday(y, 10, 1), 9); // 02:00 PDT
  return ms >= start && ms < end ? -7 * 3600 : -8 * 3600;
}

/** Local wall time in Los Angeles to UTC ms (the earlier of two readings when the hour repeats). */
export function la(y: number, m: number, d: number, h = 0, mi = 0, s = 0): number {
  const wall = Date.UTC(y, m - 1, d, h, mi, s);
  const pdt = wall + 7 * 3600_000;
  return laOffsetAt(pdt) === -7 * 3600 ? pdt : wall + 8 * 3600_000;
}

export interface Row {
  id: string;
  ms: number;
  kind?: number;
  flags?: number;
  heart?: boolean;
  burst?: string | null;
  durationMs?: number;
}

export function columns(rows: readonly Row[]): LibraryWindow {
  const n = rows.length;
  const c = {
    ids: rows.map((r) => r.id),
    creationMs: new Float64Array(n),
    utcOffsetSec: new Int32Array(n),
    kind: new Uint8Array(n),
    subtypeFlags: new Uint32Array(n),
    favourite: new Uint8Array(n),
    burstId: rows.map((r) => r.burst ?? null),
    placeCell: rows.map(() => null),
    durationMs: new Float64Array(n),
    truncated: false,
  };
  rows.forEach((r, i) => {
    c.utcOffsetSec[i] = laOffsetAt(r.ms);
    c.creationMs[i] = r.ms;
    c.kind[i] = r.kind ?? KIND_IMAGE;
    c.subtypeFlags[i] = r.flags ?? 0;
    c.favourite[i] = r.heart ? 1 : 0;
    c.durationMs[i] = r.durationMs ?? 0;
  });
  return c as LibraryWindow;
}

/** mulberry32: the seeded generator, so a re-run makes the same library. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let seq = 0;
const id = (tag: string) => `${tag}-${String(++seq).padStart(4, '0')}`;
const img = (tag: string, ms: number, extra: Partial<Row> = {}): Row => ({ id: id(tag), ms, ...extra });

export interface AshaCase {
  name: string;
  rows: Row[];
  /** The local day keys expected to come out of grouping, with the candidate count of each. */
  days: Record<string, number>;
  /** The local day keys that qualify under the default rules (no occasion, nothing kept close). */
  qualifying: string[];
}

/** F01 to F06, F08, F13 and F14 of P6 section 6.9 (F09 hidden and F10 shared album are fetch options now, CPrivO-13); the rest need PR 3, 4 or 5 or the native module. */
export function ashaLibV1(): AshaCase[] {
  seq = 0;
  const rnd = seeded(20251112);
  const f01 = [
    ...Array.from({ length: 6 }, (_, i) => img('f01b', la(2026, 11, 14, 9, 0, i * 2), { burst: 'b1' })),
    img('f01s', la(2026, 11, 14, 9, 5), { flags: SUBTYPE.SCREENSHOT }),
    img('f01a', la(2026, 11, 14, 11, 30)),
    img('f01b2', la(2026, 11, 14, 14, 0)),
    img('f01c', la(2026, 11, 14, 16, 30)),
    img('f01d', la(2026, 11, 14, 17, 0)),
  ];
  const f13: Row[] = [];
  for (const d of [3, 4, 5]) for (let k = 0; k < 4; k++) f13.push(img('f13', la(2026, 11, d, 9 + k * 2, Math.floor(rnd() * 50))));
  return [
    { name: 'F01 busy day with burst and screenshot', rows: f01, days: { '2026-11-14': 5 }, qualifying: ['2026-11-14'] },
    {
      name: 'F02 heart and sessions',
      rows: [img('f02', la(2026, 11, 8, 8, 0)), img('f02h', la(2026, 11, 8, 20, 0), { heart: true })],
      days: { '2026-11-08': 2 },
      qualifying: ['2026-11-08'],
    },
    { name: 'F03 lone photo', rows: [img('f03', la(2026, 11, 10, 12))], days: { '2026-11-10': 1 }, qualifying: [] },
    {
      name: 'F04 video only',
      rows: [img('f04', la(2026, 11, 11, 12), { kind: KIND_VIDEO, durationMs: 12_000 })],
      days: { '2026-11-11': 1 },
      qualifying: ['2026-11-11'],
    },
    {
      name: 'F05 midnight split',
      rows: [img('f05a', la(2026, 11, 5, 23, 50)), img('f05b', la(2026, 11, 6, 0, 10))],
      days: { '2026-11-05': 1, '2026-11-06': 1 },
      qualifying: [],
    },
    {
      // Clocks fall back at 02:00 PDT on Sun 1 Nov 2026: 01:30 happens twice and it is still one day.
      name: 'F06 clock change',
      rows: [
        img('f06', la(2026, 11, 1, 0, 30)),
        img('f06', Date.UTC(2026, 10, 1, 8, 30)),
        img('f06', Date.UTC(2026, 10, 1, 9, 30)),
        img('f06', la(2026, 11, 1, 3, 0)),
      ],
      days: { '2026-11-01': 4 },
      qualifying: ['2026-11-01'],
    },
    { name: 'F08 no date', rows: [img('f08', 0), img('f08', Number.NaN)], days: {}, qualifying: [] },
    {
      name: 'F13 three busy days',
      rows: f13,
      days: { '2026-11-03': 4, '2026-11-04': 4, '2026-11-05': 4 },
      qualifying: ['2026-11-03', '2026-11-04', '2026-11-05'],
    },
    {
      name: 'F14 all screenshots',
      rows: Array.from({ length: 12 }, (_, i) => img('f14', la(2026, 11, 7, 9, i), { flags: SUBTYPE.SCREENSHOT })),
      days: {},
      qualifying: [],
    },
  ];
}
