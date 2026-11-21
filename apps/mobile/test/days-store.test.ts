/// <reference types="node" />
/**
 * The days store foundation (NS-47-R6, R11, R15, R16, R28; ADR 0032; BRIEF NS-47), on a disk laid out as the phone has it
 * (helpers/expo-fs-standin.ts) with a ScribeFiles stand-in. Fictional Asha only; day ids here are synthetic slugs.
 * Mutants (each run by hand and recorded in the PR): skip the read-back in writeDays; skip the owner check in readDays;
 * drop eraseDaysFile from eraseDeviceFiles; drop endDaysSession from settleReminderSession; add a second importer.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  excluded: new Set<string>(),
  /** 'stick' keeps the exclusion, 'ignore' leaves it false (a read-back that says false), 'absent' is Expo Go. */
  mode: 'stick' as 'stick' | 'ignore' | 'absent',
  /** Bytes ever written to any file (not what is left): a write that is undone still counts. */
  written: 0,
  /** When set, a write waits for it after its rename: still running when a clear lands. */
  hold: null as Promise<void> | null,
}));
vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk);
  // A rename keeps the file's backup attribute on iOS (design 13 section 4.3 step 4): the stand-in moves it with the file.
  const move = fs.File.prototype.move;
  fs.File.prototype.move = async function (this: { uri: string }, to: { uri: string }, o?: { overwrite?: boolean }) {
    await move.call(this, to, o);
    if (h.hold) await h.hold; // after the rename: the file is in place, the store has not yet looked back
    if (h.excluded.delete(this.uri)) h.excluded.add(to.uri);
  };
  const write = fs.File.prototype.write;
  fs.File.prototype.write = function (this: { uri: string }, c: string | Uint8Array) {
    h.written += typeof c === 'string' ? c.length : c.length;
    return write.call(this, c);
  };
  return fs;
});
vi.mock('../modules/scribe-files', () => ({
  get ScribeFiles() {
    if (h.mode === 'absent') return null;
    return {
      setExcludedFromBackup: (uri: string, on: boolean) => {
        if (h.mode === 'stick') on ? h.excluded.add(uri) : h.excluded.delete(uri);
      },
      isExcludedFromBackup: (uri: string) => h.excluded.has(uri),
    };
  },
}));

const { createDaysStore, endDaysSession } = await import('../src/lib/days');
const { expoDaysPort, DAYS_FILE, readDays, writeDays, removeDays } = await import('../src/lib/days/store-file');
const { parseDays, emptyDays } = await import('../src/lib/days/store.logic');

const A = '1a2b3c4d5e6f7a8b';
const B = '9f8e7d6c5b4a3921';
const dir = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/days`;
const names = () => [...h.disk.files.keys()].filter((u) => u.startsWith(dir() + '/')).map((u) => u.slice(dir().length + 1));
const fresh = () => createDaysStore(() => expoDaysPort());

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-DAYS00000001'));
  h.excluded = new Set();
  h.mode = 'stick';
  h.written = 0;
  h.hold = null;
});

describe('[NS-47-R6] the store is out of the backup and fails closed', () => {
  it('a tick lands in Application Support, excluded and read back, and only a slug and the owner are in it', async () => {
    const s = fresh();
    s.setOwner(A);
    expect(await s.tickDay('seasonal.synthetic-day')).toEqual({ ok: true });
    expect(names()).toEqual([DAYS_FILE]);
    expect(h.excluded.has(`${dir()}/${DAYS_FILE}`)).toBe(true);
    expect(JSON.parse(readFileSync0())).toEqual({ v: 1, owner: A, ticked: { 'seasonal.synthetic-day': {} } });
    expect([...h.disk.files.keys()].some((u) => /\/Library\/Caches\/|\/Documents\//.test(u))).toBe(false);
  });

  it('an exclusion that reads false writes 0 bytes and ticks nothing (the module absent is the same)', async () => {
    for (const mode of ['ignore', 'absent'] as const) {
      h.mode = mode;
      const s = fresh();
      expect(await s.tickDay('seasonal.synthetic-day')).toEqual({ ok: false, code: 'days_store_unavailable' });
      expect(h.written).toBe(0);
      expect(names()).toEqual([]);
    }
  });

  it('a file that lost the exclusion (a restore, a copy) is deleted on open and never used', async () => {
    const s = fresh();
    s.setOwner(A);
    await s.tickDay('seasonal.synthetic-day');
    h.excluded.clear();
    expect(s.load()).toEqual({ state: 'unavailable' });
    expect(names()).toEqual([]);
  });

  it('a temp file a kill left is swept, and a kill before the rename leaves the old file whole', async () => {
    const s = fresh();
    s.setOwner(A);
    await s.tickDay('seasonal.synthetic-day');
    const port = expoDaysPort()!;
    port.createEmpty('days.v1.json.tmp');
    port.write('days.v1.json.tmp', '{"v":1,"half');
    const s2 = fresh();
    s2.setOwner(A);
    expect(s2.load().state).toBe('ok');
    await s2.tickDay('family.synthetic-two');
    expect(names()).toEqual([DAYS_FILE]);
  });
});

describe('[NS-47-R28] the store file is protected, versioned and fails closed', () => {
  it('a corrupt file reads as nothing, does not crash and is not deleted or overwritten', async () => {
    const port = expoDaysPort()!;
    port.createEmpty(DAYS_FILE);
    port.setExcluded(DAYS_FILE);
    port.write(DAYS_FILE, '{not json');
    const s = fresh();
    s.setOwner(A);
    expect(s.load()).toEqual({ state: 'unreadable' });
    expect(await s.tickDay('seasonal.synthetic-day')).toEqual({ ok: false, code: 'days_store_unavailable' });
    expect(port.read(DAYS_FILE)).toBe('{not json');
  });

  it('a higher version is read for known keys and never rewritten', async () => {
    const port = expoDaysPort()!;
    const text = JSON.stringify({ v: 9, owner: A, ticked: { 'seasonal.synthetic-day': { future: 1 } }, extra: true });
    port.createEmpty(DAYS_FILE);
    port.setExcluded(DAYS_FILE);
    port.write(DAYS_FILE, text);
    const s = fresh();
    s.setOwner(A);
    const r = s.load();
    expect(r.state).toBe('newer');
    expect(await s.clearAllDays()).toEqual({ ok: false, code: 'days_store_unavailable' });
    expect(port.read(DAYS_FILE)).toBe(text);
  });

  it('parse refuses free text as a day id and a bad owner', () => {
    expect(parseDays(JSON.stringify({ v: 1, owner: A, ticked: { 'Asha birthday!': {} } })).kind).toBe('corrupt');
    expect(parseDays(JSON.stringify({ v: 1, owner: 'asha@example.com', ticked: {} })).kind).toBe('corrupt');
    expect(parseDays(JSON.stringify(emptyDays('local'))).kind).toBe('ok');
  });
});

describe('[NS-47-R15] sign-out clears and B sees nothing', () => {
  it('A signs out: the file is gone before any await, B reads nothing, and a write queued before is dropped', async () => {
    const s = fresh();
    s.setOwner(A);
    await s.tickDay('seasonal.synthetic-day');
    const late = s.tickDay('family.synthetic-two'); // queued, not yet run
    const heard: number[] = [];
    s.subscribeDays(() => heard.push(1));
    expect(s.clearNow()).toBe(true); // synchronous: nothing awaited yet
    expect(names()).toEqual([]);
    expect(heard).toEqual([1]);
    expect(await late).toEqual({ ok: false, code: 'days_store_unavailable' });
    s.setOwner(B);
    expect(s.load()).toEqual({ state: 'empty' });
    expect(names()).toEqual([]);
  });

  it('a write that was running when the clear landed does not bring the file back', async () => {
    const s = fresh();
    s.setOwner(A);
    let release = () => {};
    h.hold = new Promise<void>((r) => (release = r));
    const running = s.tickDay('seasonal.synthetic-day');
    await new Promise((r) => setTimeout(r, 5)); // the file is renamed into place, the store waits before looking back
    expect(h.written).toBeGreaterThan(0);
    s.clearNow();
    release();
    expect(await running).toEqual({ ok: false, code: 'days_store_unavailable' });
    expect(names()).toEqual([]);
  });

  it('a file of A read as B is empty (owner check), and B writing starts from empty', async () => {
    const s = fresh();
    s.setOwner(A);
    await s.tickDay('seasonal.synthetic-day');
    s.setOwner(B);
    expect(s.load()).toEqual({ state: 'empty' });
    await s.tickDay('family.synthetic-two');
    expect(Object.keys((readDays(expoDaysPort()!, B) as { file: { ticked: object } }).file.ticked)).toEqual(['family.synthetic-two']);
  });

  it('settleReminderSession calls endDaysSession first, synchronously, before the first await', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'reminders', 'session.ts'), 'utf8');
    const body = src.slice(src.indexOf('export async function settleReminderSession'), src.indexOf('export async function endReminderSession'));
    expect(body.indexOf('endDaysSession()')).toBeGreaterThan(-1);
    expect(body.indexOf('endDaysSession()')).toBeLessThan(body.indexOf('getSetting('));
    expect(body.indexOf('endDaysSession()')).toBeLessThan(body.indexOf('await ending'));
    expect(body.indexOf('endDaysSession()')).toBeLessThan(body.indexOf('endReminderSession()'));
  });

  it('endDaysSession never throws, even when a file will not go', async () => {
    await fresh().tickDay('seasonal.synthetic-day');
    expect(() => endDaysSession()).not.toThrow();
  });
});

describe('[NS-47-R16] erase scan finds nothing', () => {
  /** The Erase scan's days row: every file under the days folder, by name. */
  const scan = () => names();

  it('positive control: the scan finds a synthetic file, then Erase removes the file and any temp', async () => {
    const port = expoDaysPort()!;
    for (const n of [DAYS_FILE, 'days.v1.json.tmp']) {
      port.createEmpty(n);
      port.write(n, '{"v":1,"owner":"local","ticked":{}}');
    }
    expect(scan()).toEqual([DAYS_FILE, 'days.v1.json.tmp']); // the scan can see them
    expect(removeDays(port)).toBe(true);
    expect(scan()).toEqual([]);
  });

  it('removeDays reports a file that will not go, so Erase keeps its mark and resumes', () => {
    const port = expoDaysPort()!;
    port.createEmpty(DAYS_FILE);
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
    expect(removeDays(port)).toBe(false);
  });

  it('eraseDeviceFiles clears the days store before anything else', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'erase-everything.ts'), 'utf8');
    const body = src.slice(src.indexOf('export function eraseDeviceFiles'), src.indexOf('const SIGN_IN_LEFTOVERS'));
    expect(body.indexOf('eraseDaysFile()')).toBeGreaterThan(-1);
    expect(body.indexOf('eraseDaysFile()')).toBeLessThan(body.indexOf('listRecordingFiles()'));
  });
});

describe('[NS-47-R11] one reader', () => {
  it('only lib/days reads the file: no other source file imports the store file or names its keys', () => {
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.(ts|tsx)$/.test(n) ? [join(d, n)] : []));
    const src = join(__dirname, '..', 'src');
    const offenders = walk(src)
      .filter((f) => !f.includes('/lib/days/'))
      .filter((f) => /days\/store-file|days\/store\.logic|days\.v1\.json|culture\.asked|asks\.daysAsked/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(src.length));
    expect(offenders).toEqual([]);
  });
});

function readFileSync0(): string {
  return new TextDecoder().decode(h.disk.files.get(`${dir()}/${DAYS_FILE}`)!.data);
}
void writeDays;
