/**
 * Places for Moments (NS-53, PR 5; rows R61, R63, R204, R228, R229, R248, R254, 7a.1, 7a.2).
 *
 * Pure TypeScript. No coordinate enters this file: the phone's native layer returns a coarse CELL
 * per picture (R220, R228) and this file maps a cell to a place through a table that is INJECTED
 * (core never loads or bundles one). A place is a city, region or country, never a street, venue
 * or person. Everything here abstains rather than guesses: no table, a table that fails its
 * checksum, an unknown cell, a tie, a low share or a hidden place all give null, which the card
 * shows as a plain date.
 *
 * Every threshold comes from `MomentsRules` (PROPOSED values, CPO-25), never defaulted here. ASSUMED
 * choices, each ruled in Batch 3: a tie for home gives no home; the share denominator counts placed
 * candidates only; a stay needs 2 or more days with a gap of 0 days.
 *
 * Place keys are the table's stable external ids (R229, R248), never a readable name.
 * Nothing here is persisted or logged. The home place is computed in memory and never named.
 */
import type { MomentsRules } from './rules';

// Local day helpers: moments/ imports only its own files (CODE-R10, R43), so no `../child` here.
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days since 1970-01-01 of a real calendar day written YYYY-MM-DD, or null. */
function dayNumber(iso: string): number | null {
  const m = ISO_DAY.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return t.getTime() / 86_400_000;
}

export type PlaceId = string;
export type PlaceKind = 'city' | 'region' | 'country';

export interface PlaceEntry {
  readonly id: PlaceId;
  readonly name: string;
  readonly kind: PlaceKind;
}

/** The injected table (R229). `cells` maps a native coarse cell id to a stable external place id. */
export interface PlaceIndex {
  readonly version: number;
  readonly checksum: string;
  readonly places: Readonly<Record<PlaceId, PlaceEntry>>;
  readonly cells: Readonly<Record<string, PlaceId>>;
}

export type PlaceHash = (text: string) => string;

/** One canonical text of a table, the input of the checksum: order never changes the result. */
export function placeTableText(t: Omit<PlaceIndex, 'checksum'>): string {
  const places = Object.keys(t.places)
    .sort()
    .map((k) => `${k}|${t.places[k].id}|${t.places[k].kind}|${t.places[k].name}`);
  const cells = Object.keys(t.cells)
    .sort()
    .map((c) => `${c}>${t.cells[c]}`);
  return [`v${t.version}`, ...places, '--', ...cells].join('\n');
}

/**
 * Opens a table or returns null (no place anywhere, date-only cards). Fails closed on a checksum
 * mismatch, a cell that points to an unknown place, or an entry whose key differs from its id
 * (R229). The caller supplies the hash, so this file imports nothing from the platform.
 */
export function openPlaceTable(table: PlaceIndex | null | undefined, hash: PlaceHash): PlaceIndex | null {
  if (!table) return null;
  if (hash(placeTableText(table)) !== table.checksum) return null;
  for (const k of Object.keys(table.places)) if (table.places[k].id !== k) return null;
  for (const c of Object.keys(table.cells)) if (!has(table.places, table.cells[c])) return null;
  return table;
}

/** Own keys only: a place id such as "constructor" must never reach the object prototype. */
function has(o: object, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

/** A native cell to a stable place id, or null (no cell, unknown cell, no table). */
export function placeForCell(table: PlaceIndex | null, cell: string | null | undefined): PlaceId | null {
  if (!table || cell == null) return null;
  const id = has(table.cells, cell) ? table.cells[cell] : undefined;
  return id !== undefined && has(table.places, id) ? id : null;
}

export function placeName(table: PlaceIndex | null, id: PlaceId): string | null {
  return table && has(table.places, id) ? table.places[id].name : null;
}

function counts(ids: readonly (PlaceId | null)[]): Map<PlaceId, number> {
  const m = new Map<PlaceId, number>();
  for (const id of ids) if (id !== null) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

/** Strict winner of a count map, or null on an empty map or a tie for first (a tie gives none). */
function soleLeader(m: Map<PlaceId, number>): { id: PlaceId; n: number } | null {
  let best: { id: PlaceId; n: number } | null = null;
  let tie = false;
  for (const [id, n] of m) {
    if (!best || n > best.n) {
      best = { id, n };
      tie = false;
    } else if (n === best.n) tie = true;
  }
  return best && !tie ? best : null;
}

/** A day's place: the majority place of its pictures; a tie, a low share or a thin count gives null (R63, R204). */
export function dayPlace(pictures: readonly (PlaceId | null)[], rules: MomentsRules): PlaceId | null {
  const m = counts(pictures);
  const lead = soleLeader(m);
  if (!lead) return null;
  let placed = 0;
  for (const n of m.values()) placed += n;
  if (lead.n < rules.minPicturesAtPlace) return null;
  return lead.n / placed > rules.majorityShare ? lead.id : null;
}

export interface WindowPlaces {
  /** The place with the largest share of the window's candidates; null on a tie or no places. Never named to the parent. */
  readonly home: PlaceId | null;
  /** Share of each place among the window's placed candidates (0..1). */
  readonly share: ReadonlyMap<PlaceId, number>;
}

/** One entry per candidate of the scanned window (a burst or near-duplicate group counts once). In memory only (R249). */
export function windowPlaces(candidates: readonly (PlaceId | null)[]): WindowPlaces {
  const m = counts(candidates);
  let total = 0;
  for (const n of m.values()) total += n;
  const share = new Map<PlaceId, number>();
  for (const [id, n] of m) share.set(id, n / total);
  const lead = soleLeader(m);
  return { home: lead ? lead.id : null, share };
}

export interface PlaceLineInput {
  readonly table: PlaceIndex | null;
  readonly placeId: PlaceId | null;
  readonly window: WindowPlaces;
  /** The parent's "This is where we live" correction (R249), an external id; wins over the computed home. */
  readonly homeCorrection?: PlaceId | null;
  readonly hidden: ReadonlySet<PlaceId>;
  readonly rules: MomentsRules;
  /** The child's date of birth, or a day with a birth occasion reason: no place line (R254). */
  readonly isBirthDay: boolean;
  /** Kill switch K5 `machineLabels` (R202): false hides every place line. */
  readonly machineLabels: boolean;
}

/** The machine place line of a card: the id and our name, or null for a plain date (R63, R254, 7.2a). */
export function placeLine(i: PlaceLineInput): { id: PlaceId; name: string } | null {
  if (!i.machineLabels || i.isBirthDay || i.placeId === null) return null;
  if (i.hidden.has(i.placeId)) return null;
  const home = i.homeCorrection ?? i.window.home;
  if (home === null || home === i.placeId) return null;
  const share = i.window.share.get(i.placeId);
  if (share === undefined || !(share < i.rules.placeRareShare)) return null;
  const name = placeName(i.table, i.placeId);
  return name === null ? null : { id: i.placeId, name };
}

export interface PlaceStay {
  readonly placeId: PlaceId;
  readonly from: string;
  readonly to: string;
  readonly days: number;
}

/** The guard inputs of `placeLine`, shared by every day of the stays (R254, R202, R249). */
export type PlaceStayGuard = Omit<PlaceLineInput, 'placeId' | 'isBirthDay'>;

/**
 * Stays (7a.2 step 5): consecutive local days that each show the same away place form one stay of
 * at least two days and at most `rules.maxRun`. Every day goes through `placeLine` first, so a
 * hidden place, the home place, a birth day, an unnamed place or the `machineLabels` kill switch
 * drops the day and a stay can never exist where a place line would not. Stays are for Recent
 * only, never For you (R254). No purpose word is produced here.
 */
export function placeStays(
  days: readonly { dayKey: string; placeId: PlaceId | null; isBirthDay: boolean }[],
  guard: PlaceStayGuard,
): PlaceStay[] {
  const maxRun = guard.rules.maxRun;
  type Day = { dayKey: string; placeId: PlaceId };
  const sorted = days
    .filter((d) => dayNumber(d.dayKey) !== null && placeLine({ ...guard, placeId: d.placeId, isBirthDay: d.isBirthDay }) !== null)
    .map((d): Day => ({ dayKey: d.dayKey, placeId: d.placeId as PlaceId }))
    .sort((a, b) => (a.dayKey < b.dayKey ? -1 : a.dayKey > b.dayKey ? 1 : 0));
  const out: PlaceStay[] = [];
  let run: Day[] = [];
  const flush = (): void => {
    if (run.length >= 2 && run.length <= maxRun) {
      out.push({ placeId: run[0].placeId, from: run[0].dayKey, to: run[run.length - 1].dayKey, days: run.length });
    }
    run = [];
  };
  for (const d of sorted) {
    const last = run[run.length - 1];
    if (last && last.dayKey === d.dayKey) continue;
    if (last && !(last.placeId === d.placeId && dayNumber(last.dayKey)! + 1 === dayNumber(d.dayKey))) flush();
    run.push(d);
  }
  flush();
  return out;
}
