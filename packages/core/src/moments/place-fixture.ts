/**
 * FIXTURE ONLY (R228): the TypeScript reference of the grid lookup that the native layer does, and
 * the 10-row synthetic table of PR 5. It is the only file in `moments/` that takes a coordinate, it
 * is never imported by `place.ts` or by app code, and a test pins that. The real table is PR 5b.
 */
import { placeTableText, type PlaceIndex, type PlaceKind } from './place';

export const FIXTURE_CELL_DEG = 0.5;
export const FIXTURE_EDGE_MARGIN_DEG = 0.02;

/** Reference cell of a coordinate. Null for an invalid point, the (0,0) placeholder, or a point near a cell edge (abstain). */
export function fixtureCellFor(lat: number, lon: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (lat === 0 && lon === 0) return null;
  const l = lon === 180 ? -180 : lon; // antimeridian: 180 and -180 are one meridian
  const y = (lat + 90) / FIXTURE_CELL_DEG;
  const x = (l + 180) / FIXTURE_CELL_DEG;
  const e = FIXTURE_EDGE_MARGIN_DEG / FIXTURE_CELL_DEG;
  if (y - Math.floor(y) < e || Math.ceil(y) - y < e || x - Math.floor(x) < e || Math.ceil(x) - x < e) return null;
  return `${Math.floor(y)}:${Math.floor(x)}`;
}

/** A small fixed hash for the fixture checksum only (FNV-1a, 32 bit). Not security. */
export function fnv1a32Hex(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** City-centre points of the fixture table (public geography, no family's own place). */
export const FIXTURE_CITIES: readonly { id: string; name: string; kind: PlaceKind; lat: number; lon: number }[] = [
  { id: 'syn:seattle', name: 'Seattle', kind: 'city', lat: 47.61, lon: -122.33 },
  { id: 'syn:portland', name: 'Portland', kind: 'city', lat: 45.6, lon: -122.68 },
  { id: 'syn:lisbon', name: 'Lisbon', kind: 'city', lat: 38.72, lon: -9.14 },
  { id: 'syn:porto', name: 'Porto', kind: 'city', lat: 41.15, lon: -8.61 },
  { id: 'syn:nairobi', name: 'Nairobi', kind: 'city', lat: -1.29, lon: 36.82 },
  { id: 'syn:osaka', name: 'Osaka', kind: 'city', lat: 34.69, lon: 135.3 },
  { id: 'syn:lima', name: 'Lima', kind: 'city', lat: -12.05, lon: -77.04 },
  { id: 'syn:oslo', name: 'Oslo', kind: 'city', lat: 59.91, lon: 10.75 },
  { id: 'syn:suva', name: 'Suva', kind: 'city', lat: -18.14, lon: 178.44 },
  { id: 'syn:taveuni', name: 'Taveuni', kind: 'region', lat: -16.85, lon: -179.7 },
];

export function buildSyntheticTable(version = 1): PlaceIndex {
  const places: Record<string, PlaceIndex['places'][string]> = {};
  const cells: Record<string, string> = {};
  for (const c of FIXTURE_CITIES) {
    places[c.id] = { id: c.id, name: c.name, kind: c.kind };
    const cell = fixtureCellFor(c.lat, c.lon);
    if (cell === null) throw new Error('fixture city sits on a cell edge');
    cells[cell] = c.id;
  }
  const body = { version, places, cells };
  return { ...body, checksum: fnv1a32Hex(placeTableText(body)) };
}
