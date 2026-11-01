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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { createDisk, iosContainer, layOutApp, namesIn, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  calls: [] as string[],
  /** The Keychain, as a map that outlives a kill (it survives a reinstall on a real phone). */
  keychain: new Map<string, string>(),
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
  h.keychain = new Map();
  h.disk = createDisk(PHONE);
  layOutApp(h.disk);
  const n = nodeDb();
  db = n.db;
  closeDb = n.close;
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

  it('[F17 6.2 D step 6] the launch purge erases a deleted book after 30 days, not before', async () => {
    let app = await launch();
    const f = family(app);
    app.store.deleteBook(f.asha);
    vi.setSystemTime(T0 + 29 * DAY);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks().map((b) => b.id)).toEqual([f.asha]);
    expect(has(f.a1)).toBe(true);

    vi.setSystemTime(T0 + 30 * DAY + 1000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeletedBooks()).toEqual([]);
    expect([f.a1, f.a2, f.draft].some(has)).toBe(false);
    expect(db.get('SELECT id FROM children WHERE id = ?', f.asha)).toBeNull();
    expect(app.store.listChildren().map((c) => c.name)).toEqual(['Avi']);
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
    const stray = put(h.disk, `${h.disk.documents}recording-5D2E0F11-0000-4000-8000-0000000057A2.m4a`, 8_000);
    const frames = put(h.disk, `${h.disk.caches}whole-frames-abc-1.aac`, 4_000);
    const zip = put(h.disk, `${h.disk.caches}exports/early-letters-2026-10-03.zip`, 9_000);
    const recovery = put(h.disk, `${h.disk.caches}recovery-export/recovery-2026-10-03.zip`, 9_000);
    h.keychain.set('scribe.auth.pendingName', 'Mama'); // an Apple sign-in that never finished
    h.keychain.set('scribe.auth.appleUser', 'stand-in.apple.user');
    return { app, f, stray, frames, zip, recovery };
  }

  function expectEmpty() {
    const tables = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").map((r) => r.name);
    expect(tables.length).toBeGreaterThan(5);
    for (const t of tables) expect([t, rows(t)]).toEqual([t, 0]);
  }

  it('removes every book, letter, draft, recording, copy, export and setting; keeps the speech model; resets the free-letter count; sends nothing', async () => {
    const { app, f, stray, frames, zip, recovery } = await filled();
    expect(await app.all.eraseEverything()).toBe('erased');

    expectEmpty();
    expect([f.a1, f.a2, f.draft, f.v1, stray, frames, zip, recovery].filter(has)).toEqual([]);
    expect(namesIn(h.disk, recorderDir(h.disk))).toEqual([]);
    expect(namesIn(h.disk, `${h.disk.documents}models`)).toEqual(['ggml-large-v3-turbo-q5_0.bin']); // F17 6.2 F step 3
    expect(h.calls).toEqual(expect.arrayContaining(['analytics:stop', 'listening:sweep', 'invite:clear', 'reminders:forget']));
    // D-083, D-103: the free count starts again; the next kept letter is free letter 1. Nothing else stays in the Keychain.
    expect([...h.keychain.keys()]).toEqual([]);
    expect(await app.ledger.lettersKept(app.store.ledgerDb())).toBe(0);
    expect(app.store.eraseEverythingPending()).toBe(false);
    // First run: no book, no age answer.
    expect(app.store.getFamily()).toBeNull();
    expect(app.store.getSetting('ageGate.passed')).toBeNull();
    expect(fetches).toBe(0);

    const next = await launch();
    expect(await next.all.resumeEraseAtLaunch()).toBeNull();
    expect(await next.sweep.runLaunchSweep()).toEqual({});
    // The launch writes only its own time (the purge's clock guard); nothing came back.
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key)).toEqual(['lastLaunchAt']);
    db.run('DELETE FROM settings');
    expectEmpty();
  });

  it('a kill while files are going: the next launch finishes before any screen reads the store, and the sweep re-attaches nothing', async () => {
    const { app, f, stray } = await filled();
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
    expect([f.a1, f.a2, f.draft, f.v1, stray].filter(has)).toEqual([]);
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
