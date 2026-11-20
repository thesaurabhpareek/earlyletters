/// <reference types="node" />
/**
 * [NX-39-R9] the adapter returns exactly: opaque id, capture instant, media kind, duration, pixel size, city key; and
 * none of 30 extra fields survives (SEC-ML-1, BL-845). Fixtures use the fictional family "Asha".
 */
import { describe, expect, it } from 'vitest';
import { ASSET_RECORD_KEYS, toAssetRecord } from '../src/lib/media/asset-record';
import { scanSource } from './support/media-scan';
import { ASSET_RECORD_FIELDS, PIXEL_SIZE_FIELDS } from './support/media-scan-allowlist';

/** 30 fields a library or a camera can hand back, each carrying a marker no record may contain. */
const EXTRAS: Record<string, unknown> = Object.fromEntries(
  [
    'filename', 'uri', 'localUri', 'exif', 'location', 'latitude', 'longitude', 'altitude', 'coords', 'gps', 'cameraMake', 'cameraModel',
    'cameraSerial', 'lensModel', 'software', 'albumId', 'albumTitle', 'localizedTitle', 'isFavorite', 'isHidden', 'burstId', 'mediaSubtypes',
    'orientation', 'modificationTime', 'faces', 'caption', 'sceneLabels', 'peopleNames', 'hospital', 'note',
  ].map((k) => [k, `ASHA-EXTRA-${k}`]),
);

const photo = { id: 'asha-asset-0001', mediaType: 'photo', creationTime: Date.UTC(2026, 2, 8, 14, 30), width: 4032, height: 3024, cityKey: 'oakland' };

describe('[NX-39-R9] the adapter record', () => {
  it('has exactly the six allowed fields, the same as the scanner allowlist', () => {
    expect([...ASSET_RECORD_KEYS]).toEqual([...ASSET_RECORD_FIELDS]);
    const rec = toAssetRecord(photo)!;
    expect(Object.keys(rec)).toEqual([...ASSET_RECORD_KEYS]);
    expect(Object.keys(rec.pixelSize!)).toEqual([...PIXEL_SIZE_FIELDS]);
    expect(rec).toEqual({
      opaqueId: 'asha-asset-0001',
      capturedAt: '2026-03-08T14:30:00.000Z',
      kind: 'photo',
      durationMs: null,
      pixelSize: { width: 4032, height: 3024 },
      cityKey: 'oakland',
    });
  });

  it('drops all 30 extra fields, at the top level and inside pixel size', () => {
    expect(Object.keys(EXTRAS)).toHaveLength(30);
    const rec = toAssetRecord({ ...photo, ...EXTRAS, pixelSize: { width: 1, height: 1, dpi: 72, ...EXTRAS } })!;
    expect(Object.keys(rec)).toEqual([...ASSET_RECORD_KEYS]);
    const text = JSON.stringify(rec);
    expect(text).not.toContain('ASHA-EXTRA');
    for (const k of Object.keys(EXTRAS)) expect(Object.keys(rec), k).not.toContain(k);
  });

  it('reads a video\'s duration in milliseconds, and no duration for a photo', () => {
    expect(toAssetRecord({ ...photo, mediaType: 'video', duration: 12.5 })).toMatchObject({ kind: 'video', durationMs: 12500 });
    expect(toAssetRecord({ ...photo, duration: 12.5 })).toMatchObject({ kind: 'photo', durationMs: null });
  });

  it('turns anything it cannot trust into null instead of passing it on', () => {
    expect(toAssetRecord(null)).toBeNull();
    expect(toAssetRecord('asha')).toBeNull();
    expect(toAssetRecord({ ...photo, id: '' })).toBeNull();
    expect(toAssetRecord({ ...photo, id: 7 })).toBeNull();
    expect(toAssetRecord({ ...photo, mediaType: 'audio' })).toBeNull();
    expect(toAssetRecord({ ...photo, creationTime: 0 })!.capturedAt).toBeNull();
    expect(toAssetRecord({ ...photo, creationTime: 'not a date' })!.capturedAt).toBeNull();
    expect(toAssetRecord({ ...photo, width: -1 })!.pixelSize).toBeNull();
    // A city key is a table key, never free text, a place name with spaces, a coordinate or a geohash-like long string.
    for (const bad of ['Oakland', 'Asha Hospital', '37.8044,-122.2712', 'x'.repeat(41), '-oakland', 'oak--land']) {
      expect(toAssetRecord({ ...photo, cityKey: bad })!.cityKey, bad).toBeNull();
    }
    expect(toAssetRecord({ ...photo, cityKey: 'san-francisco' })!.cityKey).toBe('san-francisco');
  });

  it('does not return or share the input: a change to the input afterwards changes nothing', () => {
    const input = { ...photo, ...EXTRAS };
    const rec = toAssetRecord(input)!;
    expect(rec).not.toBe(input);
    input.id = 'changed';
    expect(rec.opaqueId).toBe('asha-asset-0001');
  });

  it('mutation check: an adapter that spreads its input is caught by the scanner, and the real one is not', async () => {
    const { readFileSync } = await import('node:fs');
    const real = readFileSync(new URL('../src/lib/media/asset-record.ts', import.meta.url), 'utf8');
    const p = 'src/lib/media/asset-record.ts';
    expect(scanSource(p, real, { path: p })).toEqual([]);
    const spread = real.replace('    opaqueId: id,\n', '    ...r,\n    opaqueId: id,\n');
    expect(spread).not.toBe(real);
    expect(scanSource(p, spread, { path: p }).map((f) => f.rule)).toContain('record-spread');
    const extra = real.replace('    cityKey: city,\n  };', '    cityKey: city,\n    filename: r.filename,\n  };');
    expect(extra).not.toBe(real);
    expect(scanSource(p, extra, { path: p }).map((f) => f.rule)).toEqual(expect.arrayContaining(['record-field', 'field-read']));
    const cast = real.replace('  return {\n    opaqueId: id,', '  return r as unknown as AssetRecord;\n  return {\n    opaqueId: id,');
    expect(cast).not.toBe(real);
    expect(scanSource(p, cast, { path: p }).map((f) => f.rule)).toContain('record-passthrough');
  });
});
