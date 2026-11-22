/**
 * The Moments real-library harness (BL-1449, PR 3b, NS-53-R40, R205, R281). Pure functions: no
 * file access, no clock, no network. It runs core/moments on a phone export, one grid cell at a
 * time, and returns COUNTS ONLY. Nothing here returns or prints an id, a day key, a date, a place
 * or a picture. The bar and decision rule are in moments-bar.ts (written before this file).
 */
// Deliberate deep imports from core: the harness reads the engine's own modules, not a public barrel, so a run uses exactly the rules the app ships.
import { dayPlace, windowPlaces } from '../packages/core/src/moments/place';
import { groupByDay, type DayGroup } from '../packages/core/src/moments/group';
import { qualifyDay } from '../packages/core/src/moments/qualify';
import { REASON_PRECEDENCE, type Reason } from '../packages/core/src/moments/reasons';
import { MOMENTS_RULES, WINDOW_DAYS, type MomentsRules, type SpanPredicate } from '../packages/core/src/moments/rules';
import { KIND_IMAGE, KIND_VIDEO } from '../packages/core/src/moments/columns';
import type { LibraryWindow } from '../packages/core/src/moments/types';
import { GRID, JUNK_BAR, MAX_WRONG_REASONS, MIN_QUALIFYING_PER_14_DAYS } from './moments-bar';

/** An error whose message is safe to print: fixed words, never an input line, path or value. */
export class HarnessError extends Error {}

/**
 * HONEST STATUS of the wrong-reason count: it is a PLACEHOLDER that cannot fail today. core/moments
 * has no shown-reason logic yet (reasons.ts holds only the closed list and REASON_PRECEDENCE), so the
 * "shown" reason below is derived here from the same predicates the check then tests, and agrees with
 * itself by construction. It becomes a real check when core ships its own table-driven reasons (spec
 * NS-53-R205; PR 4 builds the occasions and the momentsFor registry, and no PR row names the library
 * reasons separately, so that owner is to be named by the spec). Until then, a 0 here proves nothing.
 */
export const WRONG_REASON_STATUS = 'placeholder: cannot fail until core ships its own shown-reason logic (spec NS-53-R205, PR 4 and its follow-up)';

/** Eligibility of a cell (spec 7.2a: at least 3 of every 14 days qualify, and zero wrong reasons). */
export function isEligible(qualifying: number, per14: number, wrong: number): boolean {
  return qualifying > 0 && per14 >= MIN_QUALIFYING_PER_14_DAYS && wrong <= MAX_WRONG_REASONS;
}

/** One asset of the export: only what the engine reads. No filename, no coordinate. */
export interface ExportRow {
  /** UTC milliseconds. */
  t: number;
  /** Seconds east of UTC at that instant. */
  off: number;
  kind: 'image' | 'video';
  fav?: boolean;
  burst?: string | null;
  /** A coarse place cell, never a coordinate. */
  place?: string | null;
  durMs?: number;
  /** Subtype bits as in core columns.ts SUBTYPE. */
  sub?: number;
}

export function toWindow(rows: readonly ExportRow[]): { window: LibraryWindow; offsetAt: (ms: number) => number } {
  const n = rows.length;
  const w = {
    ids: rows.map((_, i) => `r${i}`),
    creationMs: new Float64Array(n),
    utcOffsetSec: new Int32Array(n),
    kind: new Uint8Array(n),
    subtypeFlags: new Uint32Array(n),
    favourite: new Uint8Array(n),
    burstId: rows.map((r) => r.burst ?? null),
    placeCell: rows.map((r) => r.place ?? null),
    durationMs: new Float64Array(n),
    truncated: false,
  };
  rows.forEach((r, i) => {
    w.creationMs[i] = r.t;
    w.utcOffsetSec[i] = r.off;
    w.kind[i] = r.kind === 'video' ? KIND_VIDEO : KIND_IMAGE;
    w.subtypeFlags[i] = r.sub ?? 0;
    w.favourite[i] = r.fav ? 1 : 0;
    w.durationMs[i] = r.durMs ?? 0;
  });
  const sorted = [...rows].sort((a, b) => a.t - b.t);
  const offsetAt = (ms: number): number => {
    let lo = 0;
    let hi = sorted.length - 1;
    let best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid].t <= ms) {
        best = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return sorted.length ? sorted[best].off : 0;
  };
  return { window: w, offsetAt };
}

export interface Cell {
  predicate: SpanPredicate;
  minSpanHours: number;
  nearSeconds: number;
  nearGroupMax: number;
  placeRareShare: number;
}

export interface CellResult extends Cell {
  windowDays: number;
  qualifyingDays: number;
  qualifyingPer14: number;
  junkDays: number;
  /** Share of qualifying days the parent marked junk; null when nothing qualifies. */
  junkShare: number | null;
  wrongReasons: number;
  eligible: boolean;
}

const dayIndex = (key: string): number => Date.parse(`${key}T00:00:00Z`) / 86_400_000;

export const rulesFor = (c: Cell): MomentsRules => ({
  ...MOMENTS_RULES,
  spanPredicate: c.predicate,
  minSpan: c.minSpanHours * 3600,
  nearSeconds: c.nearSeconds,
  nearGroupMax: c.nearGroupMax,
  placeRareShare: c.placeRareShare,
});

/** The library-side reasons, one predicate each (spec 6.4a, R205). Occasion reasons are out of this run. */
type Pred = (d: DayGroup) => boolean;
const LIBRARY_REASONS = ['RSN-PLACE', 'RSN-HEART', 'RSN-VIDEO', 'RSN-DAY'] as const satisfies readonly Reason[];

/** Evaluate one cell. `junkKeys` are the parent's marked day keys; they are matched, never returned. */
export function evaluateCell(
  window: LibraryWindow,
  offsetAt: (ms: number) => number,
  junkKeys: ReadonlySet<string>,
  cell: Cell,
): CellResult {
  const rules = rulesFor(cell);
  const all = groupByDay(window, offsetAt, rules);
  if (all.length === 0) {
    return { ...cell, windowDays: 0, qualifyingDays: 0, qualifyingPer14: 0, junkDays: 0, junkShare: null, wrongReasons: 0, eligible: false };
  }
  const last = dayIndex(all[all.length - 1].dayKey);
  const days = all.filter((d) => dayIndex(d.dayKey) > last - WINDOW_DAYS);
  const windowDays = Math.min(WINDOW_DAYS, last - dayIndex(days[0].dayKey) + 1);

  const cellOf = new Map<string, string | null>();
  window.ids.forEach((id, i) => cellOf.set(id, window.placeCell[i]));
  const placeOfCand = (ids: readonly string[]) => cellOf.get(ids[0]) ?? null;
  const wp = windowPlaces(days.flatMap((d) => d.candidates.map((c) => placeOfCand(c.ids))));

  let qualifying = 0;
  let junk = 0;
  let wrong = 0;
  for (const d of days) {
    const by = qualifyDay(d, rules);
    if (by.length === 0) continue;
    qualifying++;
    if (junkKeys.has(d.dayKey)) junk++;

    const dp = dayPlace(d.candidates.map((c) => placeOfCand(c.ids)), rules);
    const share = dp === null ? undefined : wp.share.get(dp);
    const preds: Record<(typeof LIBRARY_REASONS)[number], Pred> = {
      'RSN-PLACE': () => dp !== null && wp.home !== null && dp !== wp.home && share !== undefined && share < rules.placeRareShare,
      'RSN-HEART': (g) => g.candidates.some((c) => c.favourite),
      'RSN-VIDEO': (g) => g.candidates.some((c) => c.video),
      'RSN-DAY': () => by.some((b) => b === 'busy-day' || b === 'busy-hours' || b === 'span' || b === 'sessions'),
    };
    // The shown reason: the strongest library reason whose predicate is true (REASON_PRECEDENCE order).
    const order = REASON_PRECEDENCE.filter((r): r is (typeof LIBRARY_REASONS)[number] => (LIBRARY_REASONS as readonly string[]).includes(r));
    const shown = order.find((r) => preds[r](d)) ?? null;
    // Property check (PLACEHOLDER, see WRONG_REASON_STATUS): `shown` is computed from these same
    // predicates, so this cannot fail today. It is not evidence about core's own reasons.
    const ok = shown !== null && preds[shown](d) && order.slice(0, order.indexOf(shown)).every((r) => !preds[r](d));
    if (!ok) wrong++;
  }
  const per14 = (qualifying * 14) / windowDays;
  return {
    ...cell,
    windowDays,
    qualifyingDays: qualifying,
    qualifyingPer14: per14,
    junkDays: junk,
    junkShare: qualifying === 0 ? null : junk / qualifying,
    wrongReasons: wrong,
    eligible: isEligible(qualifying, per14, wrong),
  };
}

export function cells(predicate: SpanPredicate): Cell[] {
  const out: Cell[] = [];
  for (const minSpanHours of GRID.minSpanHours)
    for (const nearSeconds of GRID.nearSeconds)
      for (const nearGroupMax of GRID.nearGroupMax)
        for (const placeRareShare of GRID.placeRareShare) out.push({ predicate, minSpanHours, nearSeconds, nearGroupMax, placeRareShare });
  return out;
}

/** The decision rule of moments-bar.ts. Returns null when no cell is eligible. */
export function choose(results: readonly CellResult[]): CellResult | null {
  const ok = results.filter((r) => r.eligible && r.junkShare !== null);
  if (ok.length === 0) return null;
  return [...ok].sort(
    (a, b) =>
      (a.junkShare as number) - (b.junkShare as number) ||
      b.minSpanHours - a.minSpanHours ||
      a.nearSeconds - b.nearSeconds ||
      a.nearGroupMax - b.nearGroupMax ||
      a.placeRareShare - b.placeRareShare,
  )[0];
}

export interface Run {
  results: CellResult[];
  chosen: Record<SpanPredicate, CellResult | null>;
  /** Marks whose day falls inside the 90-day window ending at the newest asset. */
  junkMarksInWindow: number;
  /** Marks outside that window: ignored, counted apart. */
  junkMarksOutside: number;
}

export function runGrid(rows: readonly ExportRow[], junkKeys: ReadonlySet<string>): Run {
  const { window, offsetAt } = toWindow(rows);
  const results: CellResult[] = [];
  const chosen = { span: null, busyHours: null } as Run['chosen'];
  for (const predicate of ['span', 'busyHours'] as const) {
    const rs = cells(predicate).map((c) => evaluateCell(window, offsetAt, junkKeys, c));
    results.push(...rs);
    chosen[predicate] = choose(rs);
  }
  const all = groupByDay(window, offsetAt, MOMENTS_RULES);
  const last = all.length ? dayIndex(all[all.length - 1].dayKey) : -Infinity;
  let inWindow = 0;
  for (const k of junkKeys) if (dayIndex(k) <= last && dayIndex(k) > last - WINDOW_DAYS) inWindow++;
  return { results, chosen, junkMarksInWindow: inWindow, junkMarksOutside: junkKeys.size - inWindow };
}

const pct = (x: number | null) => (x === null ? 'n/a' : `${(x * 100).toFixed(0)}%`);

/** The read-out: counts and rates only. Cell parameters are the grid's own values, not the parent's data. */
export function render(run: Run): string {
  const L: string[] = [];
  L.push('Moments real-library harness: counts and rates only. Nothing else is printed or written.');
  L.push(`junk marks in the 90-day window: ${run.junkMarksInWindow}; outside it, ignored: ${run.junkMarksOutside}`);
  L.push(`junk bar before any use of "Not this one": ${pct(JUNK_BAR.beforeNotThisOne)}; repair bar after one use: ${pct(JUNK_BAR.afterNotThisOne)}`);
  L.push(`wrong-reason count: ${WRONG_REASON_STATUS}`);
  for (const p of ['span', 'busyHours'] as const) {
    L.push('', `predicate ${p}: minSpanH nearS groupMax placeRare | windowDays qualifying per14 junkDays junk wrong(placeholder) eligible`);
    for (const r of run.results.filter((x) => x.predicate === p)) {
      L.push(
        `  ${r.minSpanHours} ${r.nearSeconds} ${r.nearGroupMax} ${r.placeRareShare} | ${r.windowDays} ${r.qualifyingDays} ${r.qualifyingPer14.toFixed(1)} ${r.junkDays} ${pct(r.junkShare)} ${r.wrongReasons} ${r.eligible ? 'yes' : 'no'}`,
      );
    }
    const c = run.chosen[p];
    L.push(
      c
        ? `chosen (${p}): minSpanH ${c.minSpanHours}, nearS ${c.nearSeconds}, groupMax ${c.nearGroupMax}, placeRare ${c.placeRareShare}; junk ${pct(c.junkShare)}; bar ${(c.junkShare as number) <= JUNK_BAR.beforeNotThisOne ? 'met' : 'NOT met'}`
        : `chosen (${p}): no eligible cell`,
    );
  }
  const s = run.chosen.span;
  const b = run.chosen.busyHours;
  const pick = s && b ? ((s.junkShare as number) <= (b.junkShare as number) ? 'span' : 'busyHours') : s ? 'span' : b ? 'busyHours' : 'none';
  L.push('', `lower junk share of the two predicates: ${pick}`);
  L.push('One family, one phone: not representative. G4 confirms or sends it back. Bump MOMENTS_RULES_VERSION with any change.');
  return L.join('\n');
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The junk file: one `YYYY-MM-DD` per line. Anything else is refused, so no content can ride in it. */
export function parseJunk(text: string): Set<string> {
  const out = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t === '') continue;
    if (!DAY_KEY.test(t) || Number.isNaN(dayIndex(t))) throw new HarnessError('junk file: every line must be a day key, YYYY-MM-DD');
    out.add(t);
  }
  return out;
}

export function parseExport(text: string): ExportRow[] {
  let j: { rows?: unknown };
  try {
    j = JSON.parse(text) as { rows?: unknown };
  } catch {
    // Node's own message quotes the text; ours never does.
    throw new HarnessError('export: not valid JSON');
  }
  if (!Array.isArray(j.rows)) throw new HarnessError('export: expected {"rows": [...]}');
  return j.rows.map((r) => {
    const x = r as ExportRow;
    if (typeof x.t !== 'number' || typeof x.off !== 'number' || (x.kind !== 'image' && x.kind !== 'video')) {
      throw new HarnessError('export: each row needs t, off and kind');
    }
    return { t: x.t, off: x.off, kind: x.kind, fav: !!x.fav, burst: x.burst ?? null, place: x.place ?? null, durMs: x.durMs ?? 0, sub: x.sub ?? 0 };
  });
}
