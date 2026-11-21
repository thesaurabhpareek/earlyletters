/// <reference types="node" />
/**
 * Find's index lifecycle against real SQLite with FTS5 (node:sqlite): made by ensureSearchIndex, moved by reindexLetter
 * in the letter's transaction, caught up and dropped (ADR 0028 D4, D5). Moved from #798's find-index and
 * find-lifecycle tests; the account seam test is new (BL-961, CR-67 AX-12). Fictional Asha family only.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { entries } from '../src/lib/db/repos';
import {
  dropSearchIndex, ensureSearchIndex, FIND_DIRTY_SETTING, FIND_SECURE_SETTING, fts5Available, reconcileSearch,
  reindexLetter, SEARCH_ROWS_TABLE, SEARCH_TABLE, setIndexableBooks,
} from '../src/lib/find/lifecycle';
import { findFixture, type FindFixture } from './find-fixture';
import { insertBook } from './helpers/store-fixture';

let f: FindFixture;
afterEach(() => {
  f?.close();
  f = undefined as never;
  setIndexableBooks(null);
});

/** Letters the index itself holds for a word (no view join), and the map and FTS row counts. */
const indexed = (word: string) =>
  f.db.all<{ id: string }>(`SELECT m.entry_id AS id FROM ${SEARCH_TABLE} f JOIN ${SEARCH_ROWS_TABLE} m ON m.row_id = f.rowid WHERE ${SEARCH_TABLE} MATCH ? ORDER BY id`, `"${word}"`).map((r) => r.id);
const mapRows = () => f.db.all<{ entry_id: string }>(`SELECT entry_id FROM ${SEARCH_ROWS_TABLE} ORDER BY entry_id`).map((r) => r.entry_id);
const ftsCount = () => f.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${SEARCH_TABLE}`)!.n;
const setting = (key: string) => f.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;

describe('[NS-02-R19][NS-02-R5] the index and what it holds', () => {
  it('[NS-02-R19] this SQLite has FTS5 and the index is made by ensureSearchIndex, not by a migration', () => {
    f = findFixture({ index: false });
    expect(fts5Available(f.db)).toBe(true);
    expect(f.db.get('SELECT 1 AS n FROM sqlite_master WHERE name = ?', SEARCH_TABLE)).toBeNull();
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(f.db.get('SELECT 1 AS n FROM sqlite_master WHERE name = ?', SEARCH_TABLE)).not.toBeNull();
  });

  it('[NS-02-R5] the index has a body and an extra column and holds the kept words only, never the raw words or a name', () => {
    f = findFixture();
    expect(f.db.all<{ name: string }>(`PRAGMA table_info(${SEARCH_TABLE})`).map((c) => c.name)).toEqual(['body', 'extra']);
    expect(f.db.all<{ name: string }>(`PRAGMA table_info(${SEARCH_ROWS_TABLE})`).map((c) => c.name)).toEqual(['entry_id', 'row_id']);
    f.add({ text: 'You laughed at the rain.', rawTranscript: 'um you laughed at the the rain zebrafish' });
    expect(f.db.all(`SELECT body, extra FROM ${SEARCH_TABLE}`)).toEqual([{ body: 'You laughed at the rain.', extra: '' }]);
  });
});

describe('[NS-02-R16a] the index moves with the letter', () => {
  it('[NS-02-R16a] a kept letter goes in; a Review edit and an Undo change its words; a delete takes it out; one row each', () => {
    f = findFixture();
    const id = f.add({ text: 'The ducks were loud.' });
    expect(indexed('ducks')).toEqual([id]);
    entries.replaceWords(f.ctx, id, { final_text: 'The geese were loud.', machine_edits: [], edit_level: 'verbatim' });
    reindexLetter(f.db, id);
    expect([indexed('ducks'), indexed('geese')]).toEqual([[], [id]]);
    entries.replaceWords(f.ctx, id, { final_text: 'The ducks were loud.', machine_edits: [], edit_level: 'clean' });
    reindexLetter(f.db, id);
    expect([indexed('ducks'), indexed('geese'), ftsCount(), mapRows()]).toEqual([[id], [], 1, [id]]);
    entries.tombstone(f.ctx, id);
    reindexLetter(f.db, id);
    expect([indexed('ducks'), ftsCount(), mapRows()]).toEqual([[], 0, []]);
  });

  it('[NS-02-R16a] the index and the letter commit together: a rolled-back write leaves both unchanged', () => {
    f = findFixture();
    const id = f.add({ text: 'The ducks were loud.' });
    const write = () =>
      f.db.transaction(() => {
        entries.replaceWords(f.ctx, id, { final_text: 'The geese were loud.', machine_edits: [], edit_level: 'verbatim' });
        reindexLetter(f.db, id);
        expect(indexed('geese')).toEqual([id]); // inside the write the index already agrees
        throw new Error('boom');
      });
    expect(write).toThrow('boom');
    expect([indexed('ducks'), indexed('geese'), entries.get(f.ctx, id)?.finalText]).toEqual([[id], [], 'The ducks were loud.']);
  });

  it('[NS-02-R16d] a purged letter leaves no index row and no map row', () => {
    f = findFixture();
    const id = f.add({ text: 'The lighthouse blinked.' });
    entries.tombstone(f.ctx, id);
    expect(entries.eraseRow(f.ctx, id)).toBe(true);
    reindexLetter(f.db, id);
    expect([mapRows(), ftsCount(), reconcileSearch(f.db), mapRows()]).toEqual([[], 0, 0, []]);
  });
});

describe('[NS-02-R19] the catch-up', () => {
  it('[NS-02-R19] letters written before the index existed are indexed; a second pass changes nothing; a changed or orphan row is repaired', () => {
    f = findFixture({ index: false });
    const a = f.add({ text: 'Before the index, the kite.' });
    const b = f.add({ text: 'Before the index, the pond.' });
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(mapRows()).toEqual([a, b].sort());
    expect(reconcileSearch(f.db)).toBe(0);
    f.db.run("UPDATE entries SET final_text = 'After, the river.' WHERE id = ?", b); // a write that skipped the index
    f.db.run(`INSERT INTO ${SEARCH_TABLE} (body, extra) VALUES ('orphan words', '')`);
    expect(reconcileSearch(f.db)).toBe(2);
    expect([indexed('pond'), indexed('river'), indexed('orphan'), ftsCount()]).toEqual([[], [b], [], 2]);
  });
});

describe('[NS-02-R18] drop', () => {
  it('[NS-02-R18] dropping removes the index, its shadow tables, its map and the find settings; the next ensure makes it again, empty', () => {
    f = findFixture();
    const id = f.add({ text: 'The lantern was lit.' });
    entries.tombstone(f.ctx, id);
    reindexLetter(f.db, id);
    expect(setting(FIND_DIRTY_SETTING)).not.toBeNull();
    dropSearchIndex(f.db);
    expect(f.db.get('SELECT name FROM sqlite_master WHERE name LIKE ?', 'letter_search%')).toBeNull();
    expect([setting(FIND_DIRTY_SETTING), setting(FIND_SECURE_SETTING)]).toEqual([null, null]);
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect(ftsCount()).toBe(0);
  });
});

describe('[NS-02-R24][CR-67] the account seam: only indexable books enter the index', () => {
  it('[NS-02-R24] a book outside listIndexableBooks is never indexed, leaves at the next catch-up, and comes back when it is indexable again', () => {
    f = findFixture();
    insertBook(f.db, { id: 'child-other', name: 'Ravi' });
    const mine = f.add({ text: 'Our harbour walk.' });
    const theirs = f.add({ text: 'Their harbour walk.', childId: 'child-other' });
    expect(indexed('harbour')).toEqual([mine, theirs].sort());
    setIndexableBooks(() => ['child-asha']); // as BL-961's bookVisibleTo will say for a book of another account
    expect(reconcileSearch(f.db)).toBe(1);
    expect(indexed('harbour')).toEqual([mine]);
    const later = f.add({ text: 'Another harbour, theirs.', childId: 'child-other' });
    expect(indexed('harbour')).toEqual([mine]);
    setIndexableBooks(() => []);
    reconcileSearch(f.db);
    expect(mapRows()).toEqual([]);
    setIndexableBooks(null);
    reconcileSearch(f.db);
    expect(indexed('harbour')).toEqual([mine, theirs, later].sort());
  });
});
