/**
 * The moments store, pure part (NS-53-R221, R249, R250; ADR 0032 amendment; CDO-23). The members are exactly the R221
 * members: a day key, the parent's typed day labels (L4), hidden place keys, the home-place correction (one value per
 * book) and an opaque owner. No picture, album or asset id, no coordinate, no place name we worked out (R247). Unknown
 * fields are kept on write; a higher `v` reads as empty and is never written (R221). Nothing here logs.
 */
export const MOMENTS_FILE_VERSION = 1;
export const LABEL_MAX = 60;
/** Same shape as the days owner: 'local' or the first 16 hex of SHA-256 of the user id. Never a person id or a name. */
const OWNER = /^(local|[0-9a-f]{16})$/;
/** A local ISO date, no zone. */
export const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
/** A stable external place id (R229): a token, so a spaced readable name cannot be stored by accident. */
export const PLACE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
/** A local book id (a uuid). */
export const BOOK_ID = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;
const KNOWN = ['v', 'owner', 'dayKeys', 'labels', 'hiddenPlaces', 'homePlace'];

export interface MomentsFile {
  v: number;
  owner: string;
  dayKeys: string[];
  labels: Record<string, string>;
  hiddenPlaces: string[];
  /** Book id to the place key the parent chose for home: one value per book (R249). */
  homePlace: Record<string, string>;
  /** Fields this build does not know, kept so a write does not lose them (R221). */
  unknown: Record<string, unknown>;
}
export type ParsedMoments = { kind: 'ok' | 'newer'; file: MomentsFile } | { kind: 'corrupt' };

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isDayKey = (s: unknown): s is string => typeof s === 'string' && DAY_KEY.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const labelOk = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0 && [...s].length <= LABEL_MAX;

export const emptyMoments = (owner: string): MomentsFile => ({ v: MOMENTS_FILE_VERSION, owner, dayKeys: [], labels: {}, hiddenPlaces: [], homePlace: {}, unknown: {} });

/** Anything off-shape in a version this build knows is `corrupt` (the caller deletes it, no message). A higher version is `newer`. */
export function parseMoments(text: string): ParsedMoments {
  let o: unknown;
  try {
    o = JSON.parse(text);
  } catch {
    return { kind: 'corrupt' };
  }
  if (!isObject(o) || typeof o.v !== 'number' || !Number.isInteger(o.v) || o.v < 1 || typeof o.owner !== 'string' || !OWNER.test(o.owner)) return { kind: 'corrupt' };
  const newer = o.v > MOMENTS_FILE_VERSION;
  const unknown = Object.fromEntries(Object.entries(o).filter(([k]) => !KNOWN.includes(k)));
  if (newer) return { kind: 'newer', file: { ...emptyMoments(o.owner), v: o.v, unknown } };
  const { dayKeys, labels, hiddenPlaces, homePlace } = o;
  if (!Array.isArray(dayKeys) || !dayKeys.every(isDayKey)) return { kind: 'corrupt' };
  if (!isObject(labels) || !Object.entries(labels).every(([k, s]) => isDayKey(k) && labelOk(s))) return { kind: 'corrupt' };
  if (!Array.isArray(hiddenPlaces) || !hiddenPlaces.every((p) => typeof p === 'string' && PLACE_KEY.test(p))) return { kind: 'corrupt' };
  if (!isObject(homePlace) || !Object.entries(homePlace).every(([b, p]) => BOOK_ID.test(b) && typeof p === 'string' && PLACE_KEY.test(p))) return { kind: 'corrupt' };
  return { kind: 'ok', file: { v: o.v, owner: o.owner, dayKeys: dayKeys as string[], labels: labels as Record<string, string>, hiddenPlaces: hiddenPlaces as string[], homePlace: homePlace as Record<string, string>, unknown } };
}

export const serializeMoments = (f: MomentsFile): string => JSON.stringify({ ...f.unknown, v: f.v, owner: f.owner, dayKeys: f.dayKeys, labels: f.labels, hiddenPlaces: f.hiddenPlaces, homePlace: f.homePlace });

/** Each setter returns the new file, or null when the value is not allowed (never stored). */
export const addDayKey = (f: MomentsFile, day: string): MomentsFile | null => (isDayKey(day) ? { ...f, dayKeys: f.dayKeys.includes(day) ? f.dayKeys : [...f.dayKeys, day] } : null);
export const removeDayKey = (f: MomentsFile, day: string): MomentsFile => ({ ...f, dayKeys: f.dayKeys.filter((d) => d !== day) });
export const setLabel = (f: MomentsFile, day: string, text: string): MomentsFile | null => (isDayKey(day) && labelOk(text) ? { ...f, labels: { ...f.labels, [day]: text } } : null);
export function clearLabel(f: MomentsFile, day: string): MomentsFile {
  const { [day]: _gone, ...rest } = f.labels;
  return { ...f, labels: rest };
}
export const hidePlace = (f: MomentsFile, key: string): MomentsFile | null => (PLACE_KEY.test(key) ? { ...f, hiddenPlaces: f.hiddenPlaces.includes(key) ? f.hiddenPlaces : [...f.hiddenPlaces, key] } : null);
export const unhidePlace = (f: MomentsFile, key: string): MomentsFile => ({ ...f, hiddenPlaces: f.hiddenPlaces.filter((p) => p !== key) });
export const setHomePlace = (f: MomentsFile, book: string, key: string): MomentsFile | null => (BOOK_ID.test(book) && PLACE_KEY.test(key) ? { ...f, homePlace: { ...f.homePlace, [book]: key } } : null);
export function removeBookRows(f: MomentsFile, book: string): MomentsFile {
  const { [book]: _gone, ...rest } = f.homePlace;
  return { ...f, homePlace: rest };
}
/** Rows for a book that is not in `live` (the launch cleanup). */
export function pruneBooks(f: MomentsFile, live: ReadonlySet<string>): MomentsFile {
  return { ...f, homePlace: Object.fromEntries(Object.entries(f.homePlace).filter(([b]) => live.has(b))) };
}
