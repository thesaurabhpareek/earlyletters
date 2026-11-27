/// <reference types="node" />
/**
 * Delete a book and Erase everything on this phone (BL-387; RT-BK-12, SR-C-07; DATA-REQ-014, DATA-REQ-024,
 * F17-REQ-080; F17 6.2 D and 6.2 F; D-083, D-103), against a disk laid out as the phone has it
 * (helpers/expo-fs-standin.ts) and a real SQLite store. The real erase (capture/erase.ts), launch sweep
 * (capture/sweep.ts) and letter ledger (billing/letter-ledger.ts) run; only the native modules around them are
 * stand-ins. vi.resetModules() is the process dying (a kill), and the same database is opened again.
 *
 * What is proven here: rows and files are gone, the launch sweep brings nothing back, a kill part way is finished
 * by the next launch, the free-letter count starts again after Erase everything, and nothing is sent anywhere.
 * Fictional Asha family only.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { accountDeletionCopy, en } from '@scribe/content';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { erasePlusLineShows, eraseNoteKeys, type ErasePlan } from '../src/components/settings/wipe.logic';
import { OPEN_PRAGMAS } from '../src/lib/db/expo-adapter';
import type { SqlDb } from '../src/lib/db/sql';
import type { PushOp, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { createDisk, iosContainer, layOutApp, namesIn, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { photosDirectory } from '../src/lib/photos/files';
import { letItGo } from '../src/lib/capture/let-it-go.logic';
import { FIRST_RUN_DRAFT_SETTING, parseDraft, serializeDraft } from '../src/lib/first-run/draft.logic';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  calls: [] as string[],
  /** The Keychain, as a map that outlives a kill (it survives a reinstall on a real phone). */
  keychain: new Map<string, string>(),
  /** A Keychain key whose removal fails (B5-6), or null. */
  failRemoveKey: null as string | null,
  /** What `appLock.enabled` read when the app lock was asked to read its settings again (null: erased). */
  lockReloads: [] as (string | null)[],
  /** A setting as the store's database holds it right now (set in beforeEach, once the database exists). */
  settingNow: (_key: string): string | null => null,
  /** A step of Erase everything after which the process dies (the step's own work is done first), or null. */
  killAt: null as string | null,
  /** CDO-23: when true the native backup-exclusion stand-in sticks, so the moments file can be written. */
  exclusionSticks: false,
  excluded: new Set<string>(),
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
// lib/backup/files.ts (B5): the database folder and the native exclusion call, over this disk.
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents}SQLite`;
  },
}));
vi.mock('../modules/scribe-files', () => ({
  // also: erase-everything reaches the days store (NS-47-R16) and the moments file (CDO-23); null unless a test turns the stand-in on
  get ScribeFiles() {
    return h.exclusionSticks ? { setExcludedFromBackup: (u: string) => void h.excluded.add(u), isExcludedFromBackup: (u: string) => h.excluded.has(u) || h.excluded.has(`${u}.tmp`) } : null; // a rename keeps the attribute on iOS: the final name reads as its temp did
  },
}));
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_alg: string, data: Uint8Array) => new Uint8Array(hash('sha256').update(data).digest()).buffer,
  };
});
vi.mock('expo-audio', () => ({
  AudioQuality: { HIGH: 96 },
  IOSOutputFormat: { MPEG4AAC: 'aac ' },
  setAudioModeAsync: async () => {},
  createAudioPlayer: () => ({ isLoaded: true, duration: 1.5, remove() {} }),
}));
// Listening copies live in Application Support through a native module; their removal is recorded by id.
vi.mock('../src/lib/audio-enhance', () => ({
  removeListeningCopy: (id: string) => h.calls.push(`listening:${id}`),
  sweepListeningCopies: () => (h.calls.push('listening:sweep'), 0),
}));
vi.mock('../src/lib/analytics', () => ({ stopAnalyticsForErase: async () => void h.calls.push('analytics:stop') }));
vi.mock('../src/lib/family/pending-invite', () => ({
  clearPendingInvite: async () => {
    h.calls.push('invite:clear');
    if (h.killAt === 'invite') throw new Error('killed');
  },
}));
// The app's Keychain wrapper, over the same map as the ledger's Keychain (the auth modules only lend their key names).
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => h.keychain.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.keychain.set(k, v),
    removeItem: async (k: string) => {
      if (h.failRemoveKey === k) throw new Error('keychain locked');
      h.keychain.delete(k);
    },
  },
}));
vi.mock('../src/lib/auth/apple', () => ({ APPLE_USER_KEY: 'scribe.auth.appleUser', PENDING_NAME_KEY: 'scribe.auth.pendingName' }));
vi.mock('../src/lib/auth/pending', () => ({ PENDING_REQUEST_KEY: 'scribe.auth.pendingEmailRequest' }));
// The app lock's run time (expo-local-authentication, AppState): only its reload is observed, with the setting it would read.
vi.mock('../src/lib/app-lock/controller', () => ({
  reloadAppLock: () => {
    h.lockReloads.push(h.settingNow('appLock.enabled'));
    return true;
  },
}));
vi.mock('../src/lib/reminders/scheduler', () => ({
  forgetReminders: async () => {
    h.calls.push('reminders:forget');
    if (h.killAt === 'reminders') throw new Error('killed');
  },
}));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

// Each test is several launches (a fresh module graph each); a loaded CI runner needs more than the default 5 s.
vi.setConfig({ testTimeout: 30_000 });

const T0 = Date.parse('2026-10-03T09:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const PHONE = iosContainer('6F0C3A2E-ASHA-4C1B-9D55-ERASE0000001');

let seq = 0;
let db: SqlDb;
let closeDb: () => void = () => {};
let fetches = 0;

async function launch() {
  vi.resetModules();
  const store = await import('../src/lib/store');
  const opened = store.openStore({
    open: () => ({ db, close: () => {} }),
    now: () => new Date().toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
  });
  expect(opened.ok).toBe(true);
  const ledger = await import('../src/lib/billing/letter-ledger');
  ledger.configureLedgerStorage({
    getItem: async (k) => h.keychain.get(k) ?? null,
    setItem: async (k, v) => void h.keychain.set(k, v),
    removeItem: async (k) => void h.keychain.delete(k),
  });
  const erase = await import('../src/lib/capture/erase');
  const sweep = await import('../src/lib/capture/sweep');
  const all = await import('../src/lib/erase-everything');
  const moments = await import('../src/lib/moments');
  return { store, ledger, erase, sweep, all, moments };
}
type App = Awaited<ReturnType<typeof launch>>;

const rows = (table: string) => db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`)!.n;
const take = (name: string) => put(h.disk, `${recorderDir(h.disk)}/recording-${name}.m4a`, 24_000);
const has = (uri: string) => h.disk.files.has(uri);
/** Whether a letter's row is still in the database, deleted or not (store.getEntry hides deleted letters). */
const rowKept = (id: string) => db.get('SELECT id FROM entries WHERE id = ?', id) !== null;

/** Asha's book: two kept letters with recordings (one later deleted), a typed letter, and a draft waiting. Avi's book: one letter. */
function family(app: App) {
  const s = app.store;
  const asha = s.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  const avi = s.addChild({ name: 'Avi', birthday: '2024-06-10', dueDate: null, signsAs: 'Papa' }).id;
  const f = {
    asha,
    avi,
    a1: take('0A1B2C3D-0000-4000-8000-00000000A5A1'),
    a2: take('0A1B2C3D-0000-4000-8000-00000000A5A2'),
    draft: take('0A1B2C3D-0000-4000-8000-00000000A5A3'),
    v1: take('0A1B2C3D-0000-4000-8000-00000000B0B1'),
    ids: { a1: '0199a5b0-0000-7000-8000-0000000a0001', a2: '0199a5b0-0000-7000-8000-0000000a0002', typed: '0199a5b0-0000-7000-8000-0000000a0003', v1: '0199a5b0-0000-7000-8000-0000000b0001' },
    draftId: '',
  };
  s.saveEntry(letter({ id: f.ids.a1, childId: asha, audioUri: f.a1 }));
  s.saveEntry(letter({ id: f.ids.a2, childId: asha, audioUri: f.a2, finalText: 'Asha, the first snow.' }));
  s.saveEntry(letter({ id: f.ids.typed, childId: asha, captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, finalText: 'Asha, a quiet morning.' }));
  s.saveEntry(letter({ id: f.ids.v1, childId: avi, authorSignsAs: 'Papa', audioUri: f.v1, finalText: 'Avi, you built a tower.' }));
  s.deleteEntry(f.ids.a2); // waiting in Recently deleted
  f.draftId = s.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: f.draft, audioDurationMs: 4000, state: 'ready' }).id;
  s.setActiveChildId(asha);
  s.setSetting('child.bornCardHidden.' + asha, '2026-03-01');
  return f;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  seq = 0;
  h.calls = [];
  h.lockReloads = [];
  h.keychain = new Map();
  h.failRemoveKey = null;
  h.killAt = null;
  h.exclusionSticks = false;
  h.excluded = new Set();
  h.disk = createDisk(PHONE);
  layOutApp(h.disk);
  const n = nodeDb();
  db = n.db;
  closeDb = n.close;
  h.settingNow = (key) => db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
  fetches = 0;
  vi.stubGlobal('fetch', () => {
    fetches += 1;
    throw new Error('no network in an erase');
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  closeDb();
});

describe('[DATA-REQ-014][F17-REQ-080] Delete this book, on a phone that never signed in', () => {
  it('the book leaves every list and Export at once, waits in Recently deleted, and Restore brings it all back', async () => {
    const app = await launch();
    const f = family(app);
    const s = app.store;
    expect(s.localDeletionAllowed()).toBe(true);
    expect(s.deleteBook(f.asha)).toBe(true);
    expect(s.listChildren().map((c) => c.name)).toEqual(['Avi']);
    expect(s.listHiddenChildren()).toEqual([]); // Export reads these two lists: the book is not in it
    expect(s.getActiveChildId()).toBe(f.avi);
    expect(s.listDeletedBooks()).toEqual([{ id: f.asha, name: 'Asha', deletedAt: new Date(T0).toISOString() }]);
    // Its letters wait inside the book, not one by one on the letter shelf.
    expect(s.listDeleted().map((e) => e.id)).toEqual([]);
    expect(s.deleteBook(f.asha)).toBe(false);
    // Nothing queued, nothing sent.
    expect(rows('sync_outbox')).toBe(0);
    expect(fetches).toBe(0);

    expect(s.restoreBook(f.asha)).toBe(true);
    expect(s.listChildren().map((c) => c.name)).toEqual(['Asha', 'Avi']);
    expect(s.listEntriesForChild(f.asha).map((e) => e.id).sort()).toEqual([f.ids.a1, f.ids.typed].sort());
    expect(s.listDeleted().map((e) => e.id)).toEqual([f.ids.a2]);
    expect(s.listDrafts(f.asha).map((d) => d.id)).toEqual([f.draftId]);
    expect([f.a1, f.a2, f.draft].every(has)).toBe(true);
  });

  it('Erase now removes every recording of the book from disk, then every row; the other book is untouched and the sweep brings nothing back', async () => {
    let app = await launch();
    const f = family(app);
    app.store.deleteBook(f.asha);
    expect(app.erase.eraseDeletedBook(f.asha)).toBe(true);

    expect([f.a1, f.a2, f.draft].some(has)).toBe(false);
    expect(h.calls).toEqual(expect.arrayContaining([`listening:${f.ids.a1}`, `listening:${f.ids.a2}`, `listening:${f.ids.typed}`]));
    for (const t of ['entries', 'drafts']) expect(db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t} WHERE child_id = ?`, f.asha)!.n).toBe(0);
    expect(db.get('SELECT id FROM children WHERE id = ?', f.asha)).toBeNull();
    expect(db.get('SELECT child_id FROM child_member_prefs WHERE child_id = ?', f.asha)).toBeNull();
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key).filter((k) => k.includes(f.asha))).toEqual([]);
    expect(app.store.listDeletedBooks()).toEqual([]);
    // Avi's book, letter and recording are exactly as they were.
    expect(app.store.listEntriesForChild(f.avi).map((e) => e.id)).toEqual([f.ids.v1]);
    expect(has(f.v1)).toBe(true);

    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({});
    expect(rows('drafts')).toBe(0);
    expect(app.store.listOrphanAudio()).toEqual([]);
    expect(fetches).toBe(0);
  });

  it('[F17 6.2 D step 6][QE-05] the launch purge erases a deleted book after 30 days, not before, and only once two launches agree', async () => {
    let app = await launch();
    const f = family(app);
    app.store.deleteBook(f.asha);
    // The first launch has no record of an earlier one: it erases nothing and records itself (QE-05).
    vi.setSystemTime(T0 + 29 * DAY);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks().map((b) => b.id)).toEqual([f.asha]);
    expect(has(f.a1)).toBe(true);

    // Time is counted by the previous launch (day 29), so day 30 still keeps the book; this launch records itself.
    vi.setSystemTime(T0 + 30 * DAY + 1000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks().map((b) => b.id)).toEqual([f.asha]);
    expect(has(f.a1)).toBe(true);

    // The next launch finds the previous one more than 30 days after the delete: now it goes.
    vi.setSystemTime(T0 + 31 * DAY);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks()).toEqual([]);
    expect([f.a1, f.a2, f.draft].some(has)).toBe(false);
    expect(db.get('SELECT id FROM children WHERE id = ?', f.asha)).toBeNull();
    expect(app.store.listChildren().map((c) => c.name)).toEqual(['Avi']);
  });

  it('Erase now that fails: the book leaves Recently deleted at once and the next launch finishes it, as the toast says (Review A on #520)', async () => {
    let app = await launch();
    const f = family(app);
    app.store.deleteBook(f.asha);
    // A recording that will not go: Erase now returns false with the erase already begun.
    expect(app.store.eraseBook(f.asha, () => { throw new Error('file would not go'); })).toBe(false);
    // The shelf re-reads at once (recently-deleted.tsx): the card is gone and Restore is no longer offered.
    expect(app.store.listDeletedBooks()).toEqual([]);
    expect(app.store.restoreBook(f.asha)).toBe(false);
    // So the toast must not say the book is still in Recently deleted; it says the app finishes at the next open.
    const toast = en.settings.delete.bookEraseFailedToast;
    expect(toast).not.toMatch(/Recently deleted/);
    expect(toast).toMatch(/next time the app opens/);
    expect(readFileSync(join(__dirname, '..', 'src/app/settings/recently-deleted.tsx'), 'utf8')).toMatch(
      /eraseDeletedBook\(b\.id\) \? d\.bookErasedToast : d\.bookEraseFailedToast/,
    );
    // And it does: the next launch erases the book.
    app = await launch();
    expect(app.store.listChildren().map((c) => c.name)).toEqual(['Avi']);
    await app.sweep.runLaunchSweep();
    expect(db.get('SELECT id FROM children WHERE id = ?', f.asha)).toBeNull();
  });

  it('a kill part way through the erase: the next launch finishes it, the sweep re-attaches nothing, and Restore is no longer offered', async () => {
    let app = await launch();
    const f = family(app);
    app.store.deleteBook(f.asha);
    // The first recording goes, then the process dies before the second.
    let n = 0;
    expect(
      app.store.eraseBook(f.asha, (uri, id) => {
        if (n++ === 1) throw new Error('killed');
        app.erase.eraseAudioFile(uri, id);
      }),
    ).toBe(false);
    expect(has(f.a1)).toBe(false);
    expect(has(f.a2)).toBe(true);
    expect(app.store.listDeletedBooks()).toEqual([]); // erase begun: no Restore for a half-erased book
    expect(app.store.restoreBook(f.asha)).toBe(false);

    app = await launch();
    expect(app.store.listChildren().map((c) => c.name)).toEqual(['Avi']);
    await app.sweep.runLaunchSweep();
    expect([f.a1, f.a2, f.draft].some(has)).toBe(false);
    expect(db.get('SELECT id FROM children WHERE id = ?', f.asha)).toBeNull();
    expect(rows('drafts')).toBe(0);
    expect(app.store.listOrphanAudio()).toEqual([]);
    // A second launch has nothing left to do.
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({});
  });

  it('[CDO-23] Erase now on a deleted book removes that book\'s moments rows and no other book\'s', async () => {
    h.exclusionSticks = true;
    const app = await launch();
    const f = family(app);
    const m = app.moments.momentsStore;
    expect(await m.setHomePlace(f.asha, 'ext:place-2')).toEqual({ ok: true });
    expect(await m.setHomePlace(f.avi, 'ext:place-3')).toEqual({ ok: true });
    expect(await m.setLabel('2026-10-03', 'Asha at the lake')).toEqual({ ok: true });
    app.store.deleteBook(f.asha);
    expect(app.erase.eraseDeletedBook(f.asha)).toBe(true);
    expect(await m.removeBook('0199a5b0-0000-7000-8000-0000000000ff')).toMatchObject({ ok: false }); // drains the queue
    const read = m.load();
    expect(read.state).toBe('ok');
    const file = (read as { file: { homePlace: object; labels: object } }).file;
    expect(file.homePlace).toEqual({ [f.avi]: 'ext:place-3' });
    expect(file.labels).toEqual({ '2026-10-03': 'Asha at the lake' });
  });

  it('a phone that has signed in cannot delete a book from here (the server holds it too)', async () => {
    const app = await launch();
    const f = family(app);
    app.store.setSetting('sync.ownerId', '0199a5b0-0000-7000-8000-00000000aaaa');
    expect(app.store.localDeletionAllowed()).toBe(false);
    expect(app.store.deleteBook(f.asha)).toBe(false);
    expect(app.store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Avi']);
  });
});

describe('[D-103] deleting a book never lowers the free-letter count (only Erase everything resets it)', () => {
  /**
   * The count starts behind the letters present: these letters were saved without the Keep path, so neither the
   * database mirror nor the Keychain holds them, as after a backup restore before the launch heal. A quiet note is
   * kept too, which counts once notes count (#510) and not before; the tests compare with the count before the
   * delete, so they hold either way.
   */
  async function behind() {
    const app = await launch();
    const f = family(app);
    app.store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-0000000a0004', childId: f.asha, kind: 'note', captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, finalText: 'Asha, a note for later.' }));
    const kept = () => app.ledger.lettersKept(app.store.ledgerDb());
    expect(app.store.getSetting('letters.keptEver')).toBeNull(); // the mirror holds nothing yet
    expect(h.keychain.size).toBe(0);
    const before = await kept();
    expect(before).toBeGreaterThanOrEqual(4); // a1, a2 (deleted still counts), typed, v1
    return { app, f, kept, before };
  }

  it('Delete, Restore, then Delete and Erase now: the count is the same after each', async () => {
    const { app, f, kept, before } = await behind();
    app.store.deleteBook(f.asha);
    expect(await kept()).toBe(before);
    app.store.restoreBook(f.asha);
    expect(await kept()).toBe(before);
    app.store.deleteBook(f.asha);
    expect(app.erase.eraseDeletedBook(f.asha)).toBe(true);
    expect(app.store.listEntriesForChild(f.avi).length).toBe(1); // only Avi's letter is left on the phone
    expect(await kept()).toBe(before);
    expect(app.store.getSetting('letters.keptEver')).not.toBeNull(); // raised before the rows went
  });

  it('the day-30 purge at launch, before the ledger heal has run: the count is the same after a relaunch', async () => {
    let { app, f, before } = await behind();
    app.store.deleteBook(f.asha);
    // Two launches agree the book has waited its 30 days (QE-05): the first only records the time it saw.
    vi.setSystemTime(T0 + 30 * DAY + 1000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks().map((b) => b.id)).toEqual([f.asha]);
    vi.setSystemTime(T0 + 31 * DAY + 1000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks()).toEqual([]);
    expect(await app.ledger.lettersKept(app.store.ledgerDb())).toBe(before);
  });

  it('a kill part way through the book erase, finished by the next launch: the count is the same', async () => {
    let { app, f, before } = await behind();
    app.store.deleteBook(f.asha);
    let n = 0;
    app.store.eraseBook(f.asha, (uri, id) => {
      if (n++ === 1) throw new Error('killed');
      app.erase.eraseAudioFile(uri, id);
    });
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(db.get('SELECT id FROM children WHERE id = ?', f.asha)).toBeNull();
    expect(await app.ledger.lettersKept(app.store.ledgerDb())).toBe(before);
  });

  it('Erase everything still resets the count to 0, after a book was erased', async () => {
    const { app, f, kept } = await behind();
    app.store.deleteBook(f.asha);
    app.erase.eraseDeletedBook(f.asha);
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(await kept()).toBe(0);
    expect([...h.keychain.keys()]).toEqual([]);
  });
});

describe('[DATA-REQ-024][F14-REQ-026] Erase everything on this phone, signed out', () => {
  async function filled() {
    const app = await launch();
    const f = family(app);
    // Two letters kept: the free-letter count is 2 in the database mirror and the Keychain (D-082).
    app.store.ledgerDb().raiseTo(2);
    await app.ledger.syncLedger(app.store.ledgerDb());
    expect(h.keychain.size).toBe(1);
    expect(await app.ledger.lettersKept(app.store.ledgerDb())).toBe(4); // 4 worded letters present, the deleted one too (the count never decreases)
    app.store.setSetting('ageGate.passed', '1');
    app.store.setSetting('appearance', 'dark');
    app.store.setSetting('analytics.id', '0199a5b0-0000-7000-8000-00000000c0c0');
    // F1 app lock (develop #640): turned on, and the shelf purge's launch stamp (QE-05, #647). Both live in settings.
    app.store.setSetting('appLock.enabled', 'on');
    app.store.setSetting('appLock.grace', 'immediately');
    app.store.recordLaunch(T0);
    // BL-1989: a first-run draft (Asha's name, birthday and sign-off, typed and not yet made into a book) is a setting too.
    app.store.setSetting(FIRST_RUN_DRAFT_SETTING, serializeDraft({ step: 'signsAs', names: ['Asha'], expecting: false, birthday: '2026-03-14', dueDate: null, signsAs: 'Mama' }));
    expect(parseDraft(app.store.getSetting(FIRST_RUN_DRAFT_SETTING))?.names).toEqual(['Asha']); // the seed took
    const stray = put(h.disk, `${h.disk.documents}recording-5D2E0F11-0000-4000-8000-0000000057A2.m4a`, 8_000);
    const frames = put(h.disk, `${h.disk.caches}whole-frames-abc-1.aac`, 4_000);
    const zip = put(h.disk, `${h.disk.caches}exports/early-letters-2026-10-03.zip`, 9_000);
    const recovery = put(h.disk, `${h.disk.caches}recovery-export/recovery-2026-10-03.zip`, 9_000);
    // expo-print's half-rendered whole-book PDF, left by a kill during an export (Review A on #520 at 79bc4456, note 3).
    const printPdf = put(h.disk, `${h.disk.caches}Print/0A1B2C3D-0000-4000-8000-00000000F00D.pdf`, 12_000);
    h.keychain.set('scribe.auth.pendingName', 'Mama'); // an Apple sign-in that never finished
    h.keychain.set('scribe.auth.appleUser', 'stand-in.apple.user');
    h.keychain.set('scribe.auth.deviceId', 'ab'.repeat(32)); // NDR-1: the new-device email's install id; Erase everything clears it
    return { app, f, stray, frames, zip, recovery, printPdf };
  }

  function expectEmpty() {
    const tables = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").map((r) => r.name);
    expect(tables.length).toBeGreaterThan(5);
    for (const t of tables) expect([t, rows(t)]).toEqual([t, 0]);
  }

  it('removes every book, letter, draft, recording, copy, export and setting; keeps the speech model; resets the free-letter count; sends nothing', async () => {
    const { app, f, stray, frames, zip, recovery, printPdf } = await filled();
    // A language pack where packs/app-support.ts keeps it on iOS: Library/Application Support/packs, beside Documents.
    const packs = `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application Support/packs`;
    const pack = put(h.disk, `${packs}/en/rules.json`, 256);
    expect(await app.all.eraseEverything()).toBe('erased');

    expectEmpty();
    expect([f.a1, f.a2, f.draft, f.v1, stray, frames, zip, recovery, printPdf].filter(has)).toEqual([]);
    expect(namesIn(h.disk, recorderDir(h.disk))).toEqual([]);
    expect(namesIn(h.disk, `${h.disk.documents}models`)).toEqual(['ggml-large-v3-turbo-q5_0.bin']); // F17 6.2 F step 3
    expect(has(pack)).toBe(true); // F17 6.2 F step 3, DATA-REQ-024: language packs stay too
    expect(h.calls).toEqual(expect.arrayContaining(['analytics:stop', 'listening:sweep', 'invite:clear', 'reminders:forget']));
    // D-083, D-103: the free count starts again; the next kept letter is free letter 1. Nothing else stays in the Keychain.
    expect([...h.keychain.keys()]).toEqual([]);
    expect(await app.ledger.lettersKept(app.store.ledgerDb())).toBe(0);
    expect(app.store.eraseEverythingPending()).toBe(false);
    // First run: no book, no age answer.
    expect(app.store.getFamily()).toBeNull();
    expect(app.store.getSetting('ageGate.passed')).toBeNull();
    expect(fetches).toBe(0);
    // The app lock's two settings and the shelf purge's launch stamp went with every other setting.
    for (const k of ['appLock.enabled', 'appLock.grace', 'lastLaunchAt']) expect([k, app.store.getSetting(k)]).toEqual([k, null]);
    // BL-1989: the half-typed first run (a child's name and birthday) is gone, so first run opens empty.
    expect(app.store.getSetting(FIRST_RUN_DRAFT_SETTING)).toBeNull();

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBeNull();
    expect(await next.sweep.runLaunchSweep()).toEqual({});
    // The launch writes only its own time (the purge's clock guard) and its one-time rebuild mark; nothing came back.
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key).sort()).toEqual(['db.secureDeleteVacuumAt', 'lastLaunchAt']);
    db.run('DELETE FROM settings');
    expectEmpty();
  });

  it('[CDO-23] removes the moments file (labels, keys, home place); a launch after it finds none', async () => {
    h.exclusionSticks = true;
    const { app } = await filled();
    expect(await app.moments.momentsStore.setLabel('2026-10-03', 'Asha at the lake')).toEqual({ ok: true });
    const momentsFiles = () => [...h.disk.files.keys()].filter((u) => u.includes('/moments/'));
    expect(momentsFiles()).toHaveLength(1); // positive control
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(momentsFiles()).toEqual([]);
    const next = await launch();
    expect(next.moments.momentsStore.load()).toEqual({ state: 'empty' });
  });

  it('[CDO-23] a moments.v1.json that will not go leaves Erase everything incomplete with the mark kept, and the next launch finishes it', async () => {
    h.exclusionSticks = true;
    const { app } = await filled();
    expect(await app.moments.momentsStore.setLabel('2026-10-03', 'Asha at the lake')).toEqual({ ok: true });
    const key = [...h.disk.files.keys()].find((u) => u.endsWith('/moments.v1.json'))!;
    expect(key).toBeDefined(); // positive control: the file is there
    h.disk.undeletable.add(key);
    expect(await app.all.eraseEverything()).toBe('incomplete');
    expect(h.disk.files.has(key)).toBe(true);
    expect(app.store.eraseEverythingPending()).toBe(true);
    h.disk.undeletable.clear();
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(h.disk.files.has(key)).toBe(false);
  });

  it('[DATA-REQ-024] a whole-book PDF left in Caches/Print by a kill during an export render is removed by Erase everything (Review A on #520 at 79bc4456, note 3)', async () => {
    const { app, printPdf } = await filled();
    const other = put(h.disk, `${h.disk.caches}Print/0A1B2C3D-0000-4000-8000-00000000F00E.pdf`, 3_000); // a second one: the whole folder goes
    expect([printPdf, other].every(has)).toBe(true);
    expect(await app.all.eraseEverything()).toBe('erased');
    expect([printPdf, other].filter(has)).toEqual([]);
  });

  it('[LEGAL-REQ-002][D-026] the store tells its listeners that settings changed once the rows are gone, and again when the mark is removed: this is what brings the age question back at once (Review B on #520 at 79bc4456)', async () => {
    const { app } = await filled();
    expect(app.store.getSetting('ageGate.passed')).toBe('1');
    const seen: { answerGone: boolean; pending: boolean }[] = [];
    const off = app.store.subscribeTo('settings', () => {
      seen.push({ answerGone: app.store.getSetting('ageGate.passed') === null, pending: app.store.eraseEverythingPending() });
    });
    expect(await app.all.eraseEverything()).toBe('erased');
    off();
    // useAgeGate reads its answer again on each of these (age-gate.ts). One when the rows went (mark still set, the
    // Keychain and reminder steps still to come), one when the mark went. Never before the answer is gone.
    expect(seen).toEqual([
      { answerGone: true, pending: true },
      { answerGone: true, pending: false },
    ]);
  });

  it('[LEGAL-REQ-002][D-026] the same when the launch finishes an erase a kill cut short: the first frame is told, before the Keychain steps', async () => {
    const { app } = await filled();
    expect(app.store.eraseEverythingLocal(app.erase.eraseAudioFile, app.all.eraseDeviceFiles)).toBe('erased');
    // Killed here: the rows are gone, the mark stays. A new process opens the same database.
    const next = await launch();
    const seen: { answerGone: boolean; pending: boolean }[] = [];
    next.store.subscribeTo('settings', () => {
      seen.push({ answerGone: next.store.getSetting('ageGate.passed') === null, pending: next.store.eraseEverythingPending() });
    });
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(seen).toEqual([
      { answerGone: true, pending: true },
      { answerGone: true, pending: false },
    ]);
  });

  it('[F1][CISO-1] the app lock is reset too: it is read again after the rows are gone, so the empty book is neither covered nor locked', async () => {
    const { app } = await filled();
    expect(app.store.getSetting('appLock.enabled')).toBe('on');
    expect(await app.all.eraseEverything()).toBe('erased');
    // One reload, and at that moment the lock's setting already read "off" (null), so the lock starts from the defaults.
    expect(h.lockReloads).toEqual([null]);
    const prefs = await import('../src/lib/app-lock/prefs');
    expect(prefs.appLockOn()).toBe(false);
    expect(prefs.appLockGrace()).toBe('oneMinute');
  });

  it('[F1] a refused erase (signed in) leaves the app lock exactly as it was and reads nothing again', async () => {
    const { app } = await filled();
    app.store.setSetting('sync.ownerId', '0199a5b0-0000-7000-8000-00000000aaaa');
    expect(await app.all.eraseEverything()).toBe('signed_in');
    expect(h.lockReloads).toEqual([]);
    expect(app.store.getSetting('appLock.enabled')).toBe('on');
    expect(app.store.getSetting('appLock.grace')).toBe('immediately');
  });

  it('[F1][QE-05] the launch after an Erase everything: no launch stamp, so the purge erases nothing, and the stamp is written again', async () => {
    const { app } = await filled();
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(app.store.getSetting('lastLaunchAt')).toBeNull();
    // A letter deleted after the erase waits its 30 days: a launch with no stamp erases nothing, then records itself.
    const book = app.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    app.store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-0000000d0001', childId: book, captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, finalText: 'Asha, a new first.' }));
    app.store.deleteEntry('0199a5b0-0000-7000-8000-0000000d0001');
    vi.setSystemTime(T0 + 40 * DAY);
    const next = await launch();
    await next.sweep.runLaunchSweep();
    expect(rowKept('0199a5b0-0000-7000-8000-0000000d0001')).toBe(true);
    expect(next.store.getSetting('lastLaunchAt')).toBe(new Date(T0 + 40 * DAY).toISOString());
  });

  it('a kill while files are going: the next launch finishes before any screen reads the store, and the sweep re-attaches nothing', async () => {
    const { app, f, stray, printPdf } = await filled();
    let n = 0;
    expect(
      app.store.eraseEverythingLocal((uri, id) => {
        if (n++ === 2) throw new Error('killed');
        app.erase.eraseAudioFile(uri, id);
      }, app.all.eraseDeviceFiles),
    ).toBe('incomplete');
    expect(app.store.eraseEverythingPending()).toBe(true);
    expect(rows('entries')).toBe(4); // rows wait until every file is gone

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectEmpty();
    // The root layout reads the app lock (startAppLock) right after this call: it finds the lock off, no reload needed.
    const prefs = await import('../src/lib/app-lock/prefs');
    expect(prefs.appLockOn()).toBe(false);
    expect([f.a1, f.a2, f.draft, f.v1, stray, printPdf].filter(has)).toEqual([]);
    expect(h.keychain.has('earlyletters.letters.keptEver')).toBe(false);
    expect(await next.ledger.lettersKept(next.store.ledgerDb())).toBe(0);
    expect(await next.sweep.runLaunchSweep()).toEqual({});
    expect(rows('drafts')).toBe(0);
    expect(fetches).toBe(0);
  });

  it('a kill after the rows went but before the Keychain was cleared: the next launch clears the count, never raises it again', async () => {
    const { app } = await filled();
    expect(app.store.eraseEverythingLocal(app.erase.eraseAudioFile, app.all.eraseDeviceFiles)).toBe('erased');
    expect(h.keychain.has('earlyletters.letters.keptEver')).toBe(true); // killed here
    expect(app.store.eraseEverythingPending()).toBe(true);

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(h.keychain.has('earlyletters.letters.keptEver')).toBe(false);
    expect(next.store.getSetting('letters.keptEver')).toBeNull();
    expect(await next.ledger.lettersKept(next.store.ledgerDb())).toBe(0);
    expect(next.store.eraseEverythingPending()).toBe(false);
    expectEmpty();
  });

  it('[DATA-REQ-024] the failed line, "Try again now": Erase everything again after a failed erase finishes it on the spot', async () => {
    const { app, f, stray } = await filled();
    let n = 0;
    expect(
      app.store.eraseEverythingLocal((uri, id) => {
        if (n++ === 2) throw new Error('a file would not go');
        app.erase.eraseAudioFile(uri, id);
      }, app.all.eraseDeviceFiles),
    ).toBe('incomplete');
    expect(app.store.eraseEverythingPending()).toBe(true);
    expect(rows('entries')).toBe(4); // the page is back with its failed line; nothing was lost yet

    // The page offers the same Erase everything button again (erase.tsx); the second run is the same call, with the mark already set.
    expect(await app.all.eraseEverything()).toBe('erased');
    expectEmpty();
    expect([f.a1, f.a2, f.draft, f.v1, stray].filter(has)).toEqual([]);
    expect(app.store.eraseEverythingPending()).toBe(false);
    expect(fetches).toBe(0);
  });

  // BL-775 (DATA-REQ-024; D-144, CCO-6). Before it, a retry or the launch resume removed every row then present, so a
  // letter written after a failed erase went too; this case pinned that. Now only what existed when the mark was
  // written goes. The failed line's words are unchanged (D-144: new words go to the founder first).
  /** Erase everything that stops at the third recording, as a file that will not go does: rows and mark stay. */
  function failPartWay(app: App) {
    let n = 0;
    expect(
      app.store.eraseEverythingLocal((uri, id) => {
        if (n++ === 2) throw new Error('a file would not go');
        app.erase.eraseAudioFile(uri, id);
      }, app.all.eraseDeviceFiles),
    ).toBe('incomplete');
    expect(app.store.eraseEverythingPending()).toBe(true);
  }
  const PHOTOS = () => photosDirectory().uri.replace(/\/$/, '');
  /** A stored picture for an owner, as commitPhoto leaves it: the file in photos/, then its row. */
  const picture = (owner: string, media: string) => {
    const uri = put(h.disk, `${PHOTOS()}/${media}.jpg`, 3000);
    entryMediaStore(db).put({ entryId: owner, mediaId: media, ext: 'jpg', bytes: 3000, sha256: 'ab', width: 4, height: 4, text: 'Rain boots', place: 'the back step', addedAt: '2026-10-03T09:00:00Z', deletedAt: null });
    return uri;
  };
  const LATE = { spoken: '0199a5b0-0000-7000-8000-0000000a0009', typed: '0199a5b0-0000-7000-8000-0000000a000a', newBook: '0199a5b0-0000-7000-8000-0000000c0001' };
  /** What the person writes after the failed erase: a spoken and a typed letter in Asha's book, and a new book with a letter. */
  function writeAfter(app: App, f: ReturnType<typeof family>) {
    const late = take('0A1B2C3D-0000-4000-8000-00000000A5A9');
    const lateNew = take('0A1B2C3D-0000-4000-8000-00000000C0C1');
    app.store.saveEntry(letter({ id: LATE.spoken, childId: f.asha, audioUri: late, finalText: 'Asha, a letter after the failed erase.' }));
    app.store.saveEntry(letter({ id: LATE.typed, childId: f.asha, captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, finalText: 'Asha, a typed one.' }));
    const book = app.store.addChild({ name: 'Asha', birthday: '2026-09-01', dueDate: null, signsAs: 'Mama' }).id;
    app.store.saveEntry(letter({ id: LATE.newBook, childId: book, audioUri: lateNew, finalText: 'Asha, your first week.' }));
    return { late, lateNew, book };
  }
  /**
   * Every row and file of filled() is gone: the old letters, draft, recordings, stray and settings, and Avi's book. Asha's
   * book row stays, with its per-person row, because a letter written after the mark still points to it (Karma ruling on
   * #2102, point 1); `books` is every book row left.
   */
  function expectOldGone(f: ReturnType<typeof family>, stray: string, books: readonly string[]) {
    for (const id of [...Object.values(f.ids), f.draftId]) expect([id, rowKept(id), db.get('SELECT id FROM drafts WHERE id = ?', id)]).toEqual([id, false, null]);
    expect([f.a1, f.a2, f.draft, f.v1, stray].filter(has)).toEqual([]);
    const sorted = [...books].sort();
    expect(db.all<{ id: string }>('SELECT id FROM children ORDER BY id').map((r) => r.id)).toEqual(sorted);
    expect(db.all<{ id: string }>('SELECT child_id AS id FROM child_member_prefs ORDER BY child_id').map((r) => r.id)).toEqual(sorted);
    // The 18+ answer and every other choice made before the erase go, so the age question shows again (D-026).
    for (const k of ['ageGate.passed', 'appearance', 'analytics.id', 'appLock.enabled', FIRST_RUN_DRAFT_SETTING, `child.bornCardHidden.${f.asha}`]) expect([k, db.get('SELECT key FROM settings WHERE key = ?', k)]).toEqual([k, null]);
    expect(db.get("SELECT key FROM settings WHERE key LIKE 'erase.everything.%'")).toBeNull();
  }

  it('[BL-775][DATA-REQ-024] the next launch after a failed erase removes every row and file that existed when it began, and keeps a letter written afterwards with its recording', async () => {
    const { app, f, stray } = await filled();
    // sync_books is empty on a phone that never signed in; a row per book is planted so its rule is pinned too.
    for (const id of [f.asha, f.avi]) db.run('INSERT INTO sync_books (child_id) VALUES (?)', id);
    failPartWay(app);
    const { late, lateNew, book } = writeAfter(app, f);
    expect([rowKept(LATE.spoken), rowKept(LATE.typed), has(late)]).toEqual([true, true, true]);

    // The file can go now; the next time the app opens it finishes the erase.
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectOldGone(f, stray, [f.asha, book]);
    expect(db.all<{ id: string }>('SELECT child_id AS id FROM sync_books').map((r) => r.id)).toEqual([f.asha]);
    expect([rowKept(LATE.spoken), rowKept(LATE.typed), rowKept(LATE.newBook), has(late), has(lateNew)]).toEqual([true, true, true, true, true]);
    expect(next.store.getEntry(LATE.spoken)?.finalText).toBe('Asha, a letter after the failed erase.');
    expect(next.store.listChildren().map((c) => c.id).sort()).toEqual([f.asha, book].sort());
    // The late letters are on Asha's shelf, and none of her old ones is.
    expect(next.store.listEntriesForChild(f.asha).map((e) => e.id).sort()).toEqual([LATE.spoken, LATE.typed]);
    expect(next.store.listEntriesForChild(book).map((e) => e.id)).toEqual([LATE.newBook]);
    expect(next.store.eraseEverythingPending()).toBe(false);
    // Each kept letter's recording has its row: the sweep has nothing to bring back or report.
    expect(await next.sweep.runLaunchSweep()).toEqual({});
    expect(rows('drafts')).toBe(0);
    expect(fetches).toBe(0);
  });

  it('[BL-775][DATA-REQ-024] the same when the person presses Erase everything again on the page: a picture kept with a new letter stays, an old letter\'s goes', async () => {
    const { app, f, stray } = await filled();
    const oldPicture = picture(f.ids.v1, 'mV1');
    failPartWay(app);
    const { late, lateNew, book } = writeAfter(app, f);
    const newPicture = picture(LATE.spoken, 'mLate');

    expect(await app.all.eraseEverything()).toBe('erased');
    expectOldGone(f, stray, [f.asha, book]);
    expect([late, lateNew, newPicture].filter(has)).toEqual([late, lateNew, newPicture]);
    expect([has(oldPicture), db.all<{ id: string }>('SELECT id FROM entry_media').map((r) => r.id)]).toEqual([false, ['mLate']]);
    expect([rowKept(LATE.spoken), rowKept(LATE.typed), rowKept(LATE.newBook)]).toEqual([true, true, true]);
    expect(app.store.listEntriesForChild(f.asha).map((e) => e.id).sort()).toEqual([LATE.spoken, LATE.typed]);
    expect(app.store.eraseEverythingPending()).toBe(false);
    expect(fetches).toBe(0);
  });

  it('[BL-775][DATA-REQ-024] a kill part way through an erase with nothing written afterwards: the next open finds the store empty and the age question showing, as before', async () => {
    const { app, f, stray, printPdf } = await filled();
    let n = 0;
    expect(app.store.eraseEverythingLocal((uri, id) => { if (n++ === 1) throw new Error('killed'); app.erase.eraseAudioFile(uri, id); }, app.all.eraseDeviceFiles)).toBe('incomplete');
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectEmpty();
    expect(next.store.getSetting('ageGate.passed')).toBeNull();
    expect(next.store.listChildren()).toEqual([]);
    expect([f.a1, f.a2, f.draft, f.v1, stray, printPdf].filter(has)).toEqual([]);
    expect(next.store.eraseEverythingPending()).toBe(false);
    expect(await next.sweep.runLaunchSweep()).toEqual({});
  });

  it('[BL-775] a draft that was waiting when the erase began, kept as a letter afterwards, still goes with its recording: it keeps its id, and it existed then', async () => {
    const { app, f } = await filled();
    failPartWay(app);
    expect(has(f.draft)).toBe(true);
    app.store.saveLetterFromDraft(f.draftId, letter({ id: f.draftId, childId: f.asha, audioUri: f.draft, finalText: 'Asha, kept after the failed erase.' }));
    expect([rowKept(f.draftId), app.store.getDraft(f.draftId)]).toEqual([true, null]);
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect([rowKept(f.draftId), has(f.draft)]).toEqual([false, false]);
    expectEmpty();
  });

  it('[BL-775] a take started after the mark in an old book keeps that book row for it; the book\'s old letter and recording still go (Karma ruling on #2102, point 1)', async () => {
    const { app, f } = await filled();
    failPartWay(app);
    const t = take('0A1B2C3D-0000-4000-8000-00000000B0B9');
    const d = app.store.createDraft({ childId: f.avi, captureMode: 'spoken', promptKey: null, audioUri: t, audioDurationMs: 2000, state: 'ready' }).id;
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(next.store.listChildren().map((c) => [c.id, c.name])).toEqual([[f.avi, 'Avi']]);
    expect(db.all<{ id: string }>('SELECT child_id AS id FROM child_member_prefs').map((r) => r.id)).toEqual([f.avi]);
    expect([next.store.getDraft(d)?.childId, has(t), rowKept(f.ids.v1), has(f.v1)]).toEqual([f.avi, true, false, false]);
    expect([rows('entries'), rows('drafts')]).toEqual([0, 1]);
  });

  it('[BL-775] a setting written after the mark that names an old book, letter or draft by id goes with it; one naming a kept or a new book, or a new letter, stays (Karma ruling on #2102, point 2)', async () => {
    const { app, f, stray } = await filled();
    failPartWay(app);
    const { book } = writeAfter(app, f);
    // Keys first written after the mark, as the app writes them (settings/children/[id].tsx, wipe.ts, author-language.ts).
    const gone: Record<string, string> = {
      [`child.bornCardHidden.${f.avi}`]: '2024-06-10', // its value is the child's due date
      [`book.deletedAt.${f.avi}`]: '2026-10-03T10:00:00.000Z',
      [`book.erasing.${f.avi}`]: '2026-10-03T10:00:01.000Z',
      [`speech.letterLanguage.${f.draftId}`]: 'en-GB',
      [`speech.letterLanguage.${f.ids.a1}`]: 'en-GB',
    };
    const kept: Record<string, string> = {
      [`readTogether.sessions.${f.asha}`]: '1', // Asha's book is kept for the late letters, so its new setting is too
      [`child.bornCardHidden.${book}`]: '2026-09-01',
      [`speech.letterLanguage.${LATE.spoken}`]: 'en-GB',
    };
    for (const [k, v] of Object.entries({ ...gone, ...kept })) app.store.setSetting(k, v);
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectOldGone(f, stray, [f.asha, book]);
    for (const k of Object.keys(gone)) expect([k, next.store.getSetting(k)]).toEqual([k, null]);
    for (const [k, v] of Object.entries(kept)) expect([k, next.store.getSetting(k)]).toEqual([k, v]);
  });

  it('[BL-775][NS-09-R15] a let-go failure count written after the mark for an old draft goes with that draft', async () => {
    const { app, f } = await filled();
    failPartWay(app);
    const key = `discard.failures.${f.draftId}`;
    expect(app.store.getSetting(key)).toBeNull(); // not there when the mark was written
    expect(app.store.beginDiscard(f.draftId)).toBe(true);
    expect(app.store.noteDiscardFailure(f.draftId)).toBe(1); // its recording would not go
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect([next.store.getSetting(key), next.store.getDraft(f.draftId)]).toEqual([null, null]);
    expectEmpty();
  });

  // Review B on #2102 at 1991df28, must-fix 1; Karma ruling 7218729959 (option b). Nothing stops a sign-in while the mark
  // stands, and takeOwnership then queues an upload per old book and letter, with names, birthdays and words, under keys
  // the scope never saw. A row that names an old book, letter or draft by id is old whenever it was written.
  const USER = '0199a5b0-0000-7000-8000-00000000aaaa'; // a fictional account id
  async function signIn(app: App) {
    const { takeOwnership } = await import('../src/lib/sync/ownership');
    const now = new Date().toISOString();
    expect(takeOwnership(db, USER, { now, newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}` }).outcome).toBe('claimed');
    expect(app.store.localDeletionAllowed()).toBe(false);
  }
  const ops = () => db.all<{ seq: number; type: string; entity_id: string; payload: string }>('SELECT seq, type, entity_id, payload FROM sync_outbox ORDER BY seq');

  it('[BL-775] a sign-in between a failed try and the retry: the 6 uploads it queued for old books and letters go, a kept letter\'s stay, and the retry says erased only once a read-back finds nothing naming an old id (Karma ruling on #2102, Review B)', async () => {
    const { app, f, stray } = await filled();
    failPartWay(app);
    await signIn(app);
    // What Review B probed: the old books' names and birthdays, a per-book choice each, and each old letter with its words.
    const old = ops();
    expect(old.map((o) => o.type)).toEqual(['book.first_run', 'prefs.upsert', 'prefs.upsert', 'entry.upsert', 'entry.upsert', 'entry.upsert']);
    const sent = old.map((o) => o.payload).join('\n');
    for (const s of ['Avi', '2024-06-10', 'Asha, a quiet morning.', 'Avi, you built a tower.']) expect(sent).toContain(s);
    // Written after the sign-in, queued as the app queues them: a new book and a letter in it.
    const lateNew = take('0A1B2C3D-0000-4000-8000-00000000C0C1');
    const book = app.store.addChild({ name: 'Asha', birthday: '2026-09-01', dueDate: null, signsAs: 'Mama' }).id;
    app.store.saveEntry(letter({ id: LATE.newBook, childId: book, audioUri: lateNew, finalText: 'Asha, your first week.' }));
    const kept = ops().filter((o) => !old.some((x) => x.seq === o.seq));
    expect(kept.map((o) => o.entity_id)).toEqual(expect.arrayContaining([book, LATE.newBook]));

    // A row naming an old letter that will not go (planted: SQLite skips that delete without an error). The read-back
    // finds it, so the retry keeps the mark and reports failed, as when a file will not go.
    db.exec(`CREATE TRIGGER hold_old_op BEFORE DELETE ON sync_outbox WHEN old.entity_id = '${f.ids.v1}' BEGIN SELECT RAISE(IGNORE); END`);
    let next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('incomplete');
    expect(next.store.eraseEverythingPending()).toBe(true);
    expect(ops().map((o) => o.entity_id)).toContain(f.ids.v1);

    db.exec('DROP TRIGGER hold_old_op');
    next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectOldGone(f, stray, [book]);
    // All 6 are gone; the kept book's and letter's uploads are exactly as they were, and none names an old book or letter.
    expect(ops()).toEqual(kept);
    const oldIds = [f.asha, f.avi, f.draftId, ...Object.values(f.ids)];
    for (const o of ops()) expect([o.seq, oldIds.filter((id) => o.payload.includes(id))]).toEqual([o.seq, []]);
    expect(ops().map((o) => o.payload).join('\n')).not.toMatch(/Avi|2024-06-10|quiet morning|built a tower/);
    // The account written by the sign-in after the mark names no old data: it stays, so sync is not signed out.
    expect(next.store.getSetting('sync.ownerId')).toBe(USER);
    expect([rowKept(LATE.newBook), has(lateNew), next.store.listEntriesForChild(book).map((e) => e.id)]).toEqual([true, true, [LATE.newBook]]);
    expect(next.store.eraseEverythingPending()).toBe(false);
    expect(fetches).toBe(0);
  });

  // Karma ruling 7220668312 on #2102 (Reviews A and B at d2ec0ca3). A stand-in server for the real sync engine: it records
  // every call and each push's ops, answers a pull with an empty page, and loses every push answer on the way (nothing is
  // applied; the ops stay queued, as on a dropped connection).
  async function syncEngine() {
    const { createSyncEngine } = await import('../src/lib/sync/engine');
    const calls: string[] = [];
    const pushed: PushOp[] = [];
    const supabase: SupabaseLike = {
      async rpc(fn, args = {}): Promise<RpcResult> {
        calls.push(fn);
        if (fn === 'sync_pull') {
          return { data: { reset: false, epoch: 1, epoch_started_at: new Date(T0).toISOString(), books: [], gone: [], more: false, held: { rows: [], cursor: null, more: false } }, error: null, status: 200 };
        }
        if (fn === 'sync_push') pushed.push(...(args as { p_ops: PushOp[] }).p_ops);
        return { data: null, error: { message: 'network', code: '' } as never, status: 0 };
      },
    };
    const engine = createSyncEngine({
      db, supabase, userId: USER, newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
    });
    return { engine, calls, pushed };
  }
  const firstRunBooks = (payload: string) => ((JSON.parse(payload) as PushOp).data.children as { id: string }[]).map((k) => k.id);

  it('[BL-775] a first-run upload naming kept Asha, old Avi and a new book loses only Avi on the retry: Asha and the new book stay queued ahead of their late letters, and those upload (Karma ruling 7220668312, point 1; Review A)', async () => {
    const { app, f, stray } = await filled();
    failPartWay(app);
    const { book } = writeAfter(app, f); // late letters in Asha's book and a new book, all before the sign-in
    await signIn(app);
    const firstRun = () => ops().filter((o) => o.type === 'book.first_run');
    expect(firstRun().map((o) => firstRunBooks(o.payload))).toEqual([[f.asha, f.avi, book]]);
    const [op] = firstRun();

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectOldGone(f, stray, [f.asha, book]);
    // Rewritten in place, never deleted whole: the same op in the same place, Avi gone from it.
    expect(firstRun().map((o) => [o.seq, o.entity_id, firstRunBooks(o.payload)])).toEqual([[op.seq, op.entity_id, [f.asha, book]]]);
    expect(firstRun()[0].payload).not.toMatch(/Avi|2024-06-10/);
    // The books that stay still wait for it (nothing else would queue their first upload), and it goes ahead of their letters.
    expect(db.all('SELECT id, server_state AS s, first_run_batch AS b FROM children ORDER BY id')).toEqual(
      [f.asha, book].sort().map((id) => ({ id, s: 'pending', b: op.entity_id })),
    );
    const late = ops().filter((o) => o.type === 'entry.upsert');
    expect(late.map((o) => o.entity_id).sort()).toEqual([LATE.spoken, LATE.typed, LATE.newBook].sort());
    expect(late.every((o) => o.seq > op.seq)).toBe(true);
    const oldIds = [f.avi, f.draftId, ...Object.values(f.ids)];
    for (const o of ops()) expect([o.seq, oldIds.filter((id) => o.entity_id === id || o.payload.includes(id))]).toEqual([o.seq, []]);

    // The next sync uploads them: Asha's and the new book's first upload, then their late letters.
    const s = await syncEngine();
    s.engine.start();
    await s.engine.sync();
    expect(s.pushed[0].type).toBe('book.first_run');
    expect(s.pushed[0].data.children).toEqual([expect.objectContaining({ id: f.asha }), expect.objectContaining({ id: book })]);
    expect(s.pushed.filter((o) => o.type === 'entry.upsert').map((o) => o.id).sort()).toEqual([LATE.spoken, LATE.typed, LATE.newBook].sort());
    expect(JSON.stringify(s.pushed)).not.toMatch(/Avi|2024-06-10|quiet morning|built a tower/);
    s.engine.stop();
  });

  it('[BL-775] a refused write kept after the mark goes on the retry when it names an old book or letter, in a column or only in its payload; one naming only a kept book or a new letter stays (Karma ruling 7220668312, point 2)', async () => {
    const { app, f, stray } = await filled();
    failPartWay(app);
    const { book } = writeAfter(app, f); // Asha's book is kept for the late letters
    const refused = (opId: string, type: string, entityId: string, data: Record<string, unknown>) =>
      db.run(
        'INSERT INTO rejected_writes (op_id, type, entity_id, payload, code, rejected_at) VALUES (?, ?, ?, ?, ?, ?)',
        opId, type, entityId, JSON.stringify({ op: opId, type, id: entityId, data }), '42501', new Date().toISOString(),
      );
    const R = (n: number) => `0199a5b0-0000-7000-8000-0000000d000${n}`;
    // A refused write keeps a letter's whole words (merge.ts rejectOp): an old letter's go with it.
    refused(R(1), 'entry.upsert', f.ids.v1, { child_id: f.avi, final_text: 'Avi, you built a tower.' });
    // A refused first-run upload names its books only in its payload.
    refused(R(2), 'book.first_run', R(9), { children: [{ id: f.avi, name: 'Avi', date_of_birth: '2024-06-10', due_date: null }] });
    refused(R(3), 'prefs.upsert', f.asha, { signs_as: 'Mama' });
    refused(R(4), 'entry.upsert', LATE.spoken, { child_id: f.asha, final_text: 'Asha, a letter after the failed erase.' });
    refused(R(5), 'book.create', book, { name: 'Asha', date_of_birth: '2026-09-01', due_date: null });
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectOldGone(f, stray, [f.asha, book]);
    expect(db.all<{ op_id: string }>('SELECT op_id FROM rejected_writes ORDER BY op_id').map((r) => r.op_id)).toEqual([R(3), R(4), R(5)]);
  });

  it('[BL-775] while the erase mark stands sync uploads nothing, and pulls still run: a sign-in after a failed try queues its ops, a sync sends none, and they go only once the retry reports erased (Karma ruling 7220668312, point 3)', async () => {
    const { app, f } = await filled();
    failPartWay(app);
    writeAfter(app, f);
    // The sign-in: the engine claims the phone (queuing the old books and letters with the new) and syncs straight away.
    const s = await syncEngine();
    expect(s.engine.start()?.outcome).toBe('claimed');
    await s.engine.sync();
    await s.engine.sync({ verify: true });
    expect(s.calls).toContain('sync_pull');
    expect([s.calls.filter((c) => c === 'sync_push'), s.pushed]).toEqual([[], []]);
    expect(ops().map((o) => o.type)).toContain('book.first_run');
    const sent = db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox WHERE sent_at IS NOT NULL OR attempts > 0')!.n;
    expect(sent).toBe(0);

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(next.store.eraseEverythingPending()).toBe(false);
    await s.engine.sync();
    expect(s.calls).toContain('sync_push');
    expect(s.pushed.map((o) => o.type)).toContain('book.first_run');
    expect(s.pushed.filter((o) => o.type === 'entry.upsert').map((o) => o.id).sort()).toEqual([LATE.spoken, LATE.typed, LATE.newBook].sort());
    expect(JSON.stringify(s.pushed)).not.toMatch(/Avi|2024-06-10|quiet morning|built a tower/);
    s.engine.stop();
    expect(fetches).toBe(0);
  });

  it('[BL-775] a per-person row and a server listing first written after the mark for an old book go with that book; a kept book\'s stay (Karma ruling on #2102, Review B)', async () => {
    const { app, f, stray } = await filled();
    db.run('DELETE FROM child_member_prefs WHERE child_id = ?', f.avi); // Avi's book has no per-person row when the mark is written
    failPartWay(app);
    const { book } = writeAfter(app, f); // Asha's book is kept for the late letters
    db.run("INSERT INTO child_member_prefs (child_id, signs_as, updated_at) VALUES (?, 'Papa', '2026-10-03T10:00:00.000Z')", f.avi);
    for (const id of [f.avi, f.asha]) db.run('INSERT INTO sync_books (child_id) VALUES (?)', id);
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expectOldGone(f, stray, [f.asha, book]);
    expect(db.all<{ id: string }>('SELECT child_id AS id FROM sync_books').map((r) => r.id)).toEqual([f.asha]);
    expect(db.get<{ s: string }>('SELECT signs_as AS s FROM child_member_prefs WHERE child_id = ?', f.asha)?.s).toBe('Mama');
  });

  it('[BL-775] the scope written with the mark holds ids and settings keys only: no name, no words, no setting\'s value', async () => {
    const { app } = await filled();
    failPartWay(app);
    const scope = app.store.getSetting('erase.everything.scope');
    expect(scope).not.toBeNull();
    expect(scope).not.toMatch(/Asha|Avi|Mama|Papa|snow|morning|tower|laughed|dark|immediately/);
    expect(Object.keys(JSON.parse(scope!).tables)).toEqual(expect.arrayContaining(['children', 'drafts', 'entries', 'settings']));
  });

  it('[BL-775] a mark with no usable scope (left by a build before BL-775, or the schema changed since) removes everything present, which is what the failed line says', async () => {
    for (const spoil of ['no scope', 'schema changed']) {
      const { app, f } = await filled();
      failPartWay(app);
      writeAfter(app, f);
      if (spoil === 'no scope') db.run("DELETE FROM settings WHERE key = 'erase.everything.scope'");
      else db.run('UPDATE settings SET value = json_set(value, \'$.schema\', 0) WHERE key = \'erase.everything.scope\'');
      const next = await launch();
      expect(await next.all.resumeEraseAtLaunch(), spoil).toBe('erased');
      expect([rowKept(LATE.spoken), rowKept(LATE.typed), rowKept(LATE.newBook)], spoil).toEqual([false, false, false]);
      expectEmpty();
    }
  });

  it('[BL-775] while an erase is pending the launch sweep does not bring an old stray recording back as a draft, so the next try cannot mistake it for new work', async () => {
    const { app, f, stray } = await filled();
    failPartWay(app); // stops before the device sweep, so the stray is still there
    h.disk.undeletable.add(f.v1); // and the next launch's try fails too
    let next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('incomplete');
    await next.sweep.runLaunchSweep();
    expect([has(stray), rows('drafts'), rows('orphan_audio')]).toEqual([true, 1, 0]); // only the old draft; nothing made from the stray
    h.disk.undeletable.delete(f.v1);
    next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(has(stray)).toBe(false);
    expectEmpty();
  });

  it('[BL-775] every table has a one-column primary key, so the scope names each row by a key that is never given to another row (wipe.ts EraseScope)', async () => {
    await launch();
    const tables = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'letter_search%'").map((r) => r.name);
    expect(tables.length).toBeGreaterThan(5);
    for (const t of tables) expect([t, db.all<{ pk: number }>(`PRAGMA table_info("${t}")`).filter((c) => c.pk > 0).length]).toEqual([t, 1]);
  });

  it('a phone that has signed in is refused and nothing changes (F17-REQ-026 is a separate flow)', async () => {
    const { app, f } = await filled();
    app.store.setSetting('sync.ownerId', '0199a5b0-0000-7000-8000-00000000aaaa');
    expect(await app.all.eraseEverything()).toBe('signed_in');
    expect(app.store.eraseEverythingPending()).toBe(false);
    expect(app.store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Avi']);
    expect([f.a1, f.v1].every(has)).toBe(true);
    expect(h.keychain.has('earlyletters.letters.keptEver')).toBe(true);
  });
});

describe('[DATA-REQ-024] erased words leave the database file itself, not only its rows (privacy Review A on #520)', () => {
  // A real database file in WAL mode with the phone's open pragmas, so the bytes an iPhone backup would copy can be read.
  const WORD = 'Zinniaquill'; // a word only these letters say
  let dir = '';
  let file = '';

  beforeEach(() => {
    closeDb();
    dir = mkdtempSync(join(tmpdir(), 'erase-bytes-'));
    file = join(dir, 'scribe.db');
    const n = nodeDb(file);
    n.db.exec(OPEN_PRAGMAS);
    db = n.db;
    closeDb = n.close;
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Every byte of scribe.db and scribe.db-wal, as a backup would copy them. */
  const bytesOnDisk = () => Buffer.concat([file, `${file}-wal`].filter(existsSync).map((p) => readFileSync(p)));
  const found = (s: string) => bytesOnDisk().includes(Buffer.from(s, 'utf8'));

  function words(app: App, id: string, childId: string, audioUri: string | null) {
    app.store.saveEntry(
      letter({ id, childId, audioUri, rawTranscript: `um ${WORD} at the window`, finalText: `${WORD} at the window.`, ...(audioUri ? {} : { captureMode: 'typed', audioSha256: null, audioBytes: null, audioDurationMs: null }) }),
    );
  }

  it('Erase now on one letter in Recently deleted', async () => {
    const app = await launch();
    const avi = app.store.addChild({ name: 'Avi', birthday: null, dueDate: null, signsAs: 'Papa' }).id;
    const id = '0199a5b0-0000-7000-8000-0000000c0001';
    words(app, id, avi, null);
    expect(found(WORD)).toBe(true);
    app.store.deleteEntry(id);
    expect(app.erase.eraseDeletedLetter(id)).toBe(true);
    expect(found(WORD)).toBe(false);
  });

  it('the 30-day erase of a letter at launch', async () => {
    let app = await launch();
    const avi = app.store.addChild({ name: 'Avi', birthday: null, dueDate: null, signsAs: 'Papa' }).id;
    const id = '0199a5b0-0000-7000-8000-0000000c0002';
    words(app, id, avi, null);
    app.store.deleteEntry(id);
    // Two launches agree the letter has waited its 30 days (QE-05): the first only records the time it saw.
    vi.setSystemTime(T0 + 30 * DAY + 1000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(rowKept(id)).toBe(true);
    vi.setSystemTime(T0 + 31 * DAY + 1000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(rowKept(id)).toBe(false);
    expect(found(WORD)).toBe(false);
  });

  it("Erase now on a deleted book: its letters' words and the child's name", async () => {
    const app = await launch();
    const asha = app.store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' }).id;
    app.store.addChild({ name: 'Avi', birthday: null, dueDate: null, signsAs: 'Papa' });
    words(app, '0199a5b0-0000-7000-8000-0000000c0003', asha, take('0A1B2C3D-0000-4000-8000-0000000C0C03'));
    expect(found('Asha')).toBe(true);
    app.store.deleteBook(asha);
    expect(app.erase.eraseDeletedBook(asha)).toBe(true);
    expect(found(WORD)).toBe(false);
    expect(found('Asha')).toBe(false);
  });

  it('a letter erased by an earlier build (no secure_delete) leaves no bytes after the first launch of this build, which rebuilds the file once', async () => {
    let app = await launch();
    const avi = app.store.addChild({ name: 'Avi', birthday: null, dueDate: null, signsAs: 'Papa' }).id;
    words(app, '0199a5b0-0000-7000-8000-0000000c0005', avi, null);
    // An earlier build: no secure_delete, a plain DELETE, the WAL folded into the file. The words sit in free pages.
    db.exec('PRAGMA secure_delete = OFF');
    db.run('DELETE FROM entries');
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.run('DELETE FROM settings WHERE key = ?', 'db.secureDeleteVacuumAt'); // that build never rebuilt the file
    expect(found(WORD)).toBe(true);

    app = await launch(); // this build's first open: migrations, then the one-time rebuild, before any screen
    expect(found(WORD)).toBe(false);
    const mark = app.store.getSetting('db.secureDeleteVacuumAt');
    expect(mark).not.toBeNull();

    vi.setSystemTime(T0 + DAY);
    app = await launch(); // once only
    expect(app.store.getSetting('db.secureDeleteVacuumAt')).toBe(mark);
  });

  it('Erase everything: no words and no name anywhere in the file', async () => {
    const app = await launch();
    const asha = app.store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' }).id;
    words(app, '0199a5b0-0000-7000-8000-0000000c0004', asha, take('0A1B2C3D-0000-4000-8000-0000000C0C04'));
    expect(await app.all.eraseEverything()).toBe('erased');
    for (const s of [WORD, 'Asha', 'Mama']) expect([s, found(s)]).toEqual([s, false]);
  });
});

describe('[LEGAL-REQ-002][D-026] Erase everything never ends the 24-hour age stop early (CCO view on #520)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

  it('(a) a stopped person cannot reach Settings or Erase everything: no route renders until the gate passes', () => {
    const layout = src('src/app/_layout.tsx');
    const gate = layout.indexOf("gate.decision !== 'pass' ? (");
    const stopScreen = layout.indexOf('<AgeGateScreen', gate);
    const stack = layout.indexOf('<Stack screenOptions', gate);
    expect(gate).toBeGreaterThan(0);
    expect(stopScreen).toBeGreaterThan(gate);
    expect(stack).toBeGreaterThan(stopScreen); // the Stack (every route, Settings included) is the other branch only
    // The erase screen is a route under that Stack, and only it starts an erase. A deep link is gated too (+native-intent).
    expect(existsSync(join(__dirname, '..', 'src/app/settings/erase.tsx'))).toBe(true);
    expect(src('src/app/+native-intent.tsx')).toMatch(/decideGate\(/);
    const callers = ['src/app/settings/erase.tsx', 'src/app/settings/index.tsx', 'src/app/_layout.tsx'].filter((p) => /\beraseEverything\(\)/.test(src(p)));
    expect(callers).toEqual(['src/app/settings/erase.tsx']);
  });

  it('the root layout resumes an unfinished erase before the app lock reads its settings and before the age gate reads its answer', () => {
    const layout = src('src/app/_layout.tsx');
    const resume = layout.indexOf('useState(() => void resumeEraseAtLaunch())');
    const lock = layout.indexOf('useState(startAppLock)');
    const gate = layout.indexOf('const gate = useAgeGate()');
    expect(resume).toBeGreaterThan(0);
    expect(lock).toBeGreaterThan(resume);
    expect(gate).toBeGreaterThan(lock);
  });

  it('(b) a stop still running is kept, exactly as stored', async () => {
    const app = await launch();
    family(app);
    const at = new Date(T0 - 2 * 60 * 60 * 1000).toISOString(); // a No two hours ago
    app.store.setSetting('ageGate.stoppedAt', at);
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(app.store.getSetting('ageGate.stoppedAt')).toBe(at);
    expect(app.store.getSetting('ageGate.passed')).toBeNull();
    expect(app.store.listChildren()).toEqual([]);
  });

  it('(b) the same when the erase is finished by the next launch after a kill', async () => {
    let app = await launch();
    family(app);
    const at = new Date(T0 - 60 * 1000).toISOString();
    app.store.setSetting('ageGate.stoppedAt', at);
    let n = 0;
    app.store.eraseEverythingLocal((uri, id) => {
      if (n++ === 1) throw new Error('killed');
      app.erase.eraseAudioFile(uri, id);
    }, app.all.eraseDeviceFiles);
    app = await launch();
    expect(await app.all.resumeEraseAtLaunch()).toBe('erased');
    expect(app.store.getSetting('ageGate.stoppedAt')).toBe(at);
  });

  it('(b) an expired stop (24 hours or more) goes with everything else', async () => {
    const app = await launch();
    family(app);
    app.store.setSetting('ageGate.stoppedAt', new Date(T0 - 25 * 60 * 60 * 1000).toISOString());
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(app.store.getSetting('ageGate.stoppedAt')).toBeNull();
  });

  it('(b) the stop lives only in settings: nothing in the Keychain holds an age answer', () => {
    const keys = ['src/lib/age-gate.ts', 'src/lib/age-gate.logic.ts'].map(src).join('\n');
    expect(keys).not.toMatch(/secureStorage|SecureStore/);
  });

  it('Erase never deletes the backup book keys or the device key (data design 1 Nov, section 4; security 3(b))', () => {
    // Book keys are synchronizable iCloud Keychain items: deleting them here would delete them on every device and
    // break restore. Only Delete account removes them. Erase reaches the Keychain only through the named
    // this-device-only keys in erase-everything.ts and the ledger, never through the backup KeyVault.
    const paths = ['src/lib/erase-everything.ts', 'src/lib/db/repos/wipe.ts', 'src/lib/store.ts', 'src/lib/billing/letter-ledger.ts'];
    for (const p of paths) {
      const s = src(p);
      // B5: the only backup files erase-everything.ts may import are files.ts (the state file's delete) and token-vault.ts (the upload-token item); no keys, no runtime.
      expect([p, /from '[^']*\/backup(?:\/|')/.test(s.replace(/from '\.\/backup\/(files|token-vault)'/g, ''))]).toEqual([p, false]);
      expect([p, /deleteBookKeys|deleteDeviceKey|KeyVault/.test(s)]).toEqual([p, false]);
    }
  });

  it("age-gate.ts's subscription returns the unsubscribe as the effect's cleanup, and the unsubscribe stops it", async () => {
    // The hook's behaviour (Yes keeps its leave, an erase brings the question back) is in age-gate-erase.test.ts.
    expect(src('src/lib/age-gate.ts')).toMatch(/subscribeTo\('settings', \(\) => \{\s*const next = readDecision\(\);\s*if \(next !== 'pass'\) setDecision\(next\);\s*\}\),\s*\[\],\s*\);/);
    const app = await launch();
    let calls = 0;
    const off = app.store.subscribeTo('settings', () => (calls += 1));
    expect(typeof off).toBe('function');
    app.store.setSetting('appearance', 'dark');
    expect(calls).toBe(1);
    off();
    app.store.setSetting('appearance', 'light');
    expect(calls).toBe(1);
  });
});

describe("the screens' rules (components/settings/wipe.logic.ts, components/book/shelf.logic.ts)", () => {
  it('the typed confirm takes the word in any case, with spaces around it, and nothing else', async () => {
    const { typedWordMatches } = await import('../src/components/settings/wipe.logic');
    expect(typedWordMatches(' Delete ', 'delete')).toBe(true);
    expect(typedWordMatches('delet', 'delete')).toBe(false);
    expect(typedWordMatches('Asha', 'delete')).toBe(false);
  });

  it('a deleted book shows the day it was deleted and the day it is kept until, 30 days on, never a countdown', async () => {
    const { shelfBookDays, shelfDateLine } = await import('../src/components/book/shelf.logic');
    const line = shelfDateLine(shelfBookDays('2026-10-03T09:00:00.000Z', 'en-US'), { deletedOn: 'Deleted {date}', erasesOn: 'Kept here until {date}' });
    expect(line).toBe('Deleted October 3. Kept here until November 2.');
  });
});

describe('[DATA-REQ-024] Erase everything, design 2.12: final strings, the confirm, the Erasing screen (Review B on #520; CTO ruling 8 Nov)', () => {
  const e = en.settings.erase;
  const screen = () => readFileSync(join(__dirname, '..', 'src/app/settings/erase.tsx'), 'utf8');

  it('says the content.md 4.11 strings word for word', () => {
    expect(e.title).toBe('Erase everything on this phone');
    expect(e.body).toBe('This removes every book, letter and recording from this iPhone, and your settings. We hold no copy.');
    expect(e.exportFirst).toBe('Save a copy first?');
    expect(e.exportButton).toBe('Export your book');
    expect(e.button).toBe('Erase everything');
    expect(e.confirmTitle).toBe('Erase everything on this phone?');
    expect(e.confirmBody).toBe('This cannot be undone.');
    expect(e.confirmButton).toBe('Erase');
    expect(e.busy).toBe('Erasing');
    expect(e.doneA11y).toBe('Everything on this phone is erased.');
  });

  it('the confirm: Keep everything first as cancel, Erase second and destructive; the screen shows it with a warning haptic, and no typed word', async () => {
    const { eraseConfirmDialog } = await import('../src/components/settings/wipe.logic');
    const onErase = vi.fn();
    const d = eraseConfirmDialog(e, onErase);
    expect(d.title).toBe(e.confirmTitle);
    expect(d.body).toBe(e.confirmBody);
    expect(d.buttons.map((b) => [b.text, b.style])).toEqual([
      [e.back, 'cancel'],
      [e.confirmButton, 'destructive'],
    ]);
    d.buttons[1].onPress?.();
    expect(onErase).toHaveBeenCalledTimes(1);
    const s = screen();
    expect(s).toMatch(/Alert\.alert\(d\.title, d\.body, d\.buttons\)/);
    expect(s.indexOf("haptic('warning')")).toBeGreaterThan(0);
    expect(s.indexOf("haptic('warning')")).toBeLessThan(s.indexOf('Alert.alert('));
    expect(s).not.toMatch(/typedWordMatches|typeWord|TextField/);
    // Step 1's button opens the confirm and starts nothing by itself.
    expect(s).toMatch(/label=\{e\.button\} onPress=\{askToErase\}/);
  });

  it('cancel does nothing: no action, so nothing is erased and the page stays as it was', async () => {
    const { eraseConfirmDialog } = await import('../src/components/settings/wipe.logic');
    const onErase = vi.fn();
    const [cancel] = eraseConfirmDialog(e, onErase).buttons;
    expect(cancel.onPress).toBeUndefined();
    expect(onErase).not.toHaveBeenCalled();
  });

  it('after Erase the Erasing screen comes first, before the erase runs, and stays; the done line is announced', async () => {
    const { runEraseEverything } = await import('../src/components/settings/wipe.logic');
    const log: string[] = [];
    const r = await runEraseEverything({
      ownerCheck: async () => 'passed',
      onCheckFailed: () => {},
      erase: async () => {
        log.push('erase');
        return 'erased';
      },
      setPhase: (p) => log.push(`phase:${p}`),
      setFailed: (f) => log.push(`failed:${f}`),
      announceDone: () => log.push('announce'),
    });
    expect(r).toBe('erased');
    expect(log).toEqual(['failed:null', 'phase:erasing', 'erase', 'announce']);
    const s = screen();
    // The Erasing screen: StateScreen loading with "Erasing", no actions, no back button, no swipe, Android back held.
    expect(s).toMatch(/<StateScreen kind="loading" title=\{e\.busy\} \/>/);
    expect(s).toMatch(/headerBackVisible: !erasing, gestureEnabled: !erasing/);
    expect(s).toMatch(/hardwareBackPress', \(\) => erasingRef\.current/);
    // Through lib/a11y's announce (speech-gate.test.ts allows only four files to call AccessibilityInfo directly).
    expect(s).toMatch(/announceDone: \(\) => announce\(e\.doneA11y\)/);
    expect(s).not.toMatch(/AccessibilityInfo/);
  });

  it('a failed or refused erase leaves the Erasing screen for the page with one line, and announces nothing', async () => {
    const { runEraseEverything } = await import('../src/components/settings/wipe.logic');
    for (const [outcome, line] of [
      ['incomplete', 'failed'],
      ['signed_in', 'signed_in'],
    ] as const) {
      const log: string[] = [];
      await runEraseEverything({
        ownerCheck: async () => 'passed',
      onCheckFailed: () => {},
        erase: async () => outcome,
        setPhase: (p) => log.push(`phase:${p}`),
        setFailed: (f) => log.push(`failed:${f}`),
        announceDone: () => log.push('announce'),
      });
      expect(log).toEqual(['failed:null', 'phase:erasing', 'phase:review', `failed:${line}`]);
    }
    const log: string[] = [];
    await runEraseEverything({
      ownerCheck: async () => 'passed',
      onCheckFailed: () => {},
      erase: async () => {
        throw new Error('disk');
      },
      setPhase: (p) => log.push(`phase:${p}`),
      setFailed: (f) => log.push(`failed:${f}`),
      announceDone: () => log.push('announce'),
    });
    expect(log).toEqual(['failed:null', 'phase:erasing', 'phase:review', 'failed:failed']);
  });

  it('[DATA-REQ-024] the failed line is the one the page shows for an unfinished erase', () => {
    const s = screen();
    expect(s).toMatch(/failed \? <ErrorLine message=\{failed === 'signed_in' \? e\.signedIn : e\.failed\} \/> : null/);
    expect(s.match(/<ErrorLine/g)).toHaveLength(1);
  });

  // Council of 9 Nov 2026, design seat defect 1. This replaces the pin that said the line sat "beside the Erase everything
  // button it tells the person to press" (before the button). The page remounts at the top after a failed erase, and a
  // line at the foot of a long page, at a large text size, was below the fold: the warning is now the first thing.
  it('[DATA-REQ-024] the failed line is the first thing on the page, above the heading, so it is seen and read before anything else', () => {
    const s = screen();
    expect(s).toMatch(/<ScrollView key="review"[^>]*>\s*\{header\}\s*\{failed \? <ErrorLine message=\{failed === 'signed_in' \? e\.signedIn : e\.failed\} \/> : null\}\s*<View className="gap-2">\s*<Text variant="title2" asHeading>\s*\{e\.heading\}/);
    expect(s.indexOf('<ErrorLine')).toBeLessThan(s.indexOf('{e.heading}'));
    expect(s.indexOf('{e.heading}')).toBeLessThan(s.indexOf('label={e.button}'));
    // Not repeated at the foot, so it is never read twice.
    expect(s.indexOf('<ErrorLine')).toBe(s.lastIndexOf('<ErrorLine'));
  });
});

describe('[DATA-REQ-024] Erase everything page: wording, order and the Plus line (council on #520; founder decision of 8 Nov)', () => {
  const e = en.settings.erase;
  const screen = () => readFileSync(join(__dirname, '..', 'src/app/settings/erase.tsx'), 'utf8');

  it('the three wording edits, word for word, and the lines that must not change', () => {
    expect(e.backups).toBe('Exports you already saved, and backups of this phone such as iCloud Backup, are not changed.');
    expect(e.failed).toBe('Erasing did not finish. Try again now. If you wait, the app finishes it the next time it opens, and that erases anything you add before then.');
    // The account-deletion screen's Plus card says the same, with its own first words.
    expect(e.plusStays).toBe('Erasing does not cancel Plus. Billing continues through Apple until you cancel.');
    expect(accountDeletionCopy.subscription.body).toBe(`Deleting your account ${e.plusStays.slice('Erasing '.length)}`);
    // Unchanged on purpose.
    expect(e.body).toBe('This removes every book, letter and recording from this iPhone, and your settings. We hold no copy.');
    expect(e.onThisPhone).toBe('This happens on this phone only. Nothing is sent anywhere.');
    expect(e.freeLetters).toBe('Your free letters start again.');
    const d = en.settings.delete;
    expect(d.bookBodyThisPhone).toBe("Every letter and recording in {child}'s book will be removed from this phone.");
    expect(d.bookEraseNowBody).toBe('Every letter and recording in it is erased for good.');
    expect(d.bookEraseFailedToast).toBe("The book wasn't erased yet. The erase will finish the next time the app opens.");
  });

  it('button labels stay at most 22 characters', () => {
    for (const label of [e.button, e.exportButton, e.confirmButton, e.back]) expect(label.length, label).toBeLessThanOrEqual(22);
  });

  // The device's Plus state as usePlan().details holds it (lib/billing/plan.logic.ts PlanDetails): status, willAutoRenew, ownership.
  const PLANS = {
    none: { status: 'none', willAutoRenew: null, ownership: null },
    purchased: { status: 'active', willAutoRenew: true, ownership: 'purchased' },
    trial: { status: 'trial', willAutoRenew: null, ownership: 'purchased' },
    billingRetry: { status: 'billing_retry', willAutoRenew: null, ownership: 'purchased' },
    ending: { status: 'active', willAutoRenew: false, ownership: 'purchased' },
    expired: { status: 'expired', willAutoRenew: false, ownership: 'purchased' },
    refunded: { status: 'refunded', willAutoRenew: null, ownership: 'purchased' },
    revoked: { status: 'revoked', willAutoRenew: null, ownership: 'purchased' },
    // Ownership not read (the guard is only for Family Sharing; the Plus line is the default for Plus that will renew).
    ownerUnread: { status: 'active', willAutoRenew: true, ownership: null },
    familyShared: { status: 'active', willAutoRenew: true, ownership: 'familyShared' },
    familySharedUnknown: { status: 'active', willAutoRenew: null, ownership: 'familyShared' },
    familySharedTrial: { status: 'trial', willAutoRenew: null, ownership: 'familyShared' },
  } satisfies Record<string, ErasePlan>;
  const shows = (alpha: boolean, plan: ErasePlan) => eraseNoteKeys({ alpha, plan }).includes('plusStays');

  it('the notes read: backups, this phone only, speech, then (store build, own Plus renewing) the Plus line, then (store build) free letters', () => {
    expect(eraseNoteKeys({ alpha: false, plan: PLANS.purchased })).toEqual(['backups', 'onThisPhone', 'speechStays', 'plusStays', 'freeLetters']);
    expect(eraseNoteKeys({ alpha: false, plan: PLANS.none })).toEqual(['backups', 'onThisPhone', 'speechStays', 'freeLetters']);
  });

  it('the Plus line: hidden in alpha whatever the plan, hidden when Plus is off or ending, shown when the person\'s own Plus is on and renewing in the store build', () => {
    // Alpha: never, even with the plan that shows it in the store build.
    for (const [name, plan] of Object.entries(PLANS)) expect([name, erasePlusLineShows({ alpha: true, plan }), shows(true, plan)]).toEqual([name, false, false]);
    // Store build, no Plus or Plus that is ending: no.
    for (const name of ['none', 'expired', 'refunded', 'revoked', 'ending'] as const) expect([name, erasePlusLineShows({ alpha: false, plan: PLANS[name] })]).toEqual([name, false]);
    // Store build, the person's own Plus on and renewing (or not yet known to be ending): yes.
    for (const name of ['purchased', 'trial', 'billingRetry', 'ownerUnread'] as const) expect([name, erasePlusLineShows({ alpha: false, plan: PLANS[name] }), shows(false, PLANS[name])]).toEqual([name, true, true]);
  });

  it('[family member] Plus through Family Sharing never shows the Plus line: someone else is billed, so "Billing continues through Apple until you cancel" would be false for them', () => {
    for (const name of ['familyShared', 'familySharedUnknown', 'familySharedTrial'] as const) {
      expect([name, erasePlusLineShows({ alpha: false, plan: PLANS[name] }), shows(false, PLANS[name])]).toEqual([name, false, false]);
      // The rest of the page is as for anyone in the store build.
      expect(eraseNoteKeys({ alpha: false, plan: PLANS[name] })).toEqual(['backups', 'onThisPhone', 'speechStays', 'freeLetters']);
    }
    // Only the ownership differs from the purchased plan that shows it.
    expect(erasePlusLineShows({ alpha: false, plan: { ...PLANS.purchased, ownership: 'familyShared' } })).toBe(false);
    expect(erasePlusLineShows({ alpha: false, plan: PLANS.purchased })).toBe(true);
  });

  it('the page asks exactly that of the device\'s plan (usePlan), through the pure function, and from nothing a person can set', () => {
    const s = screen();
    expect(s).toMatch(/const plan = usePlan\(\);/);
    expect(s).toMatch(/eraseNoteKeys\(\{ alpha: PLUS_ALPHA, plan: plan\.details \}\)/);
    expect(s).toMatch(/import \{ usePlan \} from '@\/lib\/billing';/);
    // The decision lives in wipe.logic.ts: the page holds no plan or ownership test of its own.
    expect(s).not.toMatch(/familyShared|willAutoRenew|showSubscriptionNotice|\.status\b/);
  });

  it('the page draws the body, then the notes in that order, then the Export card, then the button; every note is the muted note style, none is body weight', () => {
    const s = screen();
    const at = (needle: string) => {
      const i = s.indexOf(needle);
      expect(i, needle).toBeGreaterThan(-1);
      return i;
    };
    expect(s.match(/\{e\.body\}/g)).toHaveLength(1);
    expect(at('{e.body}')).toBeLessThan(at('notes.map('));
    expect(at('notes.map(')).toBeLessThan(at('<Card variant="raised"'));
    expect(at('<Card variant="raised"')).toBeLessThan(at('label={e.exportButton}'));
    expect(at('label={e.exportButton}')).toBeLessThan(at('label={e.button}'));
    // One list drawn once: the order on screen and the order VoiceOver reads are the same list. The page names no note itself.
    expect(s).toMatch(/\{notes\.map\(\(k\) => \(\s*<Text key=\{k\} variant="subhead" tone="muted">\s*\{e\[k\]\}\s*<\/Text>\s*\)\)\}/);
    expect(s).not.toMatch(/\be\.(backups|onThisPhone|speechStays|plusStays|freeLetters)\b/);
    expect(s).toMatch(/const notes = eraseNoteKeys\(\{ alpha: PLUS_ALPHA, plan: plan\.details \}\);/);
  });

  it('every note key names a string, and each is one plain sentence or two with the content rules\' characters', () => {
    for (const k of eraseNoteKeys({ alpha: false, plan: PLANS.purchased })) {
      const line = e[k];
      expect(typeof line, k).toBe('string');
      expect(line, k).not.toMatch(/[^\x20-\x7e]/);
      expect(line, k).toMatch(/[.]$/);
    }
  });
});

describe('[BL-387][F17 6.2 F][DATA-REQ-024] the Erase everything row on Settings home is pinned (Review A on #520: a deleted row left 139 tests green)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
  const home = () => src('src/app/settings/index.tsx');
  const rowLabel = 'copy.settings.erase.rowLabel';

  /** The Your letters group: from its section to the next one (Privacy and security). */
  function lettersGroup() {
    const s = home();
    const from = s.indexOf('<ListSection title={h.sections.letters}>');
    const to = s.indexOf('<ListSection title={h.sections.privacy}>');
    expect(from, 'the Your letters group is on Settings home').toBeGreaterThan(-1);
    expect(to, 'Privacy and security follows it').toBeGreaterThan(from);
    return s.slice(from, to);
  }

  /** The row element and the text just before and after it. */
  function eraseRow() {
    const s = home();
    expect(s.split(rowLabel), 'one row names the Erase everything label').toHaveLength(2);
    const at = s.indexOf(rowLabel);
    const start = s.lastIndexOf('<ListRow', at);
    const end = s.indexOf('/>', at) + 2;
    return { element: s.slice(start, end), before: s.slice(0, start), after: s.slice(end) };
  }

  it('the row is there: the Erase everything label, destructive, testID settings.erase, opening ROUTES.erase', () => {
    expect(typeof en.settings.erase.rowLabel).toBe('string');
    expect(en.settings.erase.rowLabel.length).toBeGreaterThan(0);
    const { element } = eraseRow();
    expect(element).toMatch(/^<ListRow\s/);
    expect(element).toContain(`title={${rowLabel}}`);
    expect(element).toContain('variant="destructive"');
    expect(element).toContain('testID="settings.erase"');
    expect(element).toContain('onPress={go(ROUTES.erase)}');
  });

  it('only a phone that never signed in sees it: the row is the body of localDeletionAllowed() and nothing else', () => {
    const { before, after } = eraseRow();
    expect(home()).toMatch(/import \{[^}]*\blocalDeletionAllowed\b[^}]*\} from '@\/lib\/store';/);
    expect(before.trimEnd().endsWith('{localDeletionAllowed() ? ('), 'the row opens a localDeletionAllowed() branch').toBe(true);
    expect(after.trimStart().startsWith(') : null}'), 'and shows nothing otherwise').toBe(true);
  });

  it('it sits inside Your letters (before Privacy and security), after the Storage row', () => {
    const group = lettersGroup();
    const erase = group.indexOf(rowLabel);
    const storage = group.indexOf('onPress={go(ROUTES.storage)}');
    expect(erase, 'the Erase everything row is in the Your letters group').toBeGreaterThan(-1);
    expect(storage, 'the Storage row is in the Your letters group').toBeGreaterThan(-1);
    expect(erase).toBeGreaterThan(storage);
  });

  it("ROUTES.erase is '/settings/erase' and that screen exists", () => {
    expect(home()).toMatch(/const ROUTES = \{[^}]*\berase: '\/settings\/erase',[^}]*\} as const;/);
    expect(existsSync(join(__dirname, '..', 'src/app/settings/erase.tsx')), 'src/app/settings/erase.tsx exists').toBe(true);
  });
});

// ---- a picture goes with its letter, its book and everything (NS-01-R16, ADR 0028 D5) --------------------------------
// Behavioural, against the real erase, sweep and store: these replace source scans that a commented-out call or a kept
// folder could pass (#835 reviews A N3 and B note 2).
describe('[NS-01-R16c][ADR 0028 D5] every erase path takes a picture, the file first and then its row', () => {
  const PHOTOS = () => photosDirectory().uri.replace(/\/$/, '');
  /** A stored picture for an owner, as commitPhoto leaves it: the file in photos/, then its row. */
  const picture = (owner: string, media: string) => {
    const uri = put(h.disk, `${PHOTOS()}/${media}.jpg`, 3000);
    entryMediaStore(db).put({ entryId: owner, mediaId: media, ext: 'jpg', bytes: 3000, sha256: 'ab', width: 4, height: 4, text: 'Rain boots', place: 'the back step', addedAt: '2026-10-03T09:00:00Z', deletedAt: null });
    return uri;
  };
  const mediaRows = () => db.all<{ id: string }>('SELECT id FROM entry_media ORDER BY id').map((r) => r.id);

  it('[NS-01-R16c] Erase now on a letter, a letter erased on another phone and Erase now on a book take their pictures; the other book keeps its own; the launch sweep empties the picker cache', async () => {
    let app = await launch();
    const f = family(app);
    const a2 = picture(f.ids.a2, 'mA2');
    const a1 = picture(f.ids.a1, 'mA1');
    const avi = picture(f.ids.v1, 'mV1');
    db.run("UPDATE entries SET sync_state = 'erased' WHERE id = ?", f.ids.a2); // erased on another phone
    expect(app.erase.finishErasedLetters()).toBe(1);
    expect([has(a2), has(a1)]).toEqual([false, true]);
    app.store.deleteEntry(f.ids.a1);
    expect(app.erase.eraseDeletedLetter(f.ids.a1)).toBe(true); // Erase now
    expect(has(a1)).toBe(false);
    const draft = picture(f.draftId, 'mD');
    app.store.deleteBook(f.asha);
    expect(app.erase.eraseDeletedBook(f.asha)).toBe(true);
    expect([has(draft), has(avi)]).toEqual([false, true]);
    expect(mediaRows()).toEqual(['mV1']);
    const picked = put(h.disk, `${h.disk.caches}ImagePicker/0A1B2C3D-0000-4000-8000-0000000000P1.img`, 10);
    app = await launch();
    await app.sweep.runLaunchSweep();
    await vi.waitFor(() => expect(has(picked)).toBe(false)); // the photo sweep is not awaited by launch
    expect(fetches).toBe(0);
  });

  it('[NS-01-R16c] the 30 day purge takes a deleted letter\'s picture, and the day-30 book purge a deleted book\'s, in the purge itself; a live letter keeps its own (#836 reviews)', async () => {
    let app = await launch();
    const f = family(app);
    const a2 = picture(f.ids.a2, 'mA2'); // in Recently deleted from T0
    const avi = picture(f.ids.v1, 'mV1');
    const a1 = picture(f.ids.a1, 'mA1');
    app.store.deleteBook(f.avi);
    for (const day of [30, 31]) {
      vi.setSystemTime(T0 + day * DAY + 1000);
      app = await launch();
      await app.sweep.runLaunchSweep();
    }
    // Asserted before the photo sweep (which launch does not await) could tidy up: the purge's own eraser took them.
    expect([has(a2), has(avi), has(a1), mediaRows()]).toEqual([false, false, true, ['mA1']]);
  });

  it('[NS-01-R16c] the eraser removes the file first and then the row: a picture file that will not go keeps its row and its letter for the next try (#836 review B Q2)', async () => {
    const app = await launch();
    const f = family(app);
    const p = picture(f.ids.a2, 'mA2');
    h.disk.undeletable.add(p);
    expect(app.erase.eraseDeletedLetter(f.ids.a2)).toBe(false);
    expect([has(p), mediaRows(), rowKept(f.ids.a2)]).toEqual([true, ['mA2'], true]);
    h.disk.undeletable.delete(p);
    expect(app.erase.eraseDeletedLetter(f.ids.a2)).toBe(true);
    expect([has(p), mediaRows()]).toEqual([false, []]);
  });

  it('[NS-01-R16c][NX-39-R31] Erase everything removes the photos folder itself (strays too) and both caches, even when no row eraser touches a picture', async () => {
    const app = await launch();
    const f = family(app);
    const files = [picture(f.ids.a1, 'mA1'), picture(f.draftId, 'mD'), put(h.disk, `${PHOTOS()}/stray.jpg`, 10)];
    files.push(put(h.disk, `${h.disk.caches}ImagePicker/0A1B2C3D-0000-4000-8000-0000000000P1.img`, 10));
    files.push(put(h.disk, `${h.disk.caches}ScribePhoto/0A1B2C3D-0000-4000-8000-0000000000P2.jpg`, 10));
    expect(app.store.eraseEverythingLocal(() => {}, app.all.eraseDeviceFiles)).toBe('erased');
    expect(files.filter(has)).toEqual([]);
    expect(h.disk.dirs.has(PHOTOS())).toBe(false);
    expect(mediaRows()).toEqual([]);
  });

  it('[ADR 0028 D5] Let it go and deleteDraft take a draft\'s picture at once, the file first and then its row; a draft not being let go keeps its own', async () => {
    const app = await launch();
    const f = family(app);
    const file = picture(f.draftId, 'mD');
    expect(app.store.finishDiscard(f.draftId)).toBe(false); // not marked for Let it go: nothing goes
    expect(has(file)).toBe(true);
    // The steps Review's Let it go and Listen's Discard run (BL-924).
    const steps = { beginDiscard: app.store.beginDiscard, deleteFile: (u: string) => void h.disk.files.delete(u), finishDiscard: app.store.finishDiscard };
    expect(letItGo(f.draftId, f.draft, steps)).toBe(true);
    expect([has(file), mediaRows()]).toEqual([false, []]);
    const typed = app.store.createDraft({ childId: f.asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: 0, state: 'ready' });
    const second = picture(typed.id, 'mT');
    app.store.deleteDraft(typed.id); // Write's emptied draft
    expect([has(second), mediaRows()]).toEqual([false, []]);
  });

  it('[NS-01-R16c][BL-1665] a draft whose picture was stored at recording start (BL-955) takes it along when it is let go: the file first, then its row, and the draft is gone', async () => {
    const app = await launch();
    const f = family(app);
    const { adoptPending } = await import('../src/lib/photos/adopt');
    const { photoDeps } = await import('../src/lib/photos/device');
    const { PendingPhoto } = await import('../src/lib/photos/pending');
    const { makeJpeg } = await import('./photos-helpers');
    const A = 'file:///c/ImagePicker/asha.jpg';
    const original = new Map([[A, makeJpeg({ exif: true })]]);
    const pending = new PendingPhoto({
      read: async (u) => original.get(u)!,
      remove: async (u) => void original.delete(u),
      sweep: async () => void original.clear(),
    });
    await pending.set({ uri: A });
    await adoptPending(pending, photoDeps, f.draftId, '', false); // the call Listen makes when recording starts
    const stored = db.all<{ id: string }>('SELECT id FROM entry_media WHERE draft_id = ?', f.draftId);
    expect(stored).toHaveLength(1);
    const file = `${PHOTOS()}/${stored[0].id}.jpg`;
    expect(has(file)).toBe(true);
    const steps = { beginDiscard: app.store.beginDiscard, deleteFile: (u: string) => void h.disk.files.delete(u), finishDiscard: app.store.finishDiscard };
    expect(letItGo(f.draftId, f.draft, steps)).toBe(true);
    expect([has(file), mediaRows(), app.store.getDraft(f.draftId)]).toEqual([false, [], null]);
  });

  it('[NS-01-R16c][review B on #839] a picture that will not erase never makes deleteDraft throw into the screen: the draft goes and the launch sweep finishes the picture', async () => {
    let app = await launch();
    const f = family(app);
    const typed = app.store.createDraft({ childId: f.asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: 0, state: 'ready' });
    const file = picture(typed.id, 'mT');
    app.store.setDraftPictureEraser(() => {
      throw new Error('disk');
    });
    expect(() => app.store.deleteDraft(typed.id)).not.toThrow();
    expect(app.store.getDraft(typed.id)).toBeFalsy(); // the draft is gone
    expect([has(file), mediaRows()]).toEqual([true, ['mT']]); // the picture is not: yet
    app = await launch();
    await app.sweep.runLaunchSweep();
    await vi.waitFor(() => expect([has(file), mediaRows()]).toEqual([false, []]));
  });

  it('[ADR 0028 D1] Keep moves a draft\'s picture to the letter inside the letter\'s own transaction: a failed Keep leaves it the draft\'s', async () => {
    const app = await launch();
    const asha = app.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    const d = app.store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: 0, state: 'ready' });
    const file = picture(d.id, 'mDraft');
    const kept = letter({ id: d.id, childId: asha, captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, finalText: 'Asha, the first snow.' });
    const owner = () => db.get('SELECT entry_id, draft_id FROM entry_media WHERE id = ?', 'mDraft');
    // The letter cannot be written, then the move itself cannot be made: either way nothing of Keep stays.
    for (const fail of ['BEFORE INSERT ON entries', 'BEFORE UPDATE ON entry_media']) {
      db.run(`CREATE TRIGGER keep_fails ${fail} BEGIN SELECT RAISE(ABORT, 'disk'); END`);
      expect(() => app.store.saveLetterFromDraft(d.id, kept), fail).toThrow();
      db.run('DROP TRIGGER keep_fails');
      expect([rowKept(d.id), owner()], fail).toEqual([false, { entry_id: null, draft_id: d.id }]);
    }
    app.store.saveLetterFromDraft(d.id, kept);
    expect(owner()).toEqual({ entry_id: d.id, draft_id: null });
    expect(has(file)).toBe(true);
  });
});

describe('[B5-4] Erase everything deletes every backup state file inside eraseDeviceFiles() (CR-71 B5)', () => {
  const ASHA_A = 'backup-3f2b8c1e-5d4a-4e7b-9c60-1a2b3c4d5e6f.db';
  const ASHA_B = 'backup-7a1c9d2e-0b3f-4a5d-8e6c-2f1a0b9c8d7e.db';
  const sqlite = (n: string) => `${h.disk.documents}SQLite/${n}`;
  const seed = () => {
    for (const n of [ASHA_A, `${ASHA_A}-wal`, `${ASHA_A}-shm`, ASHA_B, `${ASHA_B}-journal`]) put(h.disk, sqlite(n), 64);
  };

  it('every account\'s file and sidecar goes, scribe.db stays, and an open handle is closed first', async () => {
    const app = await launch();
    const files = await import('../src/lib/backup/files');
    const atClose: boolean[] = [];
    files.registerBackupHandleCloser((id) => void atClose.push(id === null && has(sqlite(ASHA_A))));
    seed();
    app.all.eraseDeviceFiles();
    expect(atClose).toEqual([true]); // the handle closed while the file still existed
    expect(namesIn(h.disk, `${h.disk.documents}SQLite`).filter((n) => n.startsWith('backup-'))).toEqual([]);
    expect(has(sqlite('scribe.db')) && has(sqlite('scribe.db-wal'))).toBe(true);
  });

  it('a file that will not go makes the erase throw, so the rows stay and the next try repeats it', async () => {
    const app = await launch();
    seed();
    h.disk.undeletable.add(sqlite(ASHA_A));
    expect(() => app.all.eraseDeviceFiles()).toThrow('backup_file_delete');
    h.disk.undeletable.clear();
    app.all.eraseDeviceFiles();
    expect(has(sqlite(ASHA_A))).toBe(false);
  });

  it('a folder that cannot be listed while a backup file exists: the erase throws (typed) and stays pending', async () => {
    const app = await launch();
    const files = await import('../src/lib/backup/files');
    seed();
    h.disk.unreadable.add(`${h.disk.documents}SQLite`);
    let err: unknown;
    try {
      app.all.eraseDeviceFiles();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect(has(sqlite(ASHA_A))).toBe(true); // nothing was claimed deleted
    h.disk.unreadable.clear();
    app.all.eraseDeviceFiles(); // the retry finishes
    expect(has(sqlite(ASHA_A))).toBe(false);
    expect(files.deleteBackupFiles()).toEqual({ deleted: 0, failed: 0 });
  });

  it('the failure is the typed BackupFileDeleteFailed with a stable code, not a bare Error', async () => {
    const app = await launch();
    const files = await import('../src/lib/backup/files');
    seed();
    h.disk.undeletable.add(sqlite(ASHA_A));
    let err: unknown;
    try {
      app.all.eraseDeviceFiles();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(files.BackupFileDeleteFailed);
    expect((err as { code: string }).code).toBe('backup_file_delete');
  });

  it('a recording that will not delete still leaves no backup file (it goes first), and the erase throws', async () => {
    const app = await launch();
    seed();
    const rec = take('A1');
    h.disk.undeletable.add(rec);
    expect(() => app.all.eraseDeviceFiles()).toThrow();
    expect(namesIn(h.disk, `${h.disk.documents}SQLite`).filter((n) => n.startsWith('backup-'))).toEqual([]);
  });

  // Two steps that each hold their own failure (NS-47-R16 days file, B5-4 backup file): one failing must never skip the other.
  describe('a days file and a backup file together: one that will not go never skips the other', () => {
    const daysFile = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/days/days.v1.json`;
    const backupLeft = () => namesIn(h.disk, `${h.disk.documents}SQLite`).filter((n) => n.startsWith('backup-'));

    it('the days file will not go: the backup file and the recording are still deleted, the erase throws, and the mark stays', async () => {
      const app = await launch();
      seed();
      put(h.disk, daysFile(), 80);
      const rec = take('A1');
      h.disk.undeletable.add(daysFile());
      expect(app.store.eraseEverythingLocal(app.erase.eraseAudioFile, app.all.eraseDeviceFiles)).toBe('incomplete');
      expect(backupLeft()).toEqual([]);
      expect(has(rec)).toBe(false);
      expect(has(daysFile())).toBe(true);
      expect(app.store.eraseEverythingPending()).toBe(true);
      expect(() => app.all.eraseDeviceFiles()).toThrow(); // and a direct call throws
      h.disk.undeletable.clear();
      app.all.eraseDeviceFiles(); // the retry finishes
      expect(has(daysFile())).toBe(false);
    });

    it('the backup file will not go: the days file is still erased, the erase throws (backup_file_delete), and the mark stays', async () => {
      const app = await launch();
      seed();
      put(h.disk, daysFile(), 80);
      h.disk.undeletable.add(sqlite(ASHA_A));
      expect(() => app.all.eraseDeviceFiles()).toThrow('backup_file_delete');
      expect(has(daysFile())).toBe(false);
      expect(app.store.eraseEverythingLocal(app.erase.eraseAudioFile, app.all.eraseDeviceFiles)).toBe('incomplete');
      expect(app.store.eraseEverythingPending()).toBe(true);
      h.disk.undeletable.clear();
      app.all.eraseDeviceFiles();
      expect(has(sqlite(ASHA_A))).toBe(false);
    });
  });

  it('[B5-6] a Keychain that will not drop the upload tokens holds the erase: the rest runs, the mark stays, finish is not reached, and a retry finishes', async () => {
    const app = await launch();
    const tokens = await import('../src/lib/backup/token-vault');
    h.keychain.set(tokens.BACKUP_TOKENS_KEY, '{"a:b":"asha-token"}');
    h.failRemoveKey = tokens.BACKUP_TOKENS_KEY;
    await expect(app.all.eraseEverything()).rejects.toThrow('keychain locked');
    expect(app.store.eraseEverythingPending()).toBe(true); // finishEraseEverything was not reached
    expect(h.calls).toContain('reminders:forget'); // the other steps still ran
    expect(h.keychain.has(tokens.BACKUP_TOKENS_KEY)).toBe(true);
    h.failRemoveKey = null;
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(app.store.eraseEverythingPending()).toBe(false);
    expect(h.keychain.has(tokens.BACKUP_TOKENS_KEY)).toBe(false);
  });

  it('a phone with no backup file erases as before', async () => {
    const app = await launch();
    expect(() => app.all.eraseDeviceFiles()).not.toThrow();
    expect(has(sqlite('scribe.db'))).toBe(true);
  });
});

// T7-31, T2-044 (docs/qa/test-plan-b13): a kill after each step of the erase sequence in erase-everything.ts and store.ts.
describe('[NS-36] kill during Erase resumes and finishes', () => {
  const daysFile = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/days/days.v1.json`;
  const sqlite = (n: string) => `${h.disk.documents}SQLite/${n}`;
  const BACKUP = 'backup-3f2b8c1e-5d4a-4e7b-9c60-1a2b3c4d5e6f.db';
  const backupLeft = () => namesIn(h.disk, `${h.disk.documents}SQLite`).filter((n) => n.startsWith('backup-'));

  /** Asha's and Avi's books, every kind of copy on the disk, and every Keychain item the erase clears. */
  async function phone() {
    const app = await launch();
    const f = family(app);
    app.store.ledgerDb().raiseTo(2);
    await app.ledger.syncLedger(app.store.ledgerDb());
    app.store.setSetting('ageGate.passed', '1');
    app.store.setSetting('appLock.enabled', 'on');
    const copies = [
      put(h.disk, `${h.disk.documents}recording-5D2E0F11-0000-4000-8000-0000000057A2.m4a`, 8_000),
      put(h.disk, `${h.disk.caches}whole-frames-abc-1.aac`, 4_000),
      put(h.disk, `${h.disk.caches}exports/early-letters-2026-10-03.zip`, 9_000),
      put(h.disk, `${h.disk.caches}recovery-export/recovery-2026-10-03.zip`, 9_000),
      put(h.disk, `${h.disk.caches}Print/0A1B2C3D-0000-4000-8000-00000000F00D.pdf`, 12_000),
      put(h.disk, daysFile(), 80),
      put(h.disk, sqlite(BACKUP), 64),
      put(h.disk, sqlite(`${BACKUP}-wal`), 64),
    ];
    h.keychain.set('scribe.auth.pendingName', 'Mama');
    h.keychain.set('scribe.auth.appleUser', 'stand-in.apple.user');
    h.keychain.set('scribe.auth.deviceId', 'ab'.repeat(32));
    return { app, f, copies, all: [f.a1, f.a2, f.draft, f.v1, ...copies] };
  }

  const tablesLeft = () =>
    db
      .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .map((r) => [r.name, rows(r.name)] as const)
      .filter(([t, n]) => n > 0 && t !== 'settings');
  const settingKeys = () => db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key).sort();

  /** After the relaunch: nothing is left in any store, nothing comes back, and the mark is gone. */
  async function expectNothingLeft(next: App, files: string[]) {
    expect(tablesLeft()).toEqual([]);
    expect(files.filter(has)).toEqual([]);
    expect(backupLeft()).toEqual([]);
    expect([...h.keychain.keys()]).toEqual([]);
    expect(await next.ledger.lettersKept(next.store.ledgerDb())).toBe(0);
    expect(next.store.eraseEverythingPending()).toBe(false);
    expect(next.store.getFamily()).toBeNull();
    expect(next.store.listChildren()).toEqual([]);
    expect(await next.sweep.runLaunchSweep()).toEqual({});
    expect(settingKeys().filter((k) => !['db.secureDeleteVacuumAt', 'lastLaunchAt'].includes(k))).toEqual([]); // the launch writes only its own
    expect(fetches).toBe(0);
  }

  // The steps, in order (erase-everything.ts header, store.ts eraseEverythingLocal). Each kills the process right after the step.
  type Kill = { step: string; rowsGone: boolean; run: (app: App) => Promise<unknown> };
  const kills: Kill[] = [
    {
      step: 'after the pending mark, before any file',
      rowsGone: false,
      run: async (app) => app.store.eraseEverythingLocal(() => { throw new Error('killed'); }, app.all.eraseDeviceFiles),
    },
    {
      step: 'after the first recording file, before the rest',
      rowsGone: false,
      run: async (app) => {
        let n = 0;
        return app.store.eraseEverythingLocal((u, id) => { if (n++ === 1) throw new Error('killed'); app.erase.eraseAudioFile(u, id); }, app.all.eraseDeviceFiles);
      },
    },
    {
      step: 'after every recording file, before the days, backup and cache copies',
      rowsGone: false,
      run: async (app) => app.store.eraseEverythingLocal(app.erase.eraseAudioFile, () => { throw new Error('killed'); }),
    },
    {
      step: 'after every file, before any row',
      rowsGone: false,
      run: async (app) =>
        app.store.eraseEverythingLocal(app.erase.eraseAudioFile, () => {
          app.all.eraseDeviceFiles();
          throw new Error('killed');
        }),
    },
    { step: 'after the rows, before the Keychain', rowsGone: true, run: async (app) => app.store.eraseEverythingLocal(app.erase.eraseAudioFile, app.all.eraseDeviceFiles) },
    {
      step: 'after the invite link and the free-letter count, before the reminders',
      rowsGone: true,
      run: async (app) => { h.killAt = 'invite'; return app.all.eraseEverything().catch(() => 'killed'); },
    },
    {
      step: 'after the reminders, before the pending mark goes',
      rowsGone: true,
      run: async (app) => { h.killAt = 'reminders'; return app.all.eraseEverything().catch(() => 'killed'); },
    },
  ];

  for (const k of kills) {
    it(`[NS-36] killed ${k.step}: the next launch finishes it, nothing half-erased is visible, nothing comes back`, async () => {
      const { app, all } = await phone();
      await k.run(app);
      h.killAt = null;
      expect(app.store.eraseEverythingPending()).toBe(true); // the mark outlives every step
      if (k.rowsGone) expect(tablesLeft()).toEqual([]);

      const next = await launch(); // the process died; the same disk, database and Keychain are opened again
      const resumed = next.all.resumeEraseAtLaunch();
      // Files and rows go inside the call, so the first frame reads an empty store, before the Keychain steps are awaited.
      expect(rows('entries') + rows('drafts') + rows('children')).toBe(0);
      expect(all.filter(has)).toEqual([]);
      expect(await resumed).toBe('erased');
      await expectNothingLeft(next, all);
    });
  }

  it('[NS-47-R16] erase scan finds nothing: a kill after the rows, with the days file and a leftover setting key, is finished', async () => {
    const { app } = await phone();
    app.store.setSetting('days.dismissedOn', '2026-10-02'); // a key left in settings (T2-044 mutant)
    await kills[4].run(app);
    expect(has(daysFile())).toBe(false);
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    expect(next.store.getSetting('days.dismissedOn')).toBeNull();
    expect(has(daysFile())).toBe(false);
    await expectNothingLeft(next, [daysFile()]);
  });

  it('[NS-36] positive control: a launch with no pending erase leaves everything exactly as it was', async () => {
    const { app, all } = await phone();
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBeNull();
    expect(all.filter((u) => !has(u))).toEqual([]);
    expect(rows('entries')).toBe(4);
    expect(h.keychain.has('earlyletters.letters.keptEver')).toBe(true);
    expect(app.store.eraseEverythingPending()).toBe(false);
    await expect(expectNothingLeft(next, all)).rejects.toThrow(); // the check itself is not vacuous
  });

  it('[NS-36] mutant (clear the marker before the stores): a kill after the mark is cleared is never finished, and the checks catch it', async () => {
    const { app, all } = await phone();
    await kills[0].run(app);
    app.store.finishEraseEverything(); // the mutant: the mark goes before the stores are empty
    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBeNull();
    await expect(expectNothingLeft(next, all)).rejects.toThrow();
    expect(rows('entries')).toBe(4); // the letters are still there, which is the harm
  });

  it('[NS-36] idempotent: a second resume in the same process is the same answer, and a third launch finds nothing to do', async () => {
    const { app, all } = await phone();
    await kills[5].run(app);
    h.killAt = null;
    const next = await launch();
    const first = next.all.resumeEraseAtLaunch();
    expect(next.all.resumeEraseAtLaunch()).toBe(first); // once per process
    expect(await first).toBe('erased');
    expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
    const third = await launch();
    expect(await third.all.resumeEraseAtLaunch()).toBeNull();
    await expectNothingLeft(third, all);
  });

  it('[NS-36] idempotent: every step run again on an erased phone changes nothing and throws nothing', async () => {
    const { app, all } = await phone();
    expect(await app.all.eraseEverything()).toBe('erased');
    expect(() => app.all.eraseDeviceFiles()).not.toThrow();
    expect(() => app.all.eraseDeviceFiles()).not.toThrow();
    expect(await app.all.eraseEverything()).toBe('erased'); // the page's button pressed again
    await expectNothingLeft(app, all);
  });

  it('[NS-36] a kill during the resume itself (the second kill) is finished by the third launch', async () => {
    const { app, all } = await phone();
    await kills[1].run(app);
    h.killAt = 'reminders';
    const second = await launch();
    expect(await second.all.resumeEraseAtLaunch()).toBe('incomplete'); // killed again in the Keychain and reminder steps
    h.killAt = null;
    expect(second.store.eraseEverythingPending()).toBe(true);
    const third = await launch();
    expect(await third.all.resumeEraseAtLaunch()).toBe('erased');
    await expectNothingLeft(third, all);
  });

  describe('[NS-36][B5-4] a backup file that will not go still triggers the copy and export cleanup (the gap left by #1169)', () => {
    const exportsAndCopies = () => [
      `${h.disk.caches}exports/early-letters-2026-10-03.zip`,
      `${h.disk.caches}recovery-export/recovery-2026-10-03.zip`,
      `${h.disk.caches}Print/0A1B2C3D-0000-4000-8000-00000000F00D.pdf`,
      `${h.disk.caches}whole-frames-abc-1.aac`,
    ];

    // BL-1466: erase-everything.ts holds `backupFailure` and throws it after the CACHE_COPIES loop, so the export ZIPs
    // and the print PDF are gone in the same pass.
    it('[NS-36][B5-4] the backup file will not go: the erase throws backup_file_delete AND every export ZIP, print PDF and frame copy is gone', async () => {
      const app = await launch();
      for (const u of exportsAndCopies()) put(h.disk, u, 5_000);
      put(h.disk, sqlite(BACKUP), 64);
      h.disk.undeletable.add(sqlite(BACKUP));
      expect(() => app.all.eraseDeviceFiles()).toThrow('backup_file_delete');
      expect(exportsAndCopies().filter(has)).toEqual([]);
    });

    // BL-1466: when more than one file will not go, every step still runs and the first held failure is thrown in a
    // fixed order: backup, then days, then moments. Two cases pin the order so a swap turns red.
    it('[NS-36][B5-4] the backup file and the days file will not go: every copy is gone and the erase throws backup_file_delete first', async () => {
      const app = await launch();
      for (const u of exportsAndCopies()) put(h.disk, u, 5_000);
      put(h.disk, daysFile(), 80);
      put(h.disk, sqlite(BACKUP), 64);
      h.disk.undeletable.add(sqlite(BACKUP));
      h.disk.undeletable.add(daysFile());
      expect(() => app.all.eraseDeviceFiles()).toThrow('backup_file_delete');
      expect(exportsAndCopies().filter(has)).toEqual([]);
      expect(has(daysFile())).toBe(true);
    });

    it('[NS-36][B5-4] only the days file and the moments file will not go: every copy is gone and the erase throws the days failure first', async () => {
      h.exclusionSticks = true;
      const app = await launch();
      expect(await app.moments.momentsStore.setLabel('2026-10-03', 'Asha at the lake')).toEqual({ ok: true });
      const momentsUris = [...h.disk.files.keys()].filter((u) => u.includes('/moments/'));
      expect(momentsUris).toHaveLength(1); // positive control
      for (const u of exportsAndCopies()) put(h.disk, u, 5_000);
      put(h.disk, daysFile(), 80);
      h.disk.undeletable.add(daysFile());
      h.disk.undeletable.add(momentsUris[0]);
      expect(() => app.all.eraseDeviceFiles()).toThrow('days_file_not_removed');
      expect(exportsAndCopies().filter(has)).toEqual([]);
      expect(has(momentsUris[0])).toBe(true);
    });

    it('[NS-36][B5-4] what is green today: the recordings and the days file are cleaned, the erase throws, the mark stays, and the retry finishes the copies', async () => {
      const app = await launch();
      const rec = take('A1');
      put(h.disk, daysFile(), 80);
      for (const u of exportsAndCopies()) put(h.disk, u, 5_000);
      put(h.disk, sqlite(BACKUP), 64);
      h.disk.undeletable.add(sqlite(BACKUP));
      expect(app.store.eraseEverythingLocal(app.erase.eraseAudioFile, app.all.eraseDeviceFiles)).toBe('incomplete');
      expect([has(rec), has(daysFile())]).toEqual([false, false]);
      expect(app.store.eraseEverythingPending()).toBe(true);
      h.disk.undeletable.clear();
      const next = await launch();
      expect(await next.all.resumeEraseAtLaunch()).toBe('erased');
      expect(exportsAndCopies().filter(has)).toEqual([]);
      expect(backupLeft()).toEqual([]);
    });
  });
});
