/// <reference types="node" />
/**
 * BL-1409 (NX-39-R42, R43): the backup flag is read back at open, replace, restore and rebuild, a restored index is
 * rebuilt and never trusted, and a restored picture is stripped again. A planted wrong flag is reported each time.
 * Mutants run by hand (see the PR): skip each read-back; trust a restored index; skip the strip before display.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('expo-file-system', () => ({ Directory: class {}, File: class {}, Paths: { document: { uri: '' } } }));
vi.mock('../modules/scribe-files', () => ({ ScribeFiles: null }));

import { indexAfterRestore, readBackFlag, stripBeforeDisplay, type ReadBackMoment } from '../src/lib/backup/readback';
import { DAYS_FILE, DAYS_TMP, readDays, readDaysAfterRestore, writeDays, type DaysPort } from '../src/lib/days/store-file';
import { MOMENTS_FILE, readMoments, readMomentsAfterRestore, writeMoments, type MomentsPort } from '../src/lib/moments/store-file';
import { carriesMetadata } from '../src/lib/photos/strip';
import { makeJpeg } from './photos-helpers';

function disk(flagSticks = true) {
  const files = new Map<string, string>();
  const excluded = new Set<string>();
  const port: DaysPort & MomentsPort = {
    exists: (n) => files.has(n),
    createEmpty: (n) => void files.set(n, ''),
    write: (n, t) => void files.set(n, t),
    read: (n) => files.get(n) ?? '',
    rename: async (a, b) => {
      files.set(b, files.get(a) ?? '');
      files.delete(a);
      if (excluded.delete(a)) excluded.add(b);
    },
    remove: (n) => void (files.delete(n), excluded.delete(n)),
    list: () => [...files.keys()],
    setExcluded: (n) => void (flagSticks && excluded.add(n)),
    isExcluded: (n) => excluded.has(n),
  };
  return { files, excluded, port };
}
const A = '1a2b3c4d5e6f7a8b';
const days = { v: 1, owner: A, ticked: { 'seasonal.synthetic-day': {} } };
const moments = { v: 1, owner: A, dayKeys: ['2026-05-01'], labels: {}, hiddenPlaces: [], homePlace: {}, unknown: {} };

describe('[BL-1409] the flag is read back at each moment', () => {
  for (const moment of ['open', 'replace', 'restore', 'rebuild'] as ReadBackMoment[]) {
    it(`a planted wrong flag at ${moment} is reported and the file removed`, () => {
      const d = disk();
      d.files.set('x', 'secret'); // present, not excluded
      expect(readBackFlag(d.port, 'x', moment)).toEqual({ ok: false, moment, removed: true });
      expect(d.files.has('x')).toBe(false);
    });
  }
  it('a right flag and an absent file pass; a throwing read is cannot-read and keeps the file', () => {
    const d = disk();
    expect(readBackFlag(d.port, 'none', 'open')).toEqual({ ok: true });
    d.files.set('x', 'a');
    d.excluded.add('x');
    expect(readBackFlag(d.port, 'x', 'open')).toEqual({ ok: true });
    const bad = { ...d.port, isExcluded: () => { throw new Error('native'); } };
    expect(readBackFlag(bad, 'x', 'open')).toEqual({ ok: false, moment: 'open', cannotRead: true });
    expect(d.files.has('x')).toBe(true); // a read that threw keeps the file
  });
});

describe('[BL-1409] days and moments stores wire the read-back', () => {
  it('open: a restored days file whose flag was lost is removed and never read', () => {
    const d = disk();
    d.files.set(DAYS_FILE, JSON.stringify(days));
    expect(readDays(d.port, A)).toEqual({ state: 'unavailable' });
    expect(d.files.has(DAYS_FILE)).toBe(false);
  });
  it('replace: a rename that loses the flag leaves no file (days and moments)', async () => {
    const d = disk();
    d.port.rename = async (a, b) => void (d.files.set(b, d.files.get(a) ?? ''), d.files.delete(a), d.excluded.delete(a)); // flag lost
    expect(await writeDays(d.port, days as never)).toBe('unavailable');
    expect(d.files.has(DAYS_FILE)).toBe(false);
    expect(await writeMoments(d.port, moments as never)).toBe('unavailable');
    expect(d.files.has(MOMENTS_FILE)).toBe(false);
  });
  it('restore: a file that arrived with a restore is read back, removed when wrong, and not read', () => {
    const d = disk();
    d.files.set(DAYS_FILE, JSON.stringify(days));
    const read = vi.spyOn(d.port, 'read');
    expect(readDaysAfterRestore(d.port, A)).toEqual({ state: 'unavailable' });
    expect(read).not.toHaveBeenCalled();
    d.files.set(MOMENTS_FILE, JSON.stringify(moments));
    expect(readMomentsAfterRestore(d.port, A)).toEqual({ state: 'unavailable' });
    expect(read).not.toHaveBeenCalled();
    expect(d.files.has(MOMENTS_FILE)).toBe(false);
  });
  it('restore: a file that still reads excluded is the live local one and reads as normal', async () => {
    const d = disk();
    await writeDays(d.port, days as never);
    expect(readDaysAfterRestore(d.port, A).state).toBe('ok');
    await writeMoments(d.port, moments as never);
    expect(readMomentsAfterRestore(d.port, A).state).toBe('ok');
  });
  it('open: a flag read that throws keeps the days and moments files and reads unreadable', () => {
    const d = disk();
    d.files.set(DAYS_FILE, JSON.stringify(days));
    d.files.set(MOMENTS_FILE, JSON.stringify(moments));
    d.port.isExcluded = () => {
      throw new Error('native');
    };
    expect(readDays(d.port, A)).toEqual({ state: 'unreadable' });
    expect(readMoments(d.port, A)).toEqual({ state: 'unreadable' });
    expect(d.files.has(DAYS_FILE) && d.files.has(MOMENTS_FILE)).toBe(true);
  });
  it('write tmp is excluded before any byte: a flag that will not stick writes nothing', async () => {
    const d = disk(false);
    expect(await writeDays(d.port, days as never)).toBe('unavailable');
    expect(d.files.has(DAYS_TMP)).toBe(false);
  });
});

describe('[BL-1409] rebuild after restore: a restored index is never trusted', () => {
  it('a restored index with a wrong flag is removed and rebuilt, never read', () => {
    const d = disk();
    d.files.set('idx', 'planted');
    const read = vi.fn(() => 'stale');
    const r = indexAfterRestore(d.port, 'idx', { restored: true, read, rebuild: () => 'fresh' });
    expect(r).toEqual({ value: 'fresh', source: 'rebuilt' });
    expect(read).not.toHaveBeenCalled();
    expect(d.files.has('idx')).toBe(false);
  });
  it('a restored index with a RIGHT flag is still rebuilt (the flag proves nothing about contents)', () => {
    const d = disk();
    d.files.set('idx', 'planted');
    d.excluded.add('idx');
    const read = vi.fn(() => 'stale');
    expect(indexAfterRestore(d.port, 'idx', { restored: true, read, rebuild: () => 'fresh' }).source).toBe('rebuilt');
    expect(read).not.toHaveBeenCalled();
  });
  it('not restored and flag right: read as normal', () => {
    const d = disk();
    d.files.set('idx', 'ok');
    d.excluded.add('idx');
    expect(indexAfterRestore(d.port, 'idx', { restored: false, read: () => 'mine', rebuild: () => 'fresh' }).source).toBe('read');
  });
});

describe('[BL-1409] the strip pass runs again before a restored picture is shown', () => {
  it('a located picture in a restored folder comes out without metadata; a non-picture is refused', () => {
    const located = makeJpeg({ exif: true, icc: true, jfifThumb: true, seed: 7 });
    expect(carriesMetadata(located)).toBe(true);
    const out = stripBeforeDisplay(located);
    expect(out).not.toBeNull();
    expect(carriesMetadata(out as Uint8Array)).toBe(false);
    expect(stripBeforeDisplay(Uint8Array.of(1, 2, 3, 4, 5))).toBeNull();
  });
});
