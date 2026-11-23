/// <reference types="node" />
/**
 * The days store foundation (NS-47-R6, R11, R15, R16, R28; ADR 0032), on a disk laid out as the phone has it with a
 * ScribeFiles stand-in. Fictional data only; day ids are synthetic slugs. Mutants run by hand (see the PR): skip the
 * read-back; skip the owner check; drop eraseDaysFile or endDaysSession; add a second reader.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  excluded: new Set<string>(),
  mode: 'stick' as 'stick' | 'ignore' | 'absent', // 'ignore': a read-back that says false; 'absent': Expo Go
  written: 0, // bytes ever written, not what is left
  hold: null as Promise<void> | null, // a write waits here after its rename: still running when a clear lands
}));
vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk);
  const { move, write } = fs.File.prototype;
  fs.File.prototype.move = async function (this: { uri: string }, to: { uri: string }, o?: { overwrite?: boolean }) {
    await move.call(this, to, o);
    if (h.excluded.delete(this.uri)) h.excluded.add(to.uri); // a rename keeps the backup attribute on iOS
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

const { createDaysStore, daysStore, DaysStoreError, endDaysSession, eraseDaysFile, loadDays } = await import('../src/lib/days');
const { parseDays, tickDay, DAYS_MAX_BYTES, DAYS_MAX_TICKS } = await import('../src/lib/days/store.logic');
const { expoDaysPort, readDays, writeDays, DAYS_FILE, DAYS_TMP, removeDays } = await import('../src/lib/days/store-file');

const A = '1a2b3c4d5e6f7a8b';
const B = '9f8e7d6c5b4a3921';
const DAY = 'seasonal.synthetic-day';
const file = (owner = A) => ({ v: 1, owner, ticked: { [DAY]: {} } });
const dir = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/days`;
const names = () => [...h.disk.files.keys()].filter((u) => u.startsWith(dir() + '/')).map((u) => u.slice(dir().length + 1));
const seed = (text: string) => {
  const port = expoDaysPort()!;
  port.createEmpty(DAYS_FILE);
  port.setExcluded(DAYS_FILE);
  port.write(DAYS_FILE, text);
  return port;
};

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-DAYS00000001'));
  Object.assign(h, { excluded: new Set(), mode: 'stick', written: 0, hold: null });
});

describe('[NS-47-R6] the store is out of the backup and fails closed', () => {
  it('a write lands in Application Support, excluded and read back; the file holds a slug and the owner only', async () => {
    const port = expoDaysPort()!;
    expect(await writeDays(port, file())).toBe('ok');
    expect(names()).toEqual([DAYS_FILE]);
    expect(h.excluded.has(`${dir()}/${DAYS_FILE}`)).toBe(true);
    expect(JSON.parse(port.read(DAYS_FILE))).toEqual({ v: 1, owner: A, ticked: { [DAY]: {} } });
    expect(readDays(port, A)).toMatchObject({ state: 'ok' });
  });

  it('an exclusion that reads false (or a module that is absent) writes 0 bytes and leaves no file', async () => {
    for (const mode of ['ignore', 'absent'] as const) {
      h.mode = mode;
      expect(await writeDays(expoDaysPort()!, file())).toBe('unavailable');
      expect(h.written).toBe(0);
      expect(names()).toEqual([]);
    }
  });

  it('a file that lost the exclusion is deleted on open and never used; a leftover temp is swept at the first read', async () => {
    const port = expoDaysPort()!;
    await writeDays(port, file());
    h.excluded.clear();
    expect(readDays(port, A)).toEqual({ state: 'unavailable' });
    expect(names()).toEqual([]);
    port.createEmpty(DAYS_TMP);
    expect(loadDays(A)).toEqual({ state: 'empty' });
    expect(names()).toEqual([]);
  });
});

describe('[NS-47-R28] the store file is protected, versioned and fails closed', () => {
  it('a corrupt file reads as nothing, does not crash, and is not deleted', () => {
    const port = seed('{not json');
    expect(readDays(port, A)).toEqual({ state: 'unreadable' });
    expect(port.read(DAYS_FILE)).toBe('{not json');
  });

  it('a higher version is read for known keys and flagged, so no writer rewrites it', () => {
    seed(JSON.stringify({ v: 9, owner: A, ticked: { [DAY]: { future: 1, authority: 'src-a' } }, extra: true }));
    expect(readDays(expoDaysPort()!, A)).toMatchObject({ state: 'newer', file: { v: 9, ticked: { [DAY]: { authority: 'src-a' } } } });
  });
});

describe('[NS-47-R15] sign-out clears and B sees nothing', () => {
  it('A signs out: the file is gone with nothing awaited, B reads nothing, and a file of A read as B is empty', async () => {
    await writeDays(expoDaysPort()!, file());
    expect(readDays(expoDaysPort()!, B)).toEqual({ state: 'foreign', owner: A }); // the owner check, before any clear
    expect(endDaysSession()).toBe(true);
    expect(names()).toEqual([]);
    expect(loadDays(B)).toEqual({ state: 'empty' });
  });

  it('endDaysSession never throws when the file will not go, and says false', async () => {
    await writeDays(expoDaysPort()!, file());
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
    expect(() => endDaysSession()).not.toThrow();
    expect(endDaysSession()).toBe(false);
  });
});

describe('[NS-47-R16] erase scan finds nothing', () => {
  const scan = () => names(); // the Erase scan's days row: every file under the days folder

  it('positive control: the scan finds a synthetic file and temp; Erase removes both; a file that will not go says so', () => {
    const port = expoDaysPort()!;
    for (const n of [DAYS_FILE, DAYS_TMP]) {
      port.createEmpty(n);
      port.write(n, '{}');
    }
    expect(scan()).toEqual([DAYS_FILE, DAYS_TMP]);
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
    expect(removeDays(port)).toBe(false); // eraseDaysFile throws on this, so the erase mark stays and resumes
    h.disk.undeletable.clear();
    expect(removeDays(port)).toBe(true);
    expect(scan()).toEqual([]);
  });

  it('eraseDaysFile removes the file, and throws a typed error when it stays (the mark then stays)', async () => {
    await writeDays(expoDaysPort()!, file());
    eraseDaysFile();
    expect(names()).toEqual([]);
    await writeDays(expoDaysPort()!, file());
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
    expect(() => eraseDaysFile()).toThrow(DaysStoreError);
    expect(() => eraseDaysFile()).toThrow(expect.objectContaining({ code: 'days_file_not_removed' }));
    expect(names()).toEqual([DAYS_FILE]);
  });
});

describe('[NS-47-R6] the write is atomic (AIE-R14)', () => {
  const old = JSON.stringify({ v: 1, owner: A, ticked: { 'seasonal.old-day': {} } });
  const onDisk = () => JSON.parse(expoDaysPort()!.read(DAYS_FILE));
  const withPort = (over: Partial<ReturnType<typeof expoDaysPort> & object>) => ({ ...expoDaysPort()!, ...over });

  it('the final file is never written in place: new bytes go to the temp, and the old file reads whole until the rename', async () => {
    const port = seed(old);
    const seen: string[] = [];
    const spy = withPort({
      write: (n, t) => (seen.push(n), port.write(n, t)),
      rename: async (a, b) => (seen.push(`during:${onDisk().ticked['seasonal.old-day'] ? 'old' : 'new'}`), port.rename(a, b)),
    });
    expect(await writeDays(spy, file())).toBe('ok');
    expect(seen).toEqual([DAYS_TMP, 'during:old']);
    expect(onDisk().ticked).toEqual({ [DAY]: {} });
  });

  it('a rename that fails, or a write that dies half way, leaves the old file whole and no temp', async () => {
    const port = seed(old);
    expect(await writeDays(withPort({ rename: async () => Promise.reject(new Error('EIO')) }), file())).toBe('unavailable');
    expect(onDisk().ticked).toEqual({ 'seasonal.old-day': {} });
    expect(names()).toEqual([DAYS_FILE]);
    const dies = withPort({ write: (n) => (port.write(n, '{"v":1,"ow'), (() => { throw new Error('killed'); })()) });
    expect(await writeDays(dies, file())).toBe('unavailable');
    expect(onDisk().ticked).toEqual({ 'seasonal.old-day': {} });
    expect(names()).toEqual([DAYS_FILE]);
  });
});

describe('[NS-47-R28] a read that fails, or a file that is off-shape, shows no day', () => {
  it('a read that throws is unreadable and the file is kept', () => {
    const port = seed(JSON.stringify(file()));
    expect(readDays({ ...port, read: () => { throw new Error('EIO'); } }, A)).toEqual({ state: 'unreadable' });
    expect(names()).toEqual([DAYS_FILE]);
  });
});

describe('[NS-47-R1] nothing of the file is logged', () => {
  it('reads, writes, sweeps and clears over day and owner content call no console method', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const port = expoDaysPort()!;
    await writeDays(port, { v: 1, owner: A, ticked: { 'canary-day-zq9': {} } });
    loadDays(A);
    loadDays(B);
    readDays(port, A);
    seed('{canary-day-zq9 not json');
    loadDays(A);
    removeDays(port);
    expect(spies.flatMap((s) => s.mock.calls)).toEqual([]);
    spies.forEach((s) => s.mockRestore());
  });
});

describe('[NS-47-R11] one reader', () => {
  it('no source file outside lib/days imports the store file or names its keys', () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.tsx?$/.test(n) ? [join(d, n)] : []));
    const root = join(__dirname, '..', 'src');
    const bad = walk(root).filter((f) => !f.includes('/lib/days/') && /days\/store-file|days\/store\.logic|days\.v1\.json|culture\.asked|asks\.daysAsked/.test(readFileSync(f, 'utf8')));
    expect(bad.map((f) => f.slice(root.length))).toEqual([]);
  });
});

const UNAVAILABLE = { ok: false, code: 'days_store_unavailable' };
const DROPPED = { ok: false, code: 'days_write_dropped' };
const fresh = (owner = A) => {
  return createDaysStore(() => expoDaysPort(), owner); // already signed in as `owner`: no sign-in retry runs
};
const text = () => new TextDecoder().decode(h.disk.files.get(`${dir()}/${DAYS_FILE}`)!.data);

describe('[NS-47-R6] a tick is saved as it is made, on one queue', () => {
  it('tick, untick and clear all write the file, tell subscribers, and two ticks at once both land', async () => {
    const s = fresh();
    const heard: number[] = [];
    const off = s.subscribeDays(() => heard.push(1));
    expect(await Promise.all([s.tickDay(DAY), s.tickDay('family.synthetic-two')])).toEqual([{ ok: true }, { ok: true }]);
    expect(Object.keys(JSON.parse(text()).ticked)).toEqual([DAY, 'family.synthetic-two']);
    await s.untickDay(DAY);
    expect(Object.keys(JSON.parse(text()).ticked)).toEqual(['family.synthetic-two']);
    await s.clearAllDays();
    expect(JSON.parse(text()).ticked).toEqual({});
    expect(heard).toHaveLength(4);
    off();
    expect(await s.tickDay('Asha birthday!')).toEqual(UNAVAILABLE); // not a slug: refused, never stored
    expect(names()).toEqual([DAYS_FILE]);
  });

  it('an exclusion that reads false ticks nothing; a corrupt or newer file is not overwritten', async () => {
    h.mode = 'ignore';
    expect(await fresh().tickDay(DAY)).toEqual(UNAVAILABLE);
    expect(h.written).toBe(0);
    h.mode = 'stick';
    const odd = seed('{not json');
    expect(await fresh().tickDay(DAY)).toEqual(UNAVAILABLE);
    expect(odd.read(DAYS_FILE)).toBe('{not json');
  });
});

describe('[NS-47-R28] a value is a known shape, never free text', () => {
  const tick = (t: unknown, v = 1) => parseDays(JSON.stringify({ v, owner: A, ticked: { [DAY]: t } })).kind;
  it('rejects free text in any value, an unknown key, and a wrong type; a higher version drops unknown keys', () => {
    for (const t of [{ authority: 'Asha birthday!' }, { note: 'x' }, { move: { date: 'for Asha', always: true } }, { offYear: ['2027'] }, { move: { date: '2027-05-09', always: 'yes' } }, []]) expect(tick(t)).toBe('corrupt');
    expect(tick({ move: { date: '2027-05-09', always: false, year: 2027 }, authority: 'src-a', offYear: [2028] })).toBe('ok');
    expect(tick({ note: 'x' }, 2)).toBe('newer');
  });
});

describe('[NS-47-R15] a file of another owner is never adopted, merged or overwritten', () => {
  it('B ticking over A\'s file, and A over a local file, write nothing and leave the file byte for byte (DAYS-4: refuse)', async () => {
    await fresh(A).tickDay(DAY);
    const before = text();
    expect(loadDays(B)).toEqual({ state: 'empty' }); // B is never told a file existed
    h.written = 0;
    expect(await fresh(B).tickDay('family.synthetic-two')).toEqual(UNAVAILABLE);
    expect(await fresh(B).clearAllDays()).toEqual(UNAVAILABLE);
    expect(h.written).toBe(0);
    expect(text()).toBe(before);
    expect(endDaysSession()).toBe(true); // sign-out clears it, and only then can B write
    expect(await fresh(B).tickDay('family.synthetic-two')).toEqual({ ok: true });
    await writeDays(expoDaysPort()!, file('local'));
    const local = text();
    expect(await fresh(A).tickDay(DAY)).toEqual(UNAVAILABLE); // only the claim step adopts (next PR)
    expect(text()).toBe(local);
  });

  it('a queued write is dropped by a clear, and a write already past its rename does not bring the file back', async () => {
    const s = fresh();
    await s.tickDay(DAY);
    const queued = s.tickDay('family.synthetic-two');
    expect(s.clearNow()).toBe(true);
    expect(await queued).toEqual(DROPPED);
    let release = () => {};
    h.hold = new Promise<void>((r) => (release = r));
    const running = s.tickDay(DAY);
    await new Promise((r) => setTimeout(r, 5));
    s.clearNow();
    release();
    expect(await running).toEqual(DROPPED);
    expect(names()).toEqual([]);
  });
});

describe('[NS-47-R15] an owner change drops writes and retries a stale clear', () => {
  it('a write queued under A never lands under B, and says it was dropped, not failed', async () => {
    const s = fresh(A);
    const queued = s.tickDay(DAY);
    s.setOwner(B);
    expect(await queued).toEqual({ ok: false, code: 'days_write_dropped' });
    expect(names()).toEqual([]);
    expect(await s.tickDay(DAY)).toEqual({ ok: true });
    expect(JSON.parse(text()).owner).toBe(B);
  });

  it('sign-in retries a clear that was stuck: the next account is not blocked; a local file is left for the claim step', async () => {
    const s = fresh(A);
    await s.tickDay(DAY);
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
    expect(s.clearNow()).toBe(false); // A's sign-out clear is stuck
    h.disk.undeletable.clear();
    expect(await fresh(B).tickDay(DAY)).toEqual(UNAVAILABLE); // still refused: nothing of A is overwritten
    s.setOwner(B); // B signs in: the clear is retried
    expect(names()).toEqual([]);
    expect(await s.tickDay(DAY)).toEqual({ ok: true });
    await s.clearNow();
    await writeDays(expoDaysPort()!, file('local'));
    s.setOwner(A); // a FIRST sign-in that is not a claim: the claim step never adopted, so the local file is deleted (E73, CPO-30)
    expect(names()).toEqual([]);
  });
});

describe('[CPO-30] the claim step adopts a local file only on an explicit confirm; sign-out keeps it', () => {
  it('adoptLocal rewrites a local file to the new owner, keeps the ticks, and the new owner reads it after setOwner', async () => {
    seed(JSON.stringify(file('local')));
    const s = fresh('local');
    expect(await s.adoptLocal(A)).toBe('adopted');
    expect(JSON.parse(text())).toEqual(file(A));
    s.setOwner(A);
    expect(names()).toEqual([DAYS_FILE]); // setOwner keeps the file it was adopted into
    expect(s.load()).toMatchObject({ state: 'ok', file: { owner: A } });
  });

  it('adoptLocal leaves another owner\'s file alone and says none when there is no local file', async () => {
    seed(JSON.stringify(file(B)));
    expect(await fresh('local').adoptLocal(A)).toBe('none');
    expect(JSON.parse(text()).owner).toBe(B);
    removeDays(expoDaysPort()!);
    expect(await fresh('local').adoptLocal(A)).toBe('none');
  });

  it('sign-out (endDaysSession) keeps a local file, as "Not my account" must; a signed-in owner\'s file still goes; Erase takes both', async () => {
    seed(JSON.stringify(file('local')));
    expect(endDaysSession()).toBe(true);
    expect(JSON.parse(text()).owner).toBe('local');
    expect(daysStore.clearNow()).toBe(true); // Erase and the other callers keep deleting everything
    expect(names()).toEqual([]);
    seed(JSON.stringify(file(A)));
    expect(endDaysSession()).toBe(true);
    expect(names()).toEqual([]);
  });

  it('[BL-1598] after a partial adopt, sign-out removes the adopted file and keeps the file that stayed local', async () => {
    // days adopted into account A; the other store (same rule, own file) stayed local: sign-out must clear only the adopted one
    seed(JSON.stringify(file('local')));
    const s = fresh('local');
    expect(await s.adoptLocal(A)).toBe('adopted');
    s.setOwner(A);
    expect(s.clearNow(true)).toBe(true);
    expect(names()).toEqual([]); // adopted (owner-keyed) file gone: nothing reaches the next person
    seed(JSON.stringify(file('local')));
    h.mode = 'ignore'; // this store's adopt fails, so its file stays local
    const t = fresh('local');
    expect(await t.adoptLocal(A)).toBe('failed');
    h.mode = 'stick';
    expect(t.clearNow(true)).toBe(true);
    expect(JSON.parse(text())).toEqual(file('local')); // kept byte for byte, still offered at the next claim
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
    const s = createDaysStore(() => expoDaysPort(), 'local');
    let release!: () => void;
    h.hold = new Promise<void>((r) => (release = r));
    const running = s.tickDay(DAY);
    await new Promise((r) => setTimeout(r, 0));
    s.clearNow(true);
    release();
    expect(await running).toEqual(DROPPED);
    expect(JSON.parse(text()).owner).toBe('local');
  });
});

describe('[NS-47-R6] a failure after the rename deletes the final file too', () => {
  it('a read-back that throws, or an emptying write that throws, leaves no file and no temp', async () => {
    const real = expoDaysPort()!;
    const readBackThrows = { ...real, isExcluded: (n: string) => (n === DAYS_FILE ? (() => { throw new Error('x'); })() : real.isExcluded(n)) };
    expect(await writeDays(readBackThrows, file())).toBe('unavailable');
    expect(names()).toEqual([]);
    const lostThenWriteThrows = { ...real, isExcluded: (n: string) => n !== DAYS_FILE && real.isExcluded(n), write: (n: string, t: string) => { if (n === DAYS_FILE) throw new Error('x'); real.write(n, t); } };
    expect(await writeDays(lostThenWriteThrows, file())).toBe('unavailable');
    expect(names()).toEqual([]);
  });
});

describe('[NS-47-R6] BL-1200: a file that is too big or too crowded reads as unreadable and is kept', () => {
  const many = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`seasonal.synthetic-${i}`, {}]));
  const text = (ticked: unknown) => JSON.stringify({ v: 1, owner: A, ticked });

  it('a file over the byte cap is unreadable and kept, and its text is never read', () => {
    const big = JSON.stringify(file()) + ' '.repeat(DAYS_MAX_BYTES);
    const port = seed(big);
    const read = vi.fn(port.read);
    expect(readDays({ ...port, read }, A)).toEqual({ state: 'unreadable' });
    expect(read).not.toHaveBeenCalled();
    expect(names()).toEqual([DAYS_FILE]);
    expect(port.read(DAYS_FILE)).toBe(big);
  });

  it('text over the cap is corrupt even when a port cannot say a size, and a file at the cap still reads', () => {
    const pad = (n: number) => JSON.stringify(file()) + ' '.repeat(n - JSON.stringify(file()).length);
    expect(parseDays(pad(DAYS_MAX_BYTES + 1)).kind).toBe('corrupt');
    expect(parseDays(pad(DAYS_MAX_BYTES)).kind).toBe('ok');
  });

  it('more ticks than the limit is corrupt and kept; exactly the limit reads; a tick past it is refused', () => {
    expect(parseDays(text(many(DAYS_MAX_TICKS))).kind).toBe('ok');
    const port = seed(text(many(DAYS_MAX_TICKS + 1)));
    expect(readDays(port, A)).toEqual({ state: 'unreadable' });
    expect(names()).toEqual([DAYS_FILE]);
    expect(tickDay({ v: 1, owner: A, ticked: many(DAYS_MAX_TICKS) }, 'seasonal.one-more')).toBeNull();
    expect(tickDay({ v: 1, owner: A, ticked: many(DAYS_MAX_TICKS) }, 'seasonal.synthetic-0')).not.toBeNull(); // already ticked: no growth
  });

  it('an id that is not a slug is corrupt, in a current or a newer file', () => {
    for (const id of ['Asha birthday', 'UPPER', '', '.dot', 'a'.repeat(65), 'seasonal/day', '__proto__x']) {
      for (const v of [1, 2]) expect(parseDays(JSON.stringify({ v, owner: A, ticked: { [id]: {} } })).kind).toBe('corrupt');
    }
  });

  it('a duplicate id in the file text is corrupt, and a repeated off-year is corrupt', () => {
    expect(parseDays(`{"v":1,"owner":"${A}","ticked":{"${DAY}":{},"${DAY}":{"authority":"src-a"}}}`).kind).toBe('corrupt');
    expect(parseDays(text({ [DAY]: { offYear: [2027, 2027] } })).kind).toBe('corrupt');
    expect(parseDays(text({ [DAY]: { offYear: [2027, 2028] } })).kind).toBe('ok');
  });
});

describe('[NS-47-R6] BL-1269: a rename that drops the exclusion flag leaves nothing', () => {
  it('the final file reads not excluded after the rename: unavailable, no file, no temp', async () => {
    const real = expoDaysPort()!;
    const dropsOnRename = { ...real, rename: async (a: string, b: string) => { await real.rename(a, b); h.excluded.delete(`${dir()}/${b}`); } };
    expect(await writeDays(dropsOnRename, file())).toBe('unavailable');
    expect(names()).toEqual([]);
  });
});

describe('[NS-47-R28] a day id that is an Object.prototype name is not ticked unless it is an own key', () => {
  const full = () => {
    const ticked: Record<string, object> = {};
    for (let i = 0; i < DAYS_MAX_TICKS; i++) ticked[`d${i}`] = {};
    return { v: 1, owner: A, ticked };
  };
  it.each(['constructor', 'toString', 'hasOwnProperty'])('%s on a full file is refused, not counted as already ticked', (id) => {
    const parsed = parseDays(JSON.stringify(full()));
    if (parsed.kind !== 'ok') throw new Error('arrange');
    expect(tickDay(parsed.file, id)).toBeNull();
    expect(tickDay(parsed.file, 'd7')).not.toBeNull(); // a real repeat still passes
  });
  it('constructor ticked on a roomy file stores an empty tick, not the inherited function', () => {
    const next = tickDay({ v: 1, owner: A, ticked: {} }, 'constructor');
    expect(next && Object.prototype.hasOwnProperty.call(next.ticked, 'constructor')).toBe(true);
    expect(next?.ticked.constructor).toEqual({});
    expect(JSON.parse(JSON.stringify(next)).ticked).toEqual({ constructor: {} });
  });
});

describe('[NS-47-R15] sign-out with a local file that cannot be read', () => {
  it('removes it: only an ok or newer local file stays (facts for the PR; no change made)', () => {
    seed('{not json');
    expect(createDaysStore(() => expoDaysPort()).clearNow(true)).toBe(true);
    expect(names()).toEqual([]);
  });
});
