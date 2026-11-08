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
import { en } from '@scribe/content';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OPEN_PRAGMAS } from '../src/lib/db/expo-adapter';
import type { SqlDb } from '../src/lib/db/sql';
import { createDisk, iosContainer, layOutApp, namesIn, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  calls: [] as string[],
  /** The Keychain, as a map that outlives a kill (it survives a reinstall on a real phone). */
  keychain: new Map<string, string>(),
  /** What `appLock.enabled` read when the app lock was asked to read its settings again (null: erased). */
  lockReloads: [] as (string | null)[],
  /** A setting as the store's database holds it right now (set in beforeEach, once the database exists). */
  settingNow: (_key: string): string | null => null,
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
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
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: async () => void h.calls.push('invite:clear') }));
// The app's Keychain wrapper, over the same map as the ledger's Keychain (the auth modules only lend their key names).
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => h.keychain.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.keychain.set(k, v),
    removeItem: async (k: string) => void h.keychain.delete(k),
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
vi.mock('../src/lib/reminders/scheduler', () => ({ forgetReminders: async () => void h.calls.push('reminders:forget') }));
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
  return { store, ledger, erase, sweep, all };
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
    expect(toast).toMatch(/next time it opens/);
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
    const stray = put(h.disk, `${h.disk.documents}recording-5D2E0F11-0000-4000-8000-0000000057A2.m4a`, 8_000);
    const frames = put(h.disk, `${h.disk.caches}whole-frames-abc-1.aac`, 4_000);
    const zip = put(h.disk, `${h.disk.caches}exports/early-letters-2026-10-03.zip`, 9_000);
    const recovery = put(h.disk, `${h.disk.caches}recovery-export/recovery-2026-10-03.zip`, 9_000);
    // expo-print's half-rendered whole-book PDF, left by a kill during an export (Review A on #520 at 79bc4456, note 3).
    const printPdf = put(h.disk, `${h.disk.caches}Print/0A1B2C3D-0000-4000-8000-00000000F00D.pdf`, 12_000);
    h.keychain.set('scribe.auth.pendingName', 'Mama'); // an Apple sign-in that never finished
    h.keychain.set('scribe.auth.appleUser', 'stand-in.apple.user');
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

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBeNull();
    expect(await next.sweep.runLaunchSweep()).toEqual({});
    // The launch writes only its own time (the purge's clock guard) and its one-time rebuild mark; nothing came back.
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key).sort()).toEqual(['db.secureDeleteVacuumAt', 'lastLaunchAt']);
    db.run('DELETE FROM settings');
    expectEmpty();
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
      expect([p, /from '[^']*\/backup(?:\/|')/.test(s)]).toEqual([p, false]);
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
    expect(e.failed).toBe('Erasing did not finish. Try again.');
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
        erase: async () => outcome,
        setPhase: (p) => log.push(`phase:${p}`),
        setFailed: (f) => log.push(`failed:${f}`),
        announceDone: () => log.push('announce'),
      });
      expect(log).toEqual(['failed:null', 'phase:erasing', 'phase:review', `failed:${line}`]);
    }
    const log: string[] = [];
    await runEraseEverything({
      erase: async () => {
        throw new Error('disk');
      },
      setPhase: (p) => log.push(`phase:${p}`),
      setFailed: (f) => log.push(`failed:${f}`),
      announceDone: () => log.push('announce'),
    });
    expect(log).toEqual(['failed:null', 'phase:erasing', 'phase:review', 'failed:failed']);
  });
});
