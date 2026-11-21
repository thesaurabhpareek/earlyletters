/**
 * The days store, pure part (NS-47-R6, R28; NS-46-R6; ADR 0032; BRIEF NS-47). No file, no clock, no React Native.
 * Ids only, never a copied date. The whole file is L4 (NS-47-R1): nothing here is logged.
 */
export const DAYS_FILE_VERSION = 1;
/** The owner of a file made on a phone that never signed in. Adopted only at the claim step (NS-47-R7, E73). */
export const LOCAL_OWNER = 'local';

/** One ticked day. Moves and per-year overrides come with the Days page (next PRs); unknown fields are kept. */
export type DayTick = Record<string, unknown>;

export interface DaysFile {
  v: number;
  /** `'local'` or the first 16 hex of SHA-256 of the user id. Every read compares it (fails closed on a mismatch). */
  owner: string;
  ticked: Record<string, DayTick>;
}

export type ParsedDays = { kind: 'ok' | 'newer'; file: DaysFile } | { kind: 'corrupt' };

/** A day id is a short plain slug, so a file can never carry free text (NS-47-R2: only ticks are stored). */
export const DAY_ID = /^[a-z0-9][a-z0-9.-]{0,63}$/;
const OWNER = /^(local|[0-9a-f]{16})$/;

export const emptyDays = (owner: string): DaysFile => ({ v: DAYS_FILE_VERSION, owner, ticked: {} });

/**
 * Reads a file's text. A higher version is read for the keys we know and flagged `newer` (never rewritten or
 * deleted, NS-47-R28). Anything else that is not the shape is `corrupt`: fail closed, never repaired.
 */
export function parseDays(text: string): ParsedDays {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { kind: 'corrupt' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { kind: 'corrupt' };
  const o = raw as Record<string, unknown>;
  if (typeof o.v !== 'number' || !Number.isInteger(o.v) || o.v < 1) return { kind: 'corrupt' };
  if (typeof o.owner !== 'string' || !OWNER.test(o.owner)) return { kind: 'corrupt' };
  if (typeof o.ticked !== 'object' || o.ticked === null || Array.isArray(o.ticked)) return { kind: 'corrupt' };
  const ticked: Record<string, DayTick> = {};
  for (const [id, tick] of Object.entries(o.ticked as Record<string, unknown>)) {
    if (!DAY_ID.test(id) || typeof tick !== 'object' || tick === null || Array.isArray(tick)) return { kind: 'corrupt' };
    ticked[id] = tick as DayTick;
  }
  return { kind: o.v > DAYS_FILE_VERSION ? 'newer' : 'ok', file: { v: o.v, owner: o.owner, ticked } };
}

export const serializeDays = (file: DaysFile): string => JSON.stringify(file);

/** Ticks a day. An unknown id shape is refused (null), never stored. */
export function tickDay(file: DaysFile, id: string): DaysFile | null {
  if (!DAY_ID.test(id)) return null;
  return { ...file, ticked: { ...file.ticked, [id]: file.ticked[id] ?? {} } };
}

export function untickDay(file: DaysFile, id: string): DaysFile {
  const { [id]: _gone, ...rest } = file.ticked;
  return { ...file, ticked: rest };
}
