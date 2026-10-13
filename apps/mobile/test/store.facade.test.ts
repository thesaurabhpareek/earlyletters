/// <reference types="node" />
/**
 * The store facade (store.ts) over node:sqlite: openStore() results for boot
 * (WS-07), default resolution, table-scoped events, and that store.ts never
 * reaches expo-sqlite. expo-crypto and the native opener are stubbed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { MigrationError, LATEST_VERSION } = await import('../src/lib/db/migrations');

let close: () => void = () => {};
let seq = 0;
const now = () => '2026-10-03T09:00:00.000Z';
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

function openMemory() {
  const h = nodeDb();
  close = h.close;
  return store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId });
}

beforeEach(() => {
  store.closeStore();
});
afterEach(() => {
  store.closeStore();
  close();
  close = () => {};
});

describe('openStore contract (WS-07)', () => {
  it('a fresh database migrates and reports ok', () => {
    expect(openMemory()).toEqual({ ok: true, newer: false, error: null, migration: { from: 0, to: LATEST_VERSION, newer: false } });
    expect(store.localSchemaVersion()).toBe(LATEST_VERSION);
  });

  it('is idempotent once open', () => {
    const first = openMemory();
    expect(store.openStore({ open: () => { throw new Error('should not reopen'); } })).toBe(first);
  });

  it('a file from a newer build reports newer, is left untouched and stays readable', () => {
    const h = nodeDb();
    close = h.close;
    h.db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
    h.db.exec(`PRAGMA user_version = ${LATEST_VERSION + 5}`);
    const r = store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId });
    expect(r).toMatchObject({ ok: false, newer: true, error: null });
    expect(h.db.get<{ user_version: number }>('PRAGMA user_version')!.user_version).toBe(LATEST_VERSION + 5);
    expect(store.getSetting('appearance')).toBeNull();
  });

  it('an open failure is reported without throwing, with a code-only message, and can be retried', () => {
    const r = store.openStore({ open: () => { throw new Error('disk I/O error near "Asha"'); } });
    expect(r.ok).toBe(false);
    expect(r.error?.message).toBe('local_db_open_failed');
    expect(r.migration).toBeNull();
    expect(openMemory().ok).toBe(true);
  });

  it('a migration failure is reported as MigrationError and closes the connection', () => {
    const h = nodeDb();
    close = h.close;
    h.db.exec('CREATE TABLE entries (id TEXT)'); // shape step 2 cannot extend into a valid table
    h.db.exec("CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)");
    h.db.exec('PRAGMA user_version = 1');
    const closed = vi.fn();
    const r = store.openStore({ open: () => ({ db: h.db, close: closed }), now, newId });
    expect(r.ok).toBe(false);
    expect(r.error).toBeInstanceOf(MigrationError);
    expect(r.error?.message).toMatch(/^local_db_migration_failed:\d+$/);
    expect(closed).toHaveBeenCalledOnce();
  });
});

describe('facade behaviour', () => {
  beforeEach(() => {
    openMemory();
  });

  it('the first book becomes active; a saved letter defaults to it and freezes its signature', () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    expect(store.getActiveChildId()).toBe(asha.id);
    store.saveEntry(letter({ childId: undefined, authorSignsAs: undefined }));
    store.updateChild(asha.id, { signsAs: 'Amma' });
    expect(store.listEntries()).toHaveLength(1);
    expect(store.getEntry(letter().id)).toMatchObject({ childId: asha.id, authorSignsAs: 'Mama' });
  });

  it('[MOB-05] subscribeTo entries is not called for a setting; subscribe still is', () => {
    const onEntries = vi.fn();
    const any = vi.fn();
    const off = store.subscribeTo('entries', onEntries);
    store.subscribe(any);
    store.setSetting('appearance', 'dark');
    expect(onEntries).not.toHaveBeenCalled();
    expect(any).toHaveBeenCalledTimes(1);
    store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    store.saveEntry(letter({ childId: undefined }));
    expect(onEntries).toHaveBeenCalledTimes(1);
    off();
  });

  it('[PMOB-02] deleting, editing and undoing through the facade', () => {
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    store.saveEntry(letter({ childId: asha.id }));
    const onEntries = vi.fn();
    store.subscribeTo('entries', onEntries);
    store.deleteEntry(letter().id);
    store.deleteEntry(letter().id); // no-op, no second event
    expect(onEntries).toHaveBeenCalledTimes(1);
    expect(store.setEntryInBook(letter().id, true)).toBe(false);
    expect(() => store.saveEntry(letter({ childId: asha.id, finalText: 'x' }))).toThrow(store.EntryTombstonedError);
    store.undeleteEntry(letter().id);
    expect(store.setEntryInBook(letter().id, true)).toBe(true);
    expect(store.getEntry(letter().id)?.inBook).toBe(true);
  });

  it('a voice-only save from a draft emits for entries and drafts and refuses a missing file', () => {
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    const d = store.createRecordingDraft({ childId: asha.id, promptKey: null, audioUri: 'file:///Documents/recording-3.m4a' });
    const seen: string[][] = [];
    store.subscribeTo(['entries', 'drafts'], (t) => seen.push([...t]));
    expect(() => store.saveVoiceOnlyFromDraft(d, { childId: asha.id, authorSignsAs: 'Mama', inBook: false, engineVersion: 3, audioExists: false })).toThrow(store.AudioMissingError);
    const e = store.saveVoiceOnlyFromDraft(d, { childId: asha.id, authorSignsAs: 'Mama', inBook: false, engineVersion: 3 });
    expect(seen).toEqual([['entries', 'drafts']]);
    expect(store.listWaitingForWords(asha.id).map((x) => x.id)).toEqual([e.id]);
    expect(store.getDraft(d.id)).toBeNull();
  });
});

describe('sync hooks through the facade (D-023)', () => {
  const outbox = () => store.localSqlDb().all<{ type: string; entity_id: string }>('SELECT type, entity_id FROM sync_outbox ORDER BY seq');

  it('queues nothing before the first sign-in', () => {
    openMemory();
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    store.saveEntry(letter({ childId: asha.id }));
    store.setEntryInBook(letter().id, true);
    expect(outbox()).toEqual([]);
  });

  it('queues a letter write in the same transaction once an account owns the phone', () => {
    openMemory();
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    store.setSetting('sync.ownerId', 'user-asha-1');
    store.saveEntry(letter({ childId: asha.id }));
    expect(outbox().map((o) => o.type)).toEqual(['entry.upsert']);
    expect(store.getEntry(letter().id)?.syncState).toBe('pending');
  });

  it('a refused write on a tombstoned letter leaves the queue as it was', () => {
    openMemory();
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    store.setSetting('sync.ownerId', 'user-asha-1');
    store.saveEntry(letter({ childId: asha.id }));
    store.deleteEntry(letter().id); // never reached the server: its queued upload is dropped
    const before = outbox();
    expect(() => store.saveEntry(letter({ childId: asha.id, finalText: 'x' }))).toThrow(store.EntryTombstonedError);
    expect(outbox()).toEqual(before);
  });

  it('books the person left are not listed, and sync columns reach the Child', () => {
    openMemory();
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
    store.localSqlDb().run("UPDATE children SET role = 'contributor', created_by_me = 0 WHERE id = ?", asha.id);
    expect(store.getChild(asha.id)).toMatchObject({ role: 'contributor', createdByMe: false });
    store.localSqlDb().run("UPDATE children SET server_state = 'left' WHERE id = ?", asha.id);
    expect(store.listChildren()).toEqual([]);
  });
});

describe('boundaries (MOB-04)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', 'lib', p), 'utf8');

  it('store.ts does not import expo-sqlite', () => {
    expect(src('store.ts')).not.toMatch(/from ['"]expo-sqlite['"]/);
  });

  it('repositories import no React Native or Expo module except the native opener', () => {
    for (const f of ['children', 'context', 'drafts', 'entries', 'events', 'ids', 'index', 'ledger', 'letters', 'orphans', 'settings', 'types']) {
      expect(src(`db/repos/${f}.ts`), f).not.toMatch(/from ['"](react-native|expo[^'"]*)['"]/);
    }
  });

  it('[D-083] saveLetterFromDraft counts a kept letter in the same transaction, and only a letter', () => {
    const source = src('store.ts');
    expect(source).toMatch(/if \(e\.kind === 'letter'\) ledger\.recordKept\(c, draftId, keychainFloor\(\)\)/);
    // The count is written inside the transaction callback, before the upload is queued.
    expect(source.indexOf('ledger.recordKept')).toBeLessThan(source.indexOf('enqueueEntryUpsert(c.db, draftId'));
  });

  it('keeps every export screens use', () => {
    const names = [
      'addChild', 'createDraft', 'currentUserId', 'deleteDraft', 'deleteEntry', 'dictionaryFor', 'getActiveChild', 'getActiveChildId',
      'getChild', 'getDraft', 'getEntry', 'getFamily', 'getSetting', 'hideChild', 'listChildren', 'listDrafts', 'listEntries',
      'listEntriesForChild', 'listMembers', 'listOrphanAudio', 'saveEntry', 'setActiveChildId', 'setDraftTranscript',
      'setDraftTyped', 'setEntryInBook', 'setRecordingProgress', 'setSetting', 'subscribe', 'todayISO', 'undeleteEntry', 'updateChild', 'uuidv7',
      'deleteSetting', 'unhideChild', 'listHiddenChildren', 'saveFamily', 'saveLetterFromDraft',
      'saveVoiceOnlyFromDraft', 'listWaitingForWords', 'setWordsForWaitingEntry', 'createRecordingDraft', 'finalizeDraftAudio',
      'setDraftAudioHash', 'setDraftChild', 'audioRows', 'rebaseAudioUri', 'reportOrphanAudio', 'reattachOrphanAudio', 'localSchemaVersion',
      'listDeleted', 'eraseEntry', 'purgeExpired', 'recordLaunch', 'countUnrecoverableTakes', 'erasesAt',
      'AudioMissingError', 'localSqlDb', 'ledgerDb', 'notifyStoreChanged', 'subscribeTo', 'openStore', 'closeStore',
    ];
    for (const n of names) expect(typeof (store as Record<string, unknown>)[n], n).toBe('function');
  });
});
