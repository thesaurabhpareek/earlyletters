/** The days store, pure part (NS-47-R6, R28; NS-46-R6; ADR 0032). Ids only, never a copied date. The whole file is L4 (NS-47-R1). */
export const DAYS_FILE_VERSION = 1;
/** Owner of a file made before any sign-in. Adopted only at the claim step (NS-47-R7, E73; next PR). */
export const LOCAL_OWNER = 'local';

export type DayTick = Record<string, unknown>;
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
    if (!DAY_ID.test(id) || !isObject(t)) return { kind: 'corrupt' };
    ticked[id] = t;
  }
  return { kind: o.v > DAYS_FILE_VERSION ? 'newer' : 'ok', file: { v: o.v, owner: o.owner, ticked } };
}

export const serializeDays = (file: DaysFile): string => JSON.stringify(file);
