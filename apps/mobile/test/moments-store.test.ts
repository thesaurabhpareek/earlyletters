/// <reference types="node" />
/**
 * The moments store (NS-53-R221, R249, R250; ADR 0032 amendment; CDO-23, CPrivO-16), on a disk laid out as the phone
 * has it with a ScribeFiles stand-in. Fictional family Asha only; place keys and labels are synthetic. The wipes
 * through Erase everything, sign-out and book deletion are in moments-hooks.test.ts and erase-all.test.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  excluded: new Set<string>(),
  mode: 'stick' as 'stick' | 'ignore' | 'absent',
  written: 0,
  hold: null as Promise<void> | null,
}));
vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk);
  const { move, write } = fs.File.prototype;
  fs.File.prototype.move = async function (this: { uri: string }, to: { uri: string }, o?: { overwrite?: boolean }) {
    await move.call(this, to, o);
    if (h.excluded.delete(this.uri)) h.excluded.add(to.uri);
    if (h.hold) await h.hold;
  };
  fs.File.prototype.write = function (this: { uri: string }, c: string | Uint8Array) {
    h.written += c.length;
    return write.call(this, c);
  };
  return fs;
});
vi.mock('../modules/scribe-files', () => ({
  get ScribeFiles() {
    if (h.mode === 'absent') return null;
    return {
      setExcludedFromBackup: (uri: string, on: boolean) => h.mode === 'stick' && (on ? h.excluded.add(uri) : h.excluded.delete(uri)),
      isExcludedFromBackup: (uri: string) => h.excluded.has(uri),
    };
  },
}));

const { createMomentsStore, momentsStore, endMomentsSession, eraseMomentsFile, MomentsStoreError } = await import('../src/lib/moments/store');
const { parseMoments, serializeMoments, emptyMoments } = await import('../src/lib/moments/store.logic');
const { expoMomentsPort, readMoments, writeMoments, removeMoments, MOMENTS_FILE, MOMENTS_TMP } = await import('../src/lib/moments/store-file');

const A = '1a2b3c4d5e6f7a8b';
const B = '9f8e7d6c5b4a3921';
const BOOK = '0199a5b0-0000-7000-8000-00000000a5a1';
const BOOK2 = '0199a5b0-0000-7000-8000-00000000b0b1';
const dir = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/moments`;
const names = () => [...h.disk.files.keys()].filter((u) => u.startsWith(dir() + '/')).map((u) => u.slice(dir().length + 1));
const text = () => new TextDecoder().decode(h.disk.files.get(`${dir()}/${MOMENTS_FILE}`)!.data);
const onDisk = () => JSON.parse(text());
const file = (owner = A) => ({ ...emptyMoments(owner), dayKeys: ['2026-10-03'], labels: { '2026-10-03': 'Asha at the lake' }, hiddenPlaces: ['ext:place-1'], homePlace: { [BOOK]: 'ext:place-2' } });
const seed = (t: string) => {
  const port = expoMomentsPort()!;
  port.createEmpty(MOMENTS_FILE);
  port.setExcluded(MOMENTS_FILE);
  port.write(MOMENTS_FILE, t);
  return port;
};
const fresh = (owner = A) => createMomentsStore(() => expoMomentsPort(), owner);

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-MOMENTS0001'));
  Object.assign(h, { excluded: new Set(), mode: 'stick', written: 0, hold: null });
});

describe('[R221] the file holds exactly the R221 members', () => {
  it('a write has v, owner, dayKeys, labels, hiddenPlaces and homePlace and nothing else', async () => {
    expect(await writeMoments(expoMomentsPort()!, file())).toBe('ok');
    expect(Object.keys(onDisk()).sort()).toEqual(['dayKeys', 'hiddenPlaces', 'homePlace', 'labels', 'owner', 'v']);
  });

  it('refuses what R221 says is never stored: a picture id, an album, a coordinate, a place name, a long or empty label, a bad day', async () => {
    const s = fresh();
    const bad = [
      await s.addDayKey('2026-10-03T08:00:00Z'),
      await s.addDayKey('2026-13-40'),
      await s.setLabel('2026-10-03', 'x'.repeat(61)),
      await s.setLabel('2026-10-03', '   '),
      await s.hidePlace('Lake Asha, 41.2 -73.1'),
      await s.setHomePlace(BOOK, 'a place with spaces'),
    ];
    expect(bad.every((r) => !r.ok)).toBe(true);
    expect(names()).toEqual([]);
    expect(await s.setLabel('2026-10-03', 'x'.repeat(60))).toEqual({ ok: true });
  });

  it('a file carrying an asset, album or coordinate member in a known shape is corrupt only if a known member is off; unknown members are kept, not read', () => {
    const p = parseMoments(JSON.stringify({ ...file(), assetId: 'IMG_0001', album: 'Family' }));
    expect(p.kind).toBe('ok');
    expect(parseMoments(JSON.stringify({ ...file(), dayKeys: ['not a date'] })).kind).toBe('corrupt');
    expect(parseMoments(JSON.stringify({ ...file(), labels: { '2026-10-03': 'x'.repeat(61) } })).kind).toBe('corrupt');
    expect(parseMoments(JSON.stringify({ ...file(), hiddenPlaces: ['Lake Asha'] })).kind).toBe('corrupt');
  });

  it('unknown fields are preserved on write', async () => {
    seed(JSON.stringify({ ...file(), future: { a: 1 } }));
    expect(await fresh().addDayKey('2026-10-04')).toEqual({ ok: true });
    expect(onDisk().future).toEqual({ a: 1 });
    expect(onDisk().dayKeys).toEqual(['2026-10-03', '2026-10-04']);
  });

  it('a higher v reads as empty, writes nothing and is not deleted by this build', async () => {
    const port = seed(JSON.stringify({ v: 9, owner: A, whatever: true }));
    const s = fresh();
    expect(s.load()).toEqual({ state: 'empty' });
    expect(await s.addDayKey('2026-10-03')).toEqual({ ok: false, code: 'moments_store_unavailable' });
    expect(JSON.parse(port.read(MOMENTS_FILE))).toEqual({ v: 9, owner: A, whatever: true });
  });

  it('a corrupt file is deleted and reads as empty, with nothing said', () => {
    seed('{not json');
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    expect(fresh().load()).toEqual({ state: 'empty' });
    expect(names()).toEqual([]);
    expect(spies.flatMap((s) => s.mock.calls)).toEqual([]);
    spies.forEach((s) => s.mockRestore());
  });

  it('a read that throws is unreadable and the file is kept', () => {
    const port = seed(JSON.stringify(file()));
    expect(readMoments({ ...port, read: () => { throw new Error('EIO'); } }, A)).toEqual({ state: 'unreadable' });
    expect(names()).toEqual([MOMENTS_FILE]);
  });
});

describe('[R250] the file is out of the backup, read back', () => {
  it('a write lands excluded, and an exclusion that reads false (or a missing module) writes 0 bytes and leaves no file', async () => {
    expect(await writeMoments(expoMomentsPort()!, file())).toBe('ok');
    expect(h.excluded.has(`${dir()}/${MOMENTS_FILE}`)).toBe(true);
    removeMoments(expoMomentsPort()!);
    h.written = 0;
    for (const mode of ['ignore', 'absent'] as const) {
      h.mode = mode;
      expect(await writeMoments(expoMomentsPort()!, file())).toBe('unavailable');
      expect(h.written).toBe(0);
      expect(names()).toEqual([]);
    }
  });

  it('a file that lost the exclusion is deleted on open and never used; a leftover temp is swept', async () => {
    const port = expoMomentsPort()!;
    await writeMoments(port, file());
    h.excluded.clear();
    expect(readMoments(port, A)).toEqual({ state: 'unavailable' });
    expect(names()).toEqual([]);
    port.createEmpty(MOMENTS_TMP);
    expect(fresh().load()).toEqual({ state: 'empty' });
    expect(names()).toEqual([]);
  });

  it('a final file that reads as not excluded after the rename is blanked and deleted (the second read-back)', async () => {
    const port = expoMomentsPort()!;
    const p = { ...port, isExcluded: (n: string) => (n === MOMENTS_FILE ? false : port.isExcluded(n)) };
    expect(await writeMoments(p, file())).toBe('unavailable');
    expect(names()).toEqual([]);
  });

  it('a rename that fails leaves the old file whole and no temp', async () => {
    const port = seed(JSON.stringify(file()));
    const w = await writeMoments({ ...port, rename: async () => Promise.reject(new Error('EIO')) }, { ...file(), dayKeys: [] });
    expect(w).toBe('unavailable');
    expect(onDisk().dayKeys).toEqual(['2026-10-03']);
    expect(names()).toEqual([MOMENTS_FILE]);
  });
});

describe('[R221] the owner check fails closed', () => {
  it('a file of another owner is never read or overwritten, and reads as empty', async () => {
    seed(JSON.stringify(file(A)));
    const s = fresh(B);
    expect(s.load()).toEqual({ state: 'empty' });
    expect(await s.addDayKey('2026-10-05')).toEqual({ ok: false, code: 'moments_store_unavailable' });
    expect(onDisk().owner).toBe(A);
  });

  it('launch cleanup deletes a file whose owner no longer matches, and keeps the owner\'s own', async () => {
    seed(JSON.stringify(file(A)));
    await fresh(A).cleanupAtLaunch([BOOK]);
    expect(names()).toEqual([MOMENTS_FILE]);
    await fresh(B).cleanupAtLaunch([BOOK]);
    expect(names()).toEqual([]);
  });

  it('launch cleanup keeps a local file (as sign-in does)', async () => {
    seed(JSON.stringify(file('local')));
    await fresh(B).cleanupAtLaunch([BOOK]);
    expect(names()).toEqual([MOMENTS_FILE]);
  });

  it('a new sign-in removes another signed-in owner\'s file and a local file nobody adopted, and keeps the same owner\'s own', async () => {
    seed(JSON.stringify(file(A)));
    fresh(A).setOwner(B);
    expect(names()).toEqual([]);
    seed(JSON.stringify(file('local')));
    fresh('local').setOwner(B); // a first sign-in that is not a claim: nothing was adopted, so the local file goes (CPO-30)
    expect(names()).toEqual([]);
    removeMoments(expoMomentsPort()!);
    seed(JSON.stringify(file(B)));
    fresh(A).setOwner(B);
    expect(names()).toEqual([MOMENTS_FILE]);
  });
});

describe('[CDO-24] the claim step adopts a local file only on an explicit confirm; sign-out keeps it', () => {
  it('adoptLocal rewrites a local file to the new owner with every row, and the new owner reads it after setOwner', async () => {
    seed(JSON.stringify(file('local')));
    const s = fresh('local');
    expect(await s.adoptLocal(A)).toBe('adopted');
    expect(onDisk()).toEqual(file(A));
    s.setOwner(A);
    expect(names()).toEqual([MOMENTS_FILE]);
    expect(s.load()).toMatchObject({ state: 'ok', file: { owner: A } });
  });

  it('adoptLocal leaves another owner\'s file alone and says none when there is no local file', async () => {
    seed(JSON.stringify(file(B)));
    expect(await fresh('local').adoptLocal(A)).toBe('none');
    expect(onDisk().owner).toBe(B);
    removeMoments(expoMomentsPort()!);
    expect(await fresh('local').adoptLocal(A)).toBe('none');
  });

  it('sign-out (endMomentsSession) keeps a local file; a signed-in owner\'s file still goes; clearNow() takes both', async () => {
    seed(JSON.stringify(file('local')));
    expect(endMomentsSession()).toBe(true);
    expect(onDisk().owner).toBe('local');
    expect(momentsStore.clearNow()).toBe(true);
    expect(names()).toEqual([]);
    seed(JSON.stringify(file(A)));
    expect(endMomentsSession()).toBe(true);
    expect(names()).toEqual([]);
  });

  it('a failed adopt write says failed, leaves the local file byte for byte, and a retry then adopts it', async () => {
    seed(JSON.stringify(file('local')));
    const before = text();
    const s = fresh('local');
    h.mode = 'ignore'; // the new temp file cannot be excluded from the backup, so nothing is written
    expect(await s.adoptLocal(A)).toBe('failed');
    expect(text()).toBe(before);
    h.mode = 'stick';
    expect(await s.adoptLocal(A)).toBe('adopted');
    expect(JSON.parse(text()).owner).toBe(A);
  });

  it('a local write still running when sign-out keeps the file is not deleted behind it', async () => {
    const s = fresh('local');
    let release!: () => void;
    h.hold = new Promise<void>((r) => (release = r));
    const running = s.addDayKey('2026-10-03');
    await new Promise((r) => setTimeout(r, 0));
    s.clearNow(true);
    release();
    expect(await running).toEqual({ ok: false, code: 'moments_write_dropped' });
    expect(onDisk().owner).toBe('local');
  });
});

describe('[CDO-23] launch cleanup removes rows for a book the phone no longer lists (other-device gap UNVERIFIED)', () => {
  it('drops home-place rows of absent books only; day keys and labels stay', async () => {
    seed(JSON.stringify({ ...file(), homePlace: { [BOOK]: 'ext:place-2', [BOOK2]: 'ext:place-3' } }));
    await fresh().cleanupAtLaunch([BOOK]);
    expect(onDisk().homePlace).toEqual({ [BOOK]: 'ext:place-2' });
    expect(onDisk().labels).toEqual({ '2026-10-03': 'Asha at the lake' });
  });

  it('an unreadable book list (null) removes nothing', async () => {
    seed(JSON.stringify(file()));
    await fresh().cleanupAtLaunch(null);
    expect(onDisk().homePlace).toEqual({ [BOOK]: 'ext:place-2' });
  });
});

describe('[CDO-23] a deleted book takes its rows', () => {
  it('removeBook drops that book\'s home place and no other', async () => {
    seed(JSON.stringify({ ...file(), homePlace: { [BOOK]: 'ext:place-2', [BOOK2]: 'ext:place-3' } }));
    expect(await fresh().removeBook(BOOK)).toEqual({ ok: true });
    expect(onDisk().homePlace).toEqual({ [BOOK2]: 'ext:place-3' });
  });
});

describe('[CDO-23] sign-out and Erase everything take the file', () => {
  it('endMomentsSession removes file and temp with nothing awaited, and says false (never throws) when it will not go', async () => {
    await writeMoments(expoMomentsPort()!, file());
    expect(endMomentsSession()).toBe(true);
    expect(names()).toEqual([]);
    await writeMoments(expoMomentsPort()!, file());
    h.disk.undeletable.add(`${dir()}/${MOMENTS_FILE}`);
    expect(() => endMomentsSession()).not.toThrow();
    expect(endMomentsSession()).toBe(false);
  });

  it('eraseMomentsFile removes it, and throws a typed error when it stays', async () => {
    await writeMoments(expoMomentsPort()!, file());
    eraseMomentsFile();
    expect(names()).toEqual([]);
    await writeMoments(expoMomentsPort()!, file());
    h.disk.undeletable.add(`${dir()}/${MOMENTS_FILE}`);
    expect(() => eraseMomentsFile()).toThrow(MomentsStoreError);
    expect(() => eraseMomentsFile()).toThrow(expect.objectContaining({ code: 'moments_file_not_removed' }));
  });

  it('a write still running when a clear lands leaves nothing', async () => {
    const s = fresh();
    let release!: () => void;
    h.hold = new Promise<void>((r) => (release = r));
    const pending = s.setLabel('2026-10-03', 'Asha at the lake');
    await new Promise((r) => setTimeout(r, 5));
    s.clearNow();
    release();
    expect(await pending).toEqual({ ok: false, code: 'moments_write_dropped' });
    expect(names()).toEqual([]);
  });
});

describe('[R250] labels are L4: no log, no analytics, no export, no other reader', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.tsx?$/.test(n) ? [join(d, n)] : []));
  const root = join(__dirname, '..', 'src');

  it('store calls log nothing', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const s = fresh();
    await s.setLabel('2026-10-03', 'canary-label-zq9');
    await s.hidePlace('ext:canary-zq9');
    s.load();
    s.clearNow();
    expect(spies.flatMap((x) => x.mock.calls)).toEqual([]);
    spies.forEach((x) => x.mockRestore());
  });

  it('the moments folder imports no analytics, logging, export, sync or network code', () => {
    const src = walk(join(root, 'lib', 'moments')).map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(src).not.toMatch(/from '[^']*(analytics|export|sync|supabase|logger|crash)[^']*'|console\.|fetch\(/);
  });

  it('the export code never names the file or its store', () => {
    const bad = walk(join(root, 'lib', 'export')).filter((f) => /moments/i.test(readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });

  it('no source outside lib/moments (and the three wipes) reads the store file or names the file', () => {
    const allowed = ['/lib/moments/', '/lib/erase-everything.ts', '/lib/reminders/session.ts'];
    const bad = walk(root).filter((f) => !allowed.some((a) => f.includes(a)) && /moments\/store-file|moments\/store\.logic|moments\.v1\.json/.test(readFileSync(f, 'utf8')));
    expect(bad.map((f) => f.slice(root.length))).toEqual([]);
  });

  it('serializing keeps no member outside the R221 list even when given a stray one', () => {
    const o = JSON.parse(serializeMoments({ ...file(), unknown: {} } as never));
    expect(Object.keys(o).sort()).toEqual(['dayKeys', 'hiddenPlaces', 'homePlace', 'labels', 'owner', 'v']);
  });
});
