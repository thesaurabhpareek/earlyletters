/// <reference types="node" />
/**
 * Find's index lifecycle (ADR 0028 D4 and D5; NS-02-R16, R18, R19; design FD-R9): the index moves with the letter in
 * the same transaction, a removed letter is not found at once, and Erase everything drops the index. Real SQLite with
 * FTS5 (node:sqlite); the sync cases run the real engine against a scripted server. Fictional Asha family only.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import { entries, wipe } from '../src/lib/db/repos';
import type { RepoContext } from '../src/lib/db/repos';
import {
  dropSearchIndex,
  ensureSearchIndex,
  FIND_DIRTY_SETTING,
  FIND_SECURE_SETTING,
  forgetSearchState,
  optimizeIfDue,
  reconcileSearch,
  reindexLetter,
  SEARCH_ROWS_TABLE,
  SEARCH_TABLE,
  searchIndexExists,
} from '../src/lib/find/lifecycle';
import { searchLetters, type FindResult } from '../src/lib/find/search';
import { forgetSearchView, registerFindExtraSource, resetFindExtraSources } from '../src/lib/find/sources';
import { createSyncEngine } from '../src/lib/sync/engine';
import { takeOwnership } from '../src/lib/sync/ownership';
import type { PullResponse, PushOp, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { findFixture, type FindFixture } from './helpers/find-fixture';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

let f: FindFixture;
afterEach(() => {
  f?.close();
  f = undefined as never;
  resetFindExtraSources();
});

const ids = (r: FindResult): string[] => (r.status === 'done' ? r.hits.map((h) => h.id) : []);
const find = (raw: string) => ids(searchLetters(f.db, raw, 'child-asha'));
const mapRows = () => f.db.all<{ entry_id: string }>(`SELECT entry_id FROM ${SEARCH_ROWS_TABLE}`).map((r) => r.entry_id);
const ftsCount = () => f.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${SEARCH_TABLE}`)!.n;

describe('[NS-02-R16] the index moves with the letter', () => {
  it('[NS-02-R16] Keep adds the letter; Review edit and Undo of a small fix change its words; no stale word stays', () => {
    f = findFixture();
    const id = f.add({ text: 'The ducks were loud.' });
    expect(find('ducks')).toEqual([id]);
    entries.replaceWords(f.ctx, id, { final_text: 'The geese were loud.', machine_edits: [], edit_level: 'verbatim' });
    expect(find('ducks')).toEqual([]);
    expect(find('geese')).toEqual([id]);
    entries.replaceWords(f.ctx, id, { final_text: 'The ducks were loud.', machine_edits: [], edit_level: 'clean' }); // Undo
    expect(find('ducks')).toEqual([id]);
    expect(find('geese')).toEqual([]);
    expect(ftsCount()).toBe(1);
    expect(mapRows()).toEqual([id]);
  });

  it('[NS-02-R16] delete takes the letter out at once; restore puts it back; both in the same write', () => {
    f = findFixture();
    const id = f.add({ text: 'The lighthouse blinked.' });
    expect(entries.tombstone(f.ctx, id)).toBe(true);
    expect(find('lighthouse')).toEqual([]);
    expect(mapRows()).toEqual([]);
    expect(entries.undelete(f.ctx, id)).toBe(true);
    expect(find('lighthouse')).toEqual([id]);
  });

  it('[NS-02-R16] a purged id never returns: erasing the row leaves nothing in the index or the map', () => {
    f = findFixture();
    const id = f.add({ text: 'The lighthouse blinked.' });
    entries.tombstone(f.ctx, id);
    expect(entries.eraseRow(f.ctx, id)).toBe(true);
    expect(find('lighthouse')).toEqual([]);
    expect(mapRows()).toEqual([]);
    expect(ftsCount()).toBe(0);
    reconcileSearch(f.db);
    expect(find('lighthouse')).toEqual([]);
  });

  it('[NS-02-R16] words that arrive later (a waiting letter) become findable when they are set, and the typed words path does too', () => {
    f = findFixture();
    const waiting = f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken', rawTranscript: '' });
    expect(find('harbour')).toEqual([]);
    entries.setWordsOnce(f.ctx, waiting, { rawTranscript: 'the harbour', machineEdits: [], finalText: 'The harbour.', editLevel: 'clean', engineVersion: 5 });
    expect(find('harbour')).toEqual([waiting]);
    const silent = f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken', rawTranscript: '' });
    entries.setTypedWordsOnce(f.ctx, silent, 'Typed beside the window.');
    expect(find('window')).toEqual([silent]);
  });

  it('[NS-02-R16] an own letter made private stays findable (own private letters are included); it is not purged', () => {
    f = findFixture();
    const id = f.add({ text: 'A private lullaby.' });
    entries.setInBook(f.ctx, id, false);
    expect(find('lullaby')).toEqual([id]);
  });

  it('[NS-02-R16] the index and the letter commit together: a rolled-back write leaves both unchanged', () => {
    f = findFixture();
    const id = f.add({ text: 'The ducks were loud.' });
    expect(() =>
      f.db.transaction(() => {
        entries.replaceWords(f.ctx, id, { final_text: 'The geese were loud.', machine_edits: [], edit_level: 'verbatim' });
        expect(find('geese')).toEqual([id]); // inside the write the index already agrees
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(find('ducks')).toEqual([id]);
    expect(find('geese')).toEqual([]);
  });

  it('[NS-02-R16] a failing index write never loses or refuses the letter; search answers from the scan until the catch-up repairs it', () => {
    f = findFixture();
    f.db.exec(`DROP TABLE ${SEARCH_ROWS_TABLE}`); // the index cannot be written now
    const id = f.add({ text: 'Written while the index was broken.' });
    expect(entries.get(f.ctx, id)?.finalText).toBe('Written while the index was broken.');
    expect(find('broken')).toEqual([id]);
    expect(searchIndexExists(f.db)).toBe(false);
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(searchIndexExists(f.db)).toBe(true);
    expect(mapRows()).toEqual([id]);
    const r = searchLetters(f.db, 'broken', 'child-asha');
    expect(r.status === 'done' && r.path).toBe('index');
  });
});

describe('[NS-02-R16] launch catch-up', () => {
  it('[NS-02-R16] letters written before the index existed are indexed by the catch-up; running it again changes nothing', () => {
    f = findFixture({ index: false });
    const a = f.add({ text: 'Before the index, the kite.' });
    const b = f.add({ text: 'Before the index, the boat.' });
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(mapRows().sort()).toEqual([a, b].sort());
    expect(reconcileSearch(f.db)).toBe(0);
    const r = searchLetters(f.db, 'kite', 'child-asha');
    expect(r.status === 'done' && r.path).toBe('index');
  });

  it('[NS-02-R16] a letter the catch-up finds changed under the index (a write that skipped it) is repaired', () => {
    f = findFixture();
    const id = f.add({ text: 'Old words about the pond.' });
    f.db.run("UPDATE entries SET final_text = 'New words about the river.' WHERE id = ?", id); // as an older build would
    expect(reconcileSearch(f.db)).toBe(1);
    expect(find('pond')).toEqual([]);
    expect(find('river')).toEqual([id]);
  });

  it('[NS-02-R16] an index row that belongs to no letter is removed', () => {
    f = findFixture();
    f.db.run(`INSERT INTO ${SEARCH_TABLE} (body, extra) VALUES ('orphan words', '')`);
    expect(reconcileSearch(f.db)).toBe(1);
    expect(ftsCount()).toBe(0);
  });
});

describe('[NS-02-R16] transitions that other features add: a sealed letter, a typed photo label', () => {
  it('[NS-02-R16] a sealed letter contributes nothing until it opens; opening adds it again', () => {
    f = findFixture();
    f.db.exec('CREATE TABLE sealed_fixture (entry_id TEXT PRIMARY KEY)');
    registerFindExtraSource({ id: 'seal', available: () => true, textSql: 'NULL', visibleSql: 'e.id NOT IN (SELECT entry_id FROM sealed_fixture)' });
    forgetSearchView(f.db);
    ensureSearchIndex(f.db);
    const id = f.add({ text: 'A letter for the eighteenth birthday, with a secret recipe.' });
    expect(find('recipe')).toEqual([id]);
    f.db.run('INSERT INTO sealed_fixture VALUES (?)', id);
    reindexLetter(f.db, id); // the seal's own write calls the one function
    expect(find('recipe')).toEqual([]);
    expect(mapRows()).toEqual([]);
    f.db.run('DELETE FROM sealed_fixture WHERE entry_id = ?', id); // its day arrives
    reindexLetter(f.db, id);
    expect(find('recipe')).toEqual([id]);
  });

  it('[NS-02-R5] parent-typed photo words and a typed place are found; the snippet quotes them, not the letter', () => {
    f = findFixture();
    f.db.exec(`CREATE TABLE entry_media (id TEXT PRIMARY KEY, entry_id TEXT, photo_text TEXT, place TEXT, sha256 TEXT, derived_place TEXT)`);
    forgetSearchView(f.db);
    ensureSearchIndex(f.db);
    const id = f.add({ text: 'We stayed home all day.' });
    f.db.run("INSERT INTO entry_media (id, entry_id, photo_text, place, sha256, derived_place) VALUES ('m1', ?, 'Asha on the red slide', 'Bishop Park', 'abc', 'Mission District')", id);
    reindexLetter(f.db, id);
    expect(find('slide')).toEqual([id]);
    expect(find('bishop')).toEqual([id]);
    expect(find('mission')).toEqual([]); // a place read from the file is not the parent's word
    expect(find('abc')).toEqual([]);
    const r = searchLetters(f.db, 'slide', 'child-asha');
    if (r.status === 'done') {
      expect(r.hits[0].source).toBe('extra');
      expect(r.hits[0].excerpt.text).toContain('red slide');
    }
    // A word in the letter still quotes the letter.
    const r2 = searchLetters(f.db, 'stayed', 'child-asha');
    expect(r2.status === 'done' && r2.hits[0].source).toBe('body');
    // Deleting the letter takes the photo words with it.
    entries.tombstone(f.ctx, id);
    expect(find('slide')).toEqual([]);
  });

  it('[NS-02-R5] a build without photos (no entry_media table) indexes the letter\'s words alone and does not fail', () => {
    f = findFixture();
    const id = f.add({ text: 'Plain words.' });
    expect(f.db.get<{ extra: string }>(`SELECT extra FROM ${SEARCH_TABLE} WHERE rowid = (SELECT row_id FROM ${SEARCH_ROWS_TABLE} WHERE entry_id = ?)`, id)?.extra).toBe('');
  });
});

describe('[NS-02-R18] Erase everything removes the index', () => {
  it('[NS-02-R18] dropping the index first leaves removeEverything a clean file, and the next catch-up makes it again, empty', () => {
    f = findFixture();
    f.add({ text: 'The lantern was lit.' });
    dropSearchIndex(f.db);
    expect(f.db.get('SELECT name FROM sqlite_master WHERE name LIKE ?', 'letter_search%')).toBeNull(); // no shadow table either
    f.db.transaction(() => wipe.removeEverything(f.ctx));
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(ftsCount()).toBe(0);
    expect(find('lantern')).toEqual([]);
  });

  it('[NS-02-R18] removeEverything alone (a path that forgot to drop first) drops the index too and corrupts nothing', () => {
    f = findFixture();
    f.add({ text: 'The lantern was lit.' });
    f.db.transaction(() => wipe.removeEverything(f.ctx));
    expect(f.db.get('SELECT name FROM sqlite_master WHERE name LIKE ?', 'letter_search%')).toBeNull();
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(f.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${SEARCH_TABLE}`)!.n).toBe(0);
    // And the index is usable again.
    insertBook(f.db, { id: 'child-asha' });
    f.add({ text: 'A new lantern.' });
    expect(find('lantern')).toHaveLength(1);
  });

  it('[NS-02-R18] deleting a whole book takes its letters out of the index in the same transaction', () => {
    f = findFixture();
    f.add({ text: 'The lantern was lit.' });
    f.db.transaction(() => wipe.removeBook(f.ctx, 'child-asha'));
    expect(mapRows()).toEqual([]);
    expect(ftsCount()).toBe(0);
  });

  it('[NS-02-R18] the index is derived data on the phone only: no export, backup or sync file names it', () => {
    const root = join(__dirname, '..', 'src', 'lib');
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name) && /^(export|backup|sync)$/.test(dir.split('/').pop() ?? '') && /letter_search|searchable_letters/.test(readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) hits.push(p);
      }
    };
    walk(root);
    // sync/engine.ts calls reconcileSearch (a function), never a table name.
    expect(hits).toEqual([]);
  });
});

describe('[NS-02-R16] a letter from the other parent, through the real sync engine', () => {
  const ME = '11111111-1111-1111-1111-111111111111';
  const PAPA = '22222222-2222-2222-2222-222222222222';
  const NOW = Date.parse('2026-10-20T19:00:00.000Z');
  const iso = new Date(NOW).toISOString();
  let n = 0;
  const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;

  const row = (id: string, child: string, over: Record<string, unknown>) => ({
    id, child_id: child, author_id: PAPA, author_signs_as: 'Papa', kind: 'letter', occurred_on: '2026-10-01', captured_at: iso,
    capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, machine_edits: undefined, final_text: 'x',
    in_book: true, sounds_like_me: null, approval: 'not_needed', audio_kept_on_device: false, created_at: iso, updated_at: iso,
    deleted_at: null, own: false, v: '400', ...over,
  });

  async function pull(db: FindFixture['db'], child: string, rows: Record<string, unknown>[], ids?: string[]): Promise<void> {
    const s: SupabaseLike = {
      rpc: (fn, args = {}) => {
        void (args.p_ops as PushOp[] | undefined);
        const data = fn === 'sync_push'
          ? { results: [], paused: false, stopped: false }
          : ({ reset: false, epoch: 1, epoch_started_at: iso, more: false, gone: [], books: [{ id: child, access: 'parent', repull: false, meta_hash: 'h', rows, ...(ids ? { ids } : {}), cursor: '999:00000000-0000-0000-0000-000000000000', more: false }] } as unknown as PullResponse);
        return Promise.resolve({ data, error: null, status: 200 } as RpcResult);
      },
    };
    const e = createSyncEngine({ db, supabase: s, userId: ME, newId: id7, now: () => NOW, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false });
    await e.sync();
  }

  it('[NS-02-R16] a pulled letter is found; when the other parent deletes it or makes it private it is gone at once, and a restore brings it back', async () => {
    f = findFixture();
    takeOwnership(f.db, ME, { now: iso, newId: id7 });
    f.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('sync.epoch', '1')");
    f.db.run("UPDATE children SET server_state = 'synced' WHERE id = 'child-asha'");
    const id = id7();
    await pull(f.db, 'child-asha', [row(id, 'child-asha', { final_text: 'Papa wrote about the windmill.', raw_transcript: undefined })]);
    expect(find('windmill')).toEqual([id]);
    expect(mapRows()).toEqual([id]);
    // The other parent makes it private: not this person's, so it leaves the index in the pull's own transaction.
    await pull(f.db, 'child-asha', [row(id, 'child-asha', { final_text: 'Papa wrote about the windmill.', in_book: false, v: '401', updated_at: iso })]);
    expect(find('windmill')).toEqual([]);
    expect(mapRows()).toEqual([]);
    // Public again.
    await pull(f.db, 'child-asha', [row(id, 'child-asha', { final_text: 'Papa wrote about the windmill.', in_book: true, v: '402' })]);
    expect(find('windmill')).toEqual([id]);
    // Deleted (or made private) by the other parent: the server stops listing it, and the pull's id check removes the row.
    await pull(f.db, 'child-asha', [], []);
    expect(f.db.get('SELECT 1 AS n FROM entries WHERE id = ?', id)).toBeNull();
    expect(find('windmill')).toEqual([]);
    expect(mapRows()).toEqual([]);
  });
});

describe('[NS-02-R16] removed words leave the file', () => {
  it('[NS-02-R16] a removal marks the index for a merge, the merge runs at idle and clears the mark, and the FTS5 secure-delete option is recorded', () => {
    f = findFixture();
    expect(f.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', FIND_SECURE_SETTING)?.value).toBe('1');
    const id = f.add({ text: 'The ducks were loud.' });
    expect(f.db.get('SELECT 1 AS n FROM settings WHERE key = ?', FIND_DIRTY_SETTING)).toBeNull();
    entries.tombstone(f.ctx, id);
    expect(f.db.get('SELECT 1 AS n FROM settings WHERE key = ?', FIND_DIRTY_SETTING)).not.toBeNull();
    expect(optimizeIfDue(f.db)).toBe(true);
    expect(f.db.get('SELECT 1 AS n FROM settings WHERE key = ?', FIND_DIRTY_SETTING)).toBeNull();
    expect(optimizeIfDue(f.db)).toBe(false);
  });

  it('[NS-02-R16] after a delete and the merge, a unique word of the deleted letter is not in the database file or its log', () => {
    const dir = mkdtempSync(join(tmpdir(), 'find-'));
    const { db, close } = nodeDb(join(dir, 'scribe.db'));
    try {
      db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
      let t = Date.parse('2026-10-03T09:00:00.000Z');
      let k = 0;
      const id7 = () => `0199a000-0000-7000-8000-${String(900 + ++k).padStart(12, '0')}`;
      const ctx: RepoContext = { db, now: () => new Date((t += 1000)).toISOString(), newId: id7 };
      migrate(db, { now: ctx.now(), newId: () => id7() });
      insertBook(db, { id: 'child-asha' });
      forgetSearchState(db);
      forgetSearchView(db);
      ensureSearchIndex(db);
      const word = 'quokkaquokka';
      const keep = id7();
      const gone = id7();
      for (const [id, text] of [[keep, 'A letter that stays, about the harbour.'], [gone, `A letter about a ${word} at the zoo.`]] as const) {
        entries.upsert(ctx, {
          id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: '2026-10-03T08:30:00.000Z', captureMode: 'typed', editLevel: 'verbatim', promptKey: null,
          engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true, soundsLikeMe: null, childId: 'child-asha', authorSignsAs: 'Mama',
          audioUri: null, audioDurationMs: null, audioSha256: null, audioBytes: null, transcriptStatus: null,
        }, { childId: null, authorSignsAs: null });
      }
      expect(ids(searchLetters(db, word, 'child-asha'))).toEqual([gone]);
      entries.tombstone(ctx, gone);
      entries.eraseRow(ctx, gone);
      expect(ids(searchLetters(db, word, 'child-asha'))).toEqual([]);
      optimizeIfDue(db);
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      const bytes = readdirSync(dir).map((name) => readFileSync(join(dir, name)).toString('latin1')).join('');
      expect(bytes.includes(word)).toBe(false);
      expect(bytes.includes('harbour')).toBe(true); // the check can see words that are there
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
