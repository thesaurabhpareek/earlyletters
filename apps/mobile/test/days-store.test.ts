/// <reference types="node" />
/**
 * The days store foundation (NS-47-R6, R11, R15, R16, R28; ADR 0032), on a disk laid out as the phone has it with a
 * ScribeFiles stand-in. Fictional data only; day ids are synthetic slugs. Mutants run by hand (see the PR): skip the
 * read-back; skip the owner check; skip the generation check; drop eraseDaysFile or endDaysSession; add a second reader.
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

const { createDaysStore, endDaysSession } = await import('../src/lib/days');
const { expoDaysPort, DAYS_FILE, DAYS_TMP, removeDays } = await import('../src/lib/days/store-file');
const { parseDays } = await import('../src/lib/days/store.logic');

const A = '1a2b3c4d5e6f7a8b';
const B = '9f8e7d6c5b4a3921';
const DAY = 'seasonal.synthetic-day';
const UNAVAILABLE = { ok: false, code: 'days_store_unavailable' };
const dir = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/days`;
const names = () => [...h.disk.files.keys()].filter((u) => u.startsWith(dir() + '/')).map((u) => u.slice(dir().length + 1));
const fresh = (owner = A) => {
  const s = createDaysStore(() => expoDaysPort());
  s.setOwner(owner);
  return s;
};
const seed = (text: string) => {
  const port = expoDaysPort()!;
  port.createEmpty(DAYS_FILE);
  port.setExcluded(DAYS_FILE);
  port.write(DAYS_FILE, text);
  return port;
};
const src = (rel: string) => readFileSync(join(__dirname, '..', 'src', rel), 'utf8');

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-DAYS00000001'));
  Object.assign(h, { excluded: new Set(), mode: 'stick', written: 0, hold: null });
});

describe('[NS-47-R6] the store is out of the backup and fails closed', () => {
  it('a tick lands in Application Support, excluded and read back; the file holds a slug and the owner only', async () => {
    expect(await fresh().tickDay(DAY)).toEqual({ ok: true });
    expect(names()).toEqual([DAYS_FILE]);
    expect(h.excluded.has(`${dir()}/${DAYS_FILE}`)).toBe(true);
    expect(JSON.parse(new TextDecoder().decode(h.disk.files.get(`${dir()}/${DAYS_FILE}`)!.data))).toEqual({ v: 1, owner: A, ticked: { [DAY]: {} } });
  });

  it('an exclusion that reads false (or a module that is absent) writes 0 bytes and ticks nothing', async () => {
    for (const mode of ['ignore', 'absent'] as const) {
      h.mode = mode;
      expect(await fresh().tickDay(DAY)).toEqual(UNAVAILABLE);
      expect(h.written).toBe(0);
      expect(names()).toEqual([]);
    }
  });

  it('a file that lost the exclusion is deleted on open and never used; a leftover temp is swept', async () => {
    const s = fresh();
    await s.tickDay(DAY);
    h.excluded.clear();
    expect(s.load()).toEqual({ state: 'unavailable' });
    expect(names()).toEqual([]);
    const port = expoDaysPort()!;
    port.createEmpty(DAYS_TMP);
    port.write(DAYS_TMP, '{"v":1,"half');
    await fresh().tickDay(DAY); // the first use in a launch sweeps
    expect(names()).toEqual([DAYS_FILE]);
  });
});

describe('[NS-47-R28] the store file is protected, versioned and fails closed', () => {
  it('a corrupt file reads as nothing, does not crash, and is neither deleted nor overwritten', async () => {
    const port = seed('{not json');
    const s = fresh();
    expect(s.load()).toEqual({ state: 'unreadable' });
    expect(await s.tickDay(DAY)).toEqual(UNAVAILABLE);
    expect(port.read(DAYS_FILE)).toBe('{not json');
  });

  it('a higher version is read for known keys and never rewritten', async () => {
    const text = JSON.stringify({ v: 9, owner: A, ticked: { [DAY]: { future: 1 } }, extra: true });
    const port = seed(text);
    const s = fresh();
    expect(s.load().state).toBe('newer');
    expect(await s.clearAllDays()).toEqual(UNAVAILABLE);
    expect(port.read(DAYS_FILE)).toBe(text);
  });

  it('free text as a day id, or an email as an owner, is corrupt', () => {
    expect(parseDays(JSON.stringify({ v: 1, owner: A, ticked: { 'Asha birthday!': {} } })).kind).toBe('corrupt');
    expect(parseDays(JSON.stringify({ v: 1, owner: 'asha@example.com', ticked: {} })).kind).toBe('corrupt');
  });
});

describe('[NS-47-R15] sign-out clears and B sees nothing', () => {
  it('A signs out: the file is gone with nothing awaited, a queued write is dropped, B reads nothing', async () => {
    const s = fresh();
    await s.tickDay(DAY);
    const late = s.tickDay('family.synthetic-two'); // queued, not yet run
    expect(s.clearNow()).toBe(true);
    expect(names()).toEqual([]);
    expect(await late).toEqual(UNAVAILABLE);
    s.setOwner(B);
    expect(s.load()).toEqual({ state: 'empty' });
  });

  it('a write already past its rename when the clear lands does not bring the file back', async () => {
    const s = fresh();
    let release = () => {};
    h.hold = new Promise<void>((r) => (release = r));
    const running = s.tickDay(DAY);
    await new Promise((r) => setTimeout(r, 5));
    s.clearNow();
    release();
    expect(await running).toEqual(UNAVAILABLE);
    expect(names()).toEqual([]);
  });

  it('a file of A read as B is empty, and B writing starts from empty', async () => {
    await fresh().tickDay(DAY);
    const b = fresh(B);
    expect(b.load()).toEqual({ state: 'empty' });
    await b.tickDay('family.synthetic-two');
    expect(JSON.parse(expoDaysPort()!.read(DAYS_FILE)).ticked).toEqual({ 'family.synthetic-two': {} });
  });

  it('settleReminderSession runs endDaysSession first: before any read, await or reminder step; and it never throws', () => {
    const s = src('lib/reminders/session.ts');
    const body = s.slice(s.indexOf('export async function settleReminderSession'), s.indexOf('export async function endReminderSession'));
    const at = body.indexOf('endDaysSession()');
    expect(at).toBeGreaterThan(-1);
    for (const later of ['getSetting(', 'await ending', 'endReminderSession()']) expect(at).toBeLessThan(body.indexOf(later));
    expect(() => endDaysSession()).not.toThrow();
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

  it('eraseDeviceFiles clears the days store before any recording step', () => {
    const body = src('lib/erase-everything.ts').split('export function eraseDeviceFiles')[1];
    expect(body.indexOf('eraseDaysFile()')).toBeGreaterThan(-1);
    expect(body.indexOf('eraseDaysFile()')).toBeLessThan(body.indexOf('listRecordingFiles()'));
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
