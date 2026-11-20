/// <reference types="node" />
/**
 * Find wired into the app's writes (NS-02-R16a, R16b, R16d, R18, R43): the repos and the sync engine move the index in
 * the letter's own transaction, Erase everything and Delete this book take it with them, and a build with Find off makes
 * nothing of Find and drops what an earlier build made. Moved from #798's find-lifecycle.test.ts; the store now runs the
 * batched rebuild (slice 5). Real SQLite with FTS5 (node:sqlite). Fictional Asha family only.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { children, entries, wipe } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { setFindForTest } from '../src/lib/find/flag';
import { ensureSearchIndex, FIND_DIRTY_SETTING, FIND_SECURE_SETTING, SEARCH_ROWS_TABLE, SEARCH_TABLE } from '../src/lib/find/lifecycle';
import { rebuildSearchIndex } from '../src/lib/find/rebuild';
import { searchLetters, type FindResult } from '../src/lib/find/search';
import * as store from '../src/lib/store';
import { createSyncEngine } from '../src/lib/sync/engine';
import { takeOwnership } from '../src/lib/sync/ownership';
import type { PullResponse, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { findFixture, type FindFixture } from './find-fixture';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
// Wrapped so the switch-off tests can say the rebuild was never asked for; every call still runs the real one.
vi.mock('../src/lib/find/rebuild', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/find/rebuild')>();
  return { ...real, rebuildSearchIndex: vi.fn(real.rebuildSearchIndex) };
});

let f: FindFixture;
afterEach(() => {
  f?.close();
  f = undefined as never;
});
const ids = (r: FindResult): string[] => (r.status === 'done' ? r.hits.map((h) => h.id) : []);
const find = (raw: string) => ids(searchLetters(f.db, raw, 'child-asha'));
const mapRows = () => f.db.all<{ entry_id: string }>(`SELECT entry_id FROM ${SEARCH_ROWS_TABLE}`).map((r) => r.entry_id);
const ftsCount = () => f.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${SEARCH_TABLE}`)!.n;

describe('[NS-02-R16a] the repos move the index with the letter', () => {
  it('[NS-02-R16a] Keep adds; a Review edit and an Undo change the words; delete and restore; words that arrive later; own private stays', () => {
    f = findFixture();
    const id = f.add({ text: 'The ducks were loud.' });
    expect(find('ducks')).toEqual([id]);
    entries.replaceWords(f.ctx, id, { final_text: 'The geese were loud.', machine_edits: [], edit_level: 'verbatim' });
    expect([find('ducks'), find('geese')]).toEqual([[], [id]]);
    entries.replaceWords(f.ctx, id, { final_text: 'The ducks were loud.', machine_edits: [], edit_level: 'clean' });
    expect([find('ducks'), find('geese'), ftsCount(), mapRows()]).toEqual([[id], [], 1, [id]]);
    expect(entries.tombstone(f.ctx, id)).toBe(true);
    expect([find('ducks'), mapRows()]).toEqual([[], []]);
    expect(entries.undelete(f.ctx, id)).toBe(true);
    expect(find('ducks')).toEqual([id]);
    entries.setInBook(f.ctx, id, false);
    expect(find('ducks')).toEqual([id]);
    const waiting = f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken', rawTranscript: '' });
    entries.setWordsOnce(f.ctx, waiting, { rawTranscript: 'the harbour', machineEdits: [], finalText: 'The harbour.', editLevel: 'clean', engineVersion: 5 });
    const silent = f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken', rawTranscript: '' });
    entries.setTypedWordsOnce(f.ctx, silent, 'Typed beside the window.');
    expect([find('harbour'), find('window')]).toEqual([[waiting], [silent]]);
  });

  it('[NS-02-R16d] a purged letter never returns: erasing the row leaves nothing in the index or the map', () => {
    f = findFixture();
    const id = f.add({ text: 'The lighthouse blinked.' });
    entries.tombstone(f.ctx, id);
    expect(entries.eraseRow(f.ctx, id)).toBe(true);
    expect([find('lighthouse'), mapRows(), ftsCount()]).toEqual([[], [], 0]);
  });

  it('[NS-02-R16b][NS-02-R16c] hiding a book purges its letters from the index, not just the results; unhiding brings them back', () => {
    f = findFixture();
    const a = f.add({ text: 'The orchard smelled of rain.' });
    children.hide(f.ctx, 'child-asha');
    expect([find('orchard'), mapRows()]).toEqual([[], []]);
    children.unhide(f.ctx, 'child-asha');
    expect([find('orchard'), mapRows()]).toEqual([[a], [a]]);
    wipe.markDeleted(f.ctx, 'child-asha');
    expect(mapRows()).toEqual([]);
  });
});

describe('[NS-02-R18] Erase everything and Delete this book', () => {
  it('[NS-02-R18] removeEverything drops the index (never row-deletes it), and the next ensure makes it again, empty and usable', () => {
    f = findFixture();
    f.add({ text: 'The lantern was lit.' });
    f.db.transaction(() => wipe.removeEverything(f.ctx));
    expect(f.db.get('SELECT name FROM sqlite_master WHERE name LIKE ?', 'letter_search%')).toBeNull();
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(ftsCount()).toBe(0);
  });

  it('[NS-02-R18] deleting a whole book takes its letters out of the index in the same transaction', () => {
    f = findFixture();
    f.add({ text: 'The lantern was lit.' });
    f.db.transaction(() => wipe.removeBook(f.ctx, 'child-asha'));
    expect([mapRows(), ftsCount()]).toEqual([[], 0]);
  });
});

describe('[NS-02-R16a] a letter from the other parent, through the real sync engine', () => {
  const ME = '11111111-1111-1111-1111-111111111111';
  const NOW = Date.parse('2026-10-20T19:00:00.000Z');
  const iso = new Date(NOW).toISOString();
  let n = 0;
  const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
  const row = (id: string, over: Record<string, unknown>) => ({
    id, child_id: 'child-asha', author_id: '22222222-2222-2222-2222-222222222222', author_signs_as: 'Papa', kind: 'letter', occurred_on: '2026-10-01',
    captured_at: iso, capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, machine_edits: undefined, final_text: 'x',
    in_book: true, sounds_like_me: null, approval: 'not_needed', audio_kept_on_device: false, created_at: iso, updated_at: iso, deleted_at: null, own: false, v: '400', ...over,
  });
  async function pull(rows: Record<string, unknown>[], ids?: string[]): Promise<void> {
    const book = { id: 'child-asha', access: 'parent', repull: false, meta_hash: 'h', rows, ...(ids ? { ids } : {}), cursor: '999:00000000-0000-0000-0000-000000000000', more: false };
    const s: SupabaseLike = {
      rpc: (fn) => {
        const data = fn === 'sync_push' ? { results: [], paused: false, stopped: false } : ({ reset: false, epoch: 1, epoch_started_at: iso, more: false, gone: [], books: [book] } as unknown as PullResponse);
        return Promise.resolve({ data, error: null, status: 200 } as RpcResult);
      },
    };
    await createSyncEngine({ db: f.db, supabase: s, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false }).sync();
  }

  it('[NS-02-R16a] a pulled letter is found; made private by the other parent it is gone at once; public again it is back; removed, gone', async () => {
    f = findFixture();
    takeOwnership(f.db, ME, { now: iso, newId: id7 });
    f.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('sync.epoch', '1')");
    f.db.run("UPDATE children SET server_state = 'synced' WHERE id = 'child-asha'");
    const id = id7();
    await pull([row(id, { final_text: 'Papa wrote about the windmill.', raw_transcript: undefined })]);
    expect([find('windmill'), mapRows()]).toEqual([[id], [id]]);
    await pull([row(id, { final_text: 'Papa wrote about the windmill.', in_book: false, v: '401' })]);
    expect([find('windmill'), mapRows()]).toEqual([[], []]);
    await pull([row(id, { final_text: 'Papa wrote about the windmill.', in_book: true, v: '402' })]);
    expect(find('windmill')).toEqual([id]);
    await pull([], []);
    expect([find('windmill'), mapRows()]).toEqual([[], []]);
  });
});

describe('[NS-02-R43] a build with Find off makes nothing of Find and drops what an earlier build made', () => {
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  const openWith = (db: SqlDb) => store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-11-19T09:00:00.000Z', newId });
  const findObjects = (db: SqlDb) =>
    db.all<{ name: string }>(`SELECT name FROM sqlite_master WHERE name IN ('${SEARCH_TABLE}', '${SEARCH_ROWS_TABLE}', 'searchable_letters') ORDER BY name`).map((r) => r.name);
  const findSettings = (db: SqlDb) => db.all(`SELECT key FROM settings WHERE key IN ('${FIND_DIRTY_SETTING}', '${FIND_SECURE_SETTING}')`);
  afterEach(() => {
    setFindForTest(null);
    vi.useRealTimers();
    store.closeStore();
  });

  it('[NS-02-R43] with the switch off, opening the store and the catch-up never ask for a rebuild and make no index, view or setting', async () => {
    setFindForTest(false);
    vi.useFakeTimers();
    const h = nodeDb();
    try {
      vi.mocked(rebuildSearchIndex).mockClear();
      expect(openWith(h.db).ok).toBe(true);
      await vi.advanceTimersByTimeAsync(60_000);
      expect([await store.ensureFindIndex(), store.findIndexReady(), findObjects(h.db), findSettings(h.db)]).toEqual(['off', false, [], []]);
      expect(rebuildSearchIndex).not.toHaveBeenCalled();
    } finally {
      h.close();
    }
  });

  it('[NS-02-R43][NS-02-R35] with the switch on the catch-up runs off the first frame; switched off, the next launch drops the index and the view', async () => {
    vi.useFakeTimers();
    const h = nodeDb();
    try {
      setFindForTest(true);
      vi.mocked(rebuildSearchIndex).mockClear();
      expect(openWith(h.db).ok).toBe(true);
      expect(findObjects(h.db)).toEqual([]); // nothing on the path to the first frame
      await vi.advanceTimersByTimeAsync(60_000);
      expect(rebuildSearchIndex).toHaveBeenCalledTimes(1);
      expect([findObjects(h.db), store.findIndexReady()]).toEqual([[SEARCH_TABLE, SEARCH_ROWS_TABLE, 'searchable_letters'].sort(), true]);
      store.closeStore();
      setFindForTest(false);
      vi.mocked(rebuildSearchIndex).mockClear();
      expect(openWith(h.db).ok).toBe(true);
      await vi.advanceTimersByTimeAsync(60_000);
      expect([findObjects(h.db), findSettings(h.db), store.findIndexReady()]).toEqual([[], [], false]);
      expect(rebuildSearchIndex).not.toHaveBeenCalled();
    } finally {
      h.close();
    }
  });
});
