/** The days store, pure part (NS-47-R6, R28; NS-46-R6; ADR 0032). Ids only, never a copied date. The whole file is L4 (NS-47-R1). */
export const DAYS_FILE_VERSION = 1;
/** Owner of a file made before any sign-in. Adopted only at the claim step (NS-47-R7, E73; next PR). */
export const LOCAL_OWNER = 'local';

/** A tick is flags, numbers and dates only (NS-47-R2): never free text. */
export type DayTick = Record<string, boolean | number | string>;
export const MAX_DAYS_BYTES = 64 * 1024;
export const MAX_TICKS = 500;
const TICK_KEY = /^[a-zA-Z][a-zA-Z0-9]{0,31}$/;
const TICK_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]{1,16}Z?)?$/;
const tickValue = (v: unknown): v is boolean | number | string =>
  typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && TICK_DATE.test(v));
const tickOk = (t: Record<string, unknown>): t is DayTick => Object.entries(t).every(([k, v]) => TICK_KEY.test(k) && tickValue(v));
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
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** A higher version is read for known keys and flagged `newer` (never rewritten, NS-47-R28). Anything off-shape is `corrupt`. */
export function parseDays(text: string): ParsedDays {
  if (text.length > MAX_DAYS_BYTES) return { kind: 'corrupt' };
  let o: unknown;
  try {
    o = JSON.parse(text);
  } catch {
    return { kind: 'corrupt' };
  }
  if (!isObject(o) || typeof o.v !== 'number' || !Number.isInteger(o.v) || o.v < 1) return { kind: 'corrupt' };
  if (typeof o.owner !== 'string' || !OWNER.test(o.owner) || !isObject(o.ticked)) return { kind: 'corrupt' };
  const ticked: Record<string, DayTick> = {};
  const entries = Object.entries(o.ticked);
  if (entries.length > MAX_TICKS) return { kind: 'corrupt' };
  for (const [id, t] of entries) {
    if (!DAY_ID.test(id) || !isObject(t) || !tickOk(t)) return { kind: 'corrupt' };
    ticked[id] = t;
  }
  return { kind: o.v > DAYS_FILE_VERSION ? 'newer' : 'ok', file: { v: o.v, owner: o.owner, ticked } };
}

export const serializeDays = (file: DaysFile): string => JSON.stringify(file);
