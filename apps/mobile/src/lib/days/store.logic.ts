/** The days store, pure part (NS-47-R6, R28; NS-46-R6; ADR 0032). Ids only, never a copied date. The whole file is L4 (NS-47-R1). */
export const DAYS_FILE_VERSION = 1;
/** Owner of a file made before any sign-in. Adopted only at the claim step (NS-47-R7, E73; next PR). */
export const LOCAL_OWNER = 'local';

/** What a tick may hold: a move, a source slug, years switched off. Nothing else, so no value can carry free text. */
export interface DayTick {
  move?: { date: string; always: boolean; year?: number };
  authority?: string;
  offYear?: number[];
}
/** `owner` is 'local' or the first 16 hex of SHA-256 of the user id; every read compares it. */
export interface DaysFile {
  v: number;
  owner: string;
  ticked: Record<string, DayTick>;
}
export type ParsedDays = { kind: 'ok' | 'newer'; file: DaysFile } | { kind: 'corrupt' };

/** A short plain slug, so a file can never carry free text (NS-47-R2: only ticks are stored). */
export const DAY_ID = /^[a-z0-9][a-z0-9.-]{0,63}$/;
const OWNER = /^(local|[0-9a-f]{16})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isYear = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 1900 && x <= 2200;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * A tick with only known keys and known value shapes, else null. A higher file version may carry keys we do not know:
 * those are dropped (read for known keys), never kept; a version-1 file with one is corrupt.
 */
function parseTick(t: Record<string, unknown>, newer: boolean): DayTick | null {
  const out: DayTick = {};
  for (const [k, val] of Object.entries(t)) {
    if (k === 'move' && isObject(val) && typeof val.date === 'string' && ISO_DATE.test(val.date) && typeof val.always === 'boolean' && (val.year === undefined || isYear(val.year))) {
      out.move = { date: val.date, always: val.always, ...(val.year === undefined ? {} : { year: val.year }) };
    } else if (k === 'authority' && typeof val === 'string' && DAY_ID.test(val)) out.authority = val;
    else if (k === 'offYear' && Array.isArray(val) && val.length <= 50 && val.every(isYear)) out.offYear = [...val];
    else if (!newer) return null;
  }
  return out;
}

/** A higher version is read for known keys and flagged `newer` (never rewritten, NS-47-R28). Anything off-shape is `corrupt`. */
export function parseDays(text: string): ParsedDays {
  let o: unknown;
  try {
    o = JSON.parse(text);
  } catch {
    return { kind: 'corrupt' };
  }
  if (!isObject(o) || typeof o.v !== 'number' || !Number.isInteger(o.v) || o.v < 1) return { kind: 'corrupt' };
  if (typeof o.owner !== 'string' || !OWNER.test(o.owner) || !isObject(o.ticked)) return { kind: 'corrupt' };
  const ticked: Record<string, DayTick> = {};
  for (const [id, t] of Object.entries(o.ticked)) {
    const tick = DAY_ID.test(id) && isObject(t) ? parseTick(t, o.v > DAYS_FILE_VERSION) : null;
    if (!tick) return { kind: 'corrupt' };
    ticked[id] = tick;
  }
  return { kind: o.v > DAYS_FILE_VERSION ? 'newer' : 'ok', file: { v: o.v, owner: o.owner, ticked } };
}

export const serializeDays = (file: DaysFile): string => JSON.stringify(file);

/** An id that is not a slug is refused (null), never stored. */
export const tickDay = (file: DaysFile, id: string): DaysFile | null => (DAY_ID.test(id) ? { ...file, ticked: { ...file.ticked, [id]: file.ticked[id] ?? {} } } : null);

export function untickDay(file: DaysFile, id: string): DaysFile {
  const { [id]: _gone, ...rest } = file.ticked;
  return { ...file, ticked: rest };
}
