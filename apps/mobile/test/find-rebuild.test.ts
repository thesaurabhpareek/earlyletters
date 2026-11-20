/// <reference types="node" />
/**
 * Find's idle work: the index rebuilt in batches off the recording (NS-02-R35, new against #798, which rebuilt in one
 * transaction) and the merge that takes removed words out of the file (R30), plus the rules that keep the index on the
 * phone (R31, R49) and FTS5 in the build (R19). R30, R31 and the podspec check are #798's, moved; R31 now walks
 * subdirectories. Real SQLite with FTS5 (node:sqlite). Fictional Asha family only.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { noteRecordingSession } from '../src/lib/capture/busy';
import { migrate } from '../src/lib/db/migrations';
import { entries, type RepoContext } from '../src/lib/db/repos';
import { dropSearchIndex, ensureSearchIndex, FIND_DIRTY_SETTING, FIND_SECURE_SETTING, forgetSearchState, reindexLetter, reconcileSearch, SEARCH_ROWS_TABLE } from '../src/lib/find/lifecycle';
import { optimizeIfDue, REBUILD_BATCH, rebuildSearchIndex } from '../src/lib/find/rebuild';
import { searchLetters, type FindResult } from '../src/lib/find/search';
import { forgetSearchView } from '../src/lib/find/sources';
import { findFixture, type FindFixture } from './find-fixture';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

let f: FindFixture;
afterEach(() => {
  f?.close();
  f = undefined as never;
  noteRecordingSession(false);
});

const ids = (r: FindResult): string[] => (r.status === 'done' ? r.hits.map((h) => h.id) : []);
const mapCount = () => f.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${SEARCH_ROWS_TABLE}`)!.n;
const setting = (key: string) => f.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
const seed = (n: number) => Array.from({ length: n }, (_, i) => f.add({ text: `Letter ${i} about the harbour.`, occurredOn: '2026-10-01' }));

describe('[NS-02-R35] the index rebuilds in small batches', () => {
  it('[NS-02-R35] 1,000 letters are indexed 200 per transaction with a yield between, and the scan answers with every letter until the end', async () => {
    f = findFixture({ index: false });
    const all = seed(1000);
    const transaction = vi.spyOn(f.db, 'transaction');
    const seen: { indexed: number; path: string; found: number }[] = [];
    const pause = async () => {
      const r = searchLetters(f.db, 'harbour', 'child-asha');
      seen.push({ indexed: mapCount(), path: r.status === 'done' ? r.path : 'idle', found: ids(r).length });
    };
    expect(await rebuildSearchIndex(f.db, { busy: () => false, pause })).toBe('ready');
    expect(REBUILD_BATCH).toBe(200);
    expect(seen.map((s) => s.indexed)).toEqual([200, 400, 600, 800, 1000]);
    expect(seen.every((s) => s.path === 'scan' && s.found === 1000)).toBe(true);
    expect(transaction.mock.calls.length).toBe(7); // the table, five batches, and the batch that finds nothing left
    const r = searchLetters(f.db, 'harbour', 'child-asha');
    expect([r.status === 'done' && r.path, ids(r).sort()]).toEqual(['index', all.sort()]);
  });

  it('[NS-02-R35][NS-02-R44] an untrusted index is not queried while it is rebuilt: the scan answers until the last batch', async () => {
    f = findFixture();
    seed(450);
    f.db.exec(`DROP TABLE ${SEARCH_ROWS_TABLE}`);
    f.add({ text: 'Written while the index was broken, the harbour.' }); // the index write fails: untrusted (R44)
    const paths = new Set<string>();
    const pause = async () => {
      const r = searchLetters(f.db, 'harbour', 'child-asha');
      paths.add(`${r.status === 'done' ? r.path : 'idle'}:${ids(r).length}`);
    };
    expect(await rebuildSearchIndex(f.db, { busy: () => false, pause })).toBe('ready');
    expect([...paths]).toEqual(['scan:451']);
    expect(mapCount()).toBe(451);
  });

  it('[NS-02-R35] nothing runs while a take is recording; the rebuild starts when the take ends', async () => {
    f = findFixture({ index: false });
    seed(3);
    noteRecordingSession(true);
    const done = rebuildSearchIndex(f.db, { pause: async () => {} });
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    expect(f.db.get(`SELECT 1 AS n FROM sqlite_master WHERE name = '${SEARCH_ROWS_TABLE}'`)).toBeNull();
    noteRecordingSession(false);
    expect(await done).toBe('ready');
    expect(mapCount()).toBe(3);
  });

  it('[NS-02-R35][NS-02-R16a] a letter written or deleted during the rebuild ends up right; a second call shares the run', async () => {
    f = findFixture({ index: false });
    const [first] = seed(450);
    let added = '';
    let once = true;
    const pause = async () => {
      if (!once) return;
      once = false;
      added = f.add({ text: 'Written mid-rebuild, the lighthouse.' });
      entries.tombstone(f.ctx, first);
      reindexLetter(f.db, first); // a no-op while building: the next batch sees it
    };
    const run = rebuildSearchIndex(f.db, { busy: () => false, pause });
    expect(rebuildSearchIndex(f.db)).toBe(run);
    expect(await run).toBe('ready');
    expect([mapCount(), reconcileSearch(f.db)]).toEqual([450, 0]);
    expect(ids(searchLetters(f.db, 'lighthouse', 'child-asha'))).toEqual([added]);
  });
});

describe('[NS-02-R30] removed words leave the file', () => {
  it('[NS-02-R30] a removal marks the index for a merge; the merge clears the mark; the FTS5 secure-delete option is recorded', () => {
    f = findFixture();
    expect(setting(FIND_SECURE_SETTING)).toBe('1');
    const id = f.add({ text: 'The ducks were loud.' });
    expect(setting(FIND_DIRTY_SETTING)).toBeNull();
    entries.tombstone(f.ctx, id);
    reindexLetter(f.db, id);
    expect(setting(FIND_DIRTY_SETTING)).not.toBeNull();
    expect([optimizeIfDue(f.db), setting(FIND_DIRTY_SETTING), optimizeIfDue(f.db)]).toEqual([true, null, false]);
  });

  it('[NS-02-R30] after a delete and the merge, a unique word of the deleted letter is not in the database file or its log', () => {
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
      const [keep, gone] = [id7(), id7()];
      for (const [id, text] of [[keep, 'A letter that stays, about the harbour.'], [gone, `A letter about a ${word} at the zoo.`]] as const) {
        entries.upsert(ctx, {
          id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: '2026-10-03T08:30:00.000Z', captureMode: 'typed', editLevel: 'verbatim', promptKey: null,
          engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true, soundsLikeMe: null, childId: 'child-asha', authorSignsAs: 'Mama',
          audioUri: null, audioDurationMs: null, audioSha256: null, audioBytes: null, transcriptStatus: null,
        }, { childId: null, authorSignsAs: null });
        reindexLetter(db, id);
      }
      expect(ids(searchLetters(db, word, 'child-asha'))).toEqual([gone]);
      entries.tombstone(ctx, gone);
      entries.eraseRow(ctx, gone);
      reindexLetter(db, gone);
      optimizeIfDue(db);
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      const bytes = readdirSync(dir).map((name) => readFileSync(join(dir, name)).toString('latin1')).join('');
      expect([bytes.includes(word), bytes.includes('harbour')]).toEqual([false, true]); // the check can see words that are there
    } finally {
      close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('[NS-02-R31][NS-02-R49][NS-02-R19] the index stays on the phone and writes nothing to a letter', () => {
  it('[NS-02-R31] no export, backup or sync file, at any depth, names the index, its map or the view', () => {
    const lib = join(__dirname, '..', 'src', 'lib');
    const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
    const hits = ['export', 'backup', 'sync']
      .flatMap((d) => walk(join(lib, d)))
      .filter((p) => /\.tsx?$/.test(p) && /letter_search|searchable_letters/.test(readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
    expect(hits).toEqual([]);
  });

  it('[NS-02-R49] a rebuild, searches, a merge and a drop leave every letter and every other setting byte-identical', async () => {
    f = findFixture({ index: false });
    seed(5);
    entries.tombstone(f.ctx, f.add({ text: 'Gone soon.' }));
    const snapshot = () => JSON.stringify([f.db.all('SELECT * FROM entries ORDER BY id'), f.db.all("SELECT * FROM settings WHERE key NOT LIKE 'find.%' ORDER BY key")]);
    const before = snapshot();
    await rebuildSearchIndex(f.db, { busy: () => false });
    searchLetters(f.db, 'harbour', 'child-asha');
    searchLetters(f.db, '\u8239', 'child-asha');
    optimizeIfDue(f.db);
    dropSearchIndex(f.db);
    expect(snapshot()).toBe(before);
  });

  it('[NS-02-R19] expo-sqlite 57 compiles FTS5 in unless the Podfile properties turn it off, and this app never turns it off', () => {
    const podspec = readFileSync(join(__dirname, '..', '..', '..', 'node_modules', 'expo-sqlite', 'ios', 'ExpoSQLite.podspec'), 'utf8');
    expect(podspec).toMatch(/SQLITE_ENABLE_FTS5=1/);
    expect(podspec).toMatch(/expo\.sqlite\.enableFTS'\] == 'false'/);
    const config = readFileSync(join(__dirname, '..', 'app.config.ts'), 'utf8');
    expect(config).not.toMatch(/enableFTS|expo-build-properties[\s\S]{0,200}expo\.sqlite/);
  });
});
