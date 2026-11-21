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
}));
vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk);
  const { move, write } = fs.File.prototype;
  fs.File.prototype.move = async function (this: { uri: string }, to: { uri: string }, o?: { overwrite?: boolean }) {
    await move.call(this, to, o);
    if (h.excluded.delete(this.uri)) h.excluded.add(to.uri); // a rename keeps the backup attribute on iOS
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

const { endDaysSession, loadDays } = await import('../src/lib/days');
const { expoDaysPort, readDays, writeDays, DAYS_FILE, DAYS_TMP, removeDays } = await import('../src/lib/days/store-file');
const { parseDays } = await import('../src/lib/days/store.logic');

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
const src = (rel: string) => readFileSync(join(__dirname, '..', 'src', rel), 'utf8');

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-DAYS00000001'));
  Object.assign(h, { excluded: new Set(), mode: 'stick', written: 0 });
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
    seed(JSON.stringify({ v: 9, owner: A, ticked: { [DAY]: { future: 1 } }, extra: true }));
    expect(readDays(expoDaysPort()!, A)).toMatchObject({ state: 'newer', file: { v: 9, ticked: { [DAY]: { future: 1 } } } });
  });

  it('free text as a day id, or an email as an owner, is corrupt', () => {
    expect(parseDays(JSON.stringify({ v: 1, owner: A, ticked: { 'Asha birthday!': {} } })).kind).toBe('corrupt');
    expect(parseDays(JSON.stringify({ v: 1, owner: 'asha@example.com', ticked: {} })).kind).toBe('corrupt');
  });
});

describe('[NS-47-R15] sign-out clears and B sees nothing', () => {
  it('A signs out: the file is gone with nothing awaited, B reads nothing, and a file of A read as B is empty', async () => {
    await writeDays(expoDaysPort()!, file());
    expect(readDays(expoDaysPort()!, B)).toEqual({ state: 'empty' }); // the owner check, before any clear
    expect(endDaysSession()).toBe(true);
    expect(names()).toEqual([]);
    expect(loadDays(B)).toEqual({ state: 'empty' });
  });

  it('settleReminderSession runs endDaysSession first: before any read, await or reminder step; and it never throws', () => {
    const s = src('lib/reminders/session.ts');
    const body = s.slice(s.indexOf('export async function settleReminderSession'), s.indexOf('export async function endReminderSession'));
    const at = body.indexOf('endDaysSession()');
    expect(at).toBeGreaterThan(-1);
    for (const later of ['getSetting(', 'await ending', 'endReminderSession()']) expect(at).toBeLessThan(body.indexOf(later));
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
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
