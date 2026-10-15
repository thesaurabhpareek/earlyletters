/// <reference types="node" />
/**
 * Recently deleted shelf and durable erase (D-085, debate Q-014): the store
 * facade over node:sqlite with a clock the test moves. Fictional Asha family
 * only. The audio eraser is a fake that records calls, so the order (file
 * first, then row) and the kill-in-between case are checked without a phone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

import type { AudioEraser } from '../src/lib/store';
const store = await import('../src/lib/store');
const { setServerFeaturesForTests } = await import('../src/lib/capabilities');
const { planLaunchSweep } = await import('../src/lib/capture/sweep.logic');

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-10-03T09:00:00.000Z');
let clock = T0;
let close: () => void = () => {};
let seq = 0;
let asha = '';
const id1 = '0199a5b0-0000-7000-8000-000000000001';
const id2 = '0199a5b0-0000-7000-8000-000000000002';

beforeEach(() => {
  clock = T0;
  seq = 0;
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  store.openStore({
    open: () => ({ db: h.db, close: () => {} }),
    now: () => new Date(clock).toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(900 + ++seq).padStart(12, '0')}`,
  });
  asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  setServerFeaturesForTests(null);
  store.closeStore();
  close();
});

/** A fake eraser: remembers which files are "on disk" and in what order things happened. */
function disk(files: string[] = []) {
  const present = new Set(files);
  const log: string[] = [];
  const eraser: AudioEraser = (uri) => {
    if (uri) {
      log.push(`file:${uri}`);
      present.delete(uri);
    }
  };
  return { present, log, eraser };
}

const save = (id: string, over: Parameters<typeof letter>[0] = {}) => store.saveEntry(letter({ id, childId: asha, audioUri: `file:///Documents/${id}.m4a`, ...over }));

describe('the shelf', () => {
  it('[D-085] a deleted letter is on the shelf after a relaunch, newest first, and Undo brings it back', () => {
    save(id1);
    save(id2, { finalText: 'Second letter.' });
    store.deleteEntry(id1);
    clock += 1000;
    store.deleteEntry(id2);
    expect(store.listEntriesForChild(asha)).toEqual([]);
    const shelf = store.listDeleted();
    expect(shelf.map((e) => e.id)).toEqual([id2, id1]);
    expect(shelf[0].deletedAt).toBe(new Date(T0 + 1000).toISOString());
    expect(shelf[1].finalText).toBe('Asha, you laughed at the rain today.');
    store.undeleteEntry(id1);
    expect(store.getEntry(id1)?.finalText).toBe('Asha, you laughed at the rain today.');
    expect(store.listDeleted().map((e) => e.id)).toEqual([id2]);
  });

  it('a live letter is never on the shelf and cannot be erased', () => {
    save(id1);
    expect(store.listDeleted()).toEqual([]);
    const d = disk([`file:///Documents/${id1}.m4a`]);
    expect(store.eraseEntry(id1, d.eraser)).toBe(false);
    expect(d.log).toEqual([]); // not even the file is touched
    expect(store.getEntry(id1)).not.toBeNull();
  });

  it('erase now removes the file first, then the row, and the shelf is empty', () => {
    save(id1);
    store.deleteEntry(id1);
    const d = disk([`file:///Documents/${id1}.m4a`]);
    const seen: string[] = [];
    const eraser: AudioEraser = (uri, id) => {
      seen.push(`file-before-row:${store.listDeleted().length === 1}`);
      d.eraser(uri, id);
    };
    expect(store.eraseEntry(id1, eraser)).toBe(true);
    expect(seen).toEqual(['file-before-row:true']);
    expect(d.present.size).toBe(0);
    expect(store.listDeleted()).toEqual([]);
    expect(store.eraseEntry(id1, d.eraser)).toBe(false); // idempotent
  });

  it('a typed letter (no recording) erases too', () => {
    save(id1, { captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null });
    store.deleteEntry(id1);
    expect(store.eraseEntry(id1, disk().eraser)).toBe(true);
    expect(store.listDeleted()).toEqual([]);
  });

  it('[D-085] if the file cannot be removed the row stays, so nothing is half erased', () => {
    save(id1);
    store.deleteEntry(id1);
    expect(
      store.eraseEntry(id1, () => {
        throw new Error('disk_busy');
      }),
    ).toBe(false);
    expect(store.listDeleted().map((e) => e.id)).toEqual([id1]);
  });

  it('[D-085] a kill between the file and the row leaves a state the next launch completes', () => {
    save(id1);
    store.deleteEntry(id1);
    clock += 30 * DAY;
    // The file went, then the app died before the row was removed.
    const d = disk([`file:///Documents/${id1}.m4a`]);
    d.eraser(`file:///Documents/${id1}.m4a`, id1);
    expect(store.listDeleted().map((e) => e.id)).toEqual([id1]);
    // The sweep must not bring the voice back or report the missing file for a deleted letter.
    const rows = store.audioRows();
    expect(rows.entries).toEqual([{ id: id1, audioUri: `file:///Documents/${id1}.m4a`, deleted: true }]);
    expect(planLaunchSweep({ files: [], ...rows, reported: [], activeChildId: asha, skipDraftIds: [] })).toEqual([]);
    // The next launch purge finishes it, and a file that is already gone is not an error.
    expect(store.purgeExpired(clock, d.eraser)).toBe(1);
    expect(store.listDeleted()).toEqual([]);
  });
});

describe('the 30 day purge', () => {
  it('[D-085] keeps a letter at day 29 and erases its row and file at day 30', () => {
    save(id1);
    store.deleteEntry(id1);
    const d = disk([`file:///Documents/${id1}.m4a`]);
    expect(store.purgeExpired(T0 + 29 * DAY + 23 * 3600_000, d.eraser)).toBe(0);
    expect(store.listDeleted()).toHaveLength(1);
    expect(d.present.size).toBe(1);
    expect(store.purgeExpired(T0 + 30 * DAY, d.eraser)).toBe(1);
    expect(store.listDeleted()).toEqual([]);
    expect(d.present.size).toBe(0);
  });

  it('erases only the expired letters and leaves live ones alone', () => {
    save(id1);
    save(id2);
    store.deleteEntry(id1);
    clock += 10 * DAY;
    store.deleteEntry(id2);
    expect(store.purgeExpired(T0 + 31 * DAY, disk().eraser)).toBe(1);
    expect(store.listDeleted().map((e) => e.id)).toEqual([id2]);
    const live = '0199a5b0-0000-7000-8000-000000000003';
    save(live);
    expect(store.purgeExpired(T0 + 90 * DAY, disk().eraser)).toBe(1); // id2, now old enough
    expect(store.getEntry(live)).not.toBeNull();
  });

  it('[D-085] a phone clock moved earlier than the last launch purges nothing', () => {
    save(id1);
    store.deleteEntry(id1);
    store.recordLaunch(T0 + 40 * DAY);
    expect(store.purgeExpired(T0 + 35 * DAY, disk().eraser)).toBe(0); // clock went back 5 days
    expect(store.listDeleted()).toHaveLength(1);
    expect(store.purgeExpired(T0 + 41 * DAY, disk().eraser)).toBe(1);
  });

  it('the recorded launch never moves backwards', () => {
    store.recordLaunch(T0 + 10 * DAY);
    store.recordLaunch(T0 + 5 * DAY);
    expect(store.getSetting(store.LAST_LAUNCH_SETTING)).toBe(new Date(T0 + 10 * DAY).toISOString());
  });

  it('[D-085] with sync on the server owns the clock: nothing is purged or erased here', () => {
    save(id1);
    store.deleteEntry(id1);
    setServerFeaturesForTests(true);
    const d = disk([`file:///Documents/${id1}.m4a`]);
    expect(store.purgeExpired(T0 + 60 * DAY, d.eraser)).toBe(0);
    expect(store.eraseEntry(id1, d.eraser)).toBe(false);
    expect(d.present.size).toBe(1);
    expect(store.listDeleted()).toHaveLength(1);
  });

  it('a purged letter never comes back: no row, no file, nothing for the sweep to re-attach', () => {
    save(id1);
    store.deleteEntry(id1);
    const d = disk([`file:///Documents/${id1}.m4a`]);
    store.purgeExpired(T0 + 30 * DAY, d.eraser);
    const rows = store.audioRows();
    expect(rows.entries).toEqual([]);
    const files = [...d.present].map((uri) => ({ uri, bytes: 100 }));
    expect(planLaunchSweep({ files, ...rows, reported: [], activeChildId: asha, skipDraftIds: [] })).toEqual([]);
  });
});
