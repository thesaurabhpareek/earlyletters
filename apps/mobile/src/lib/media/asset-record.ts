/**
 * The one shape media code may hold about a photo or video from the library (NX-39 v2 R9 (b); SEC-ML-1).
 *
 * Exactly six fields: an opaque id, the capture instant, the media kind, the duration, the pixel size, and a city key
 * (an index into the bundled city table, never a name typed by anyone and never a coordinate). `toAssetRecord` copies
 * these by name from whatever the library gave it and drops everything else: a filename, an EXIF blob, coordinates, a
 * camera serial, an album title. It never spreads, clones or casts its input into the record, and the scanner
 * (test/support/media-scan.ts) fails the build if a later edit does.
 *
 * Pure TypeScript, no React Native, no library import: nothing here asks for permission or reads a photo. The city key
 * arrives already reduced (R6); this file never sees a coordinate.
 */

export type PixelSize = { readonly width: number; readonly height: number };

export type AssetRecord = {
  /** The library's own identifier, held in memory for this session only; never stored, logged or sent (R40). */
  readonly opaqueId: string;
  /** UTC instant the photo was taken, ISO 8601, or null when the file has none. */
  readonly capturedAt: string | null;
  readonly kind: 'photo' | 'video';
  /** Milliseconds; null for a photo. */
  readonly durationMs: number | null;
  readonly pixelSize: PixelSize | null;
  /** A key into the bundled city table (lowercase letters, digits, hyphens), or null. */
  readonly cityKey: string | null;
};

/** The six fields, in order. A test holds this equal to the scanner's allowlist. */
export const ASSET_RECORD_KEYS = ['opaqueId', 'capturedAt', 'kind', 'durationMs', 'pixelSize', 'cityKey'] as const;

const CITY_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ID = 256;
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;

function positiveInt(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
}

/** An epoch in milliseconds or an ISO string, as a UTC ISO string; null when it is missing or out of a photo's range. */
function instant(v: unknown): string | null {
  const ms = typeof v === 'number' ? v : typeof v === 'string' ? Date.parse(v) : Number.NaN;
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR ? d.toISOString() : null;
}

/**
 * The record for one library item, or null when it is not a photo or video or has no id.
 * Reads `id`, `mediaType`, `creationTime`, `duration` (seconds), `width`, `height` and `cityKey` by name; nothing else.
 */
export function toAssetRecord(raw: unknown): AssetRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = r.id;
  if (typeof id !== 'string' || id === '' || id.length > MAX_ID) return null;
  const type = r.mediaType;
  if (type !== 'photo' && type !== 'video') return null;
  const width = positiveInt(r.width);
  const height = positiveInt(r.height);
  const seconds = typeof r.duration === 'number' && Number.isFinite(r.duration) && r.duration > 0 ? r.duration : null;
  const city = typeof r.cityKey === 'string' && CITY_KEY.test(r.cityKey) && r.cityKey.length <= 40 ? r.cityKey : null;
  return {
    opaqueId: id,
    capturedAt: instant(r.creationTime),
    kind: type,
    durationMs: type === 'video' && seconds !== null ? Math.round(seconds * 1000) : null,
    pixelSize: width !== null && height !== null ? { width, height } : null,
    cityKey: city,
  };
}
