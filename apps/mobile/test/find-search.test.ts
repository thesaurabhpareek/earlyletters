/// <reference types="node" />
/**
 * Find's search service (NS-02-R3, R10, R14, R15, R16c, R19, R22, R44, R45) and when it runs (O-1, the 150 ms debounce).
 * Real SQLite with FTS5 (node:sqlite). Moved from #798's find-index, find-lifecycle and find-logic tests; the debounce
 * and R45 through the engine are new. Fictional Asha family only; every sentence is made up.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { entries } from '../src/lib/db/repos';
import { createQueryDebounce, FIND_DEBOUNCE_MS } from '../src/lib/find/debounce';
import { ftsSearch } from '../src/lib/find/fts-index';
import { ensureSearchIndex, reindexLetter, SEARCH_ROWS_TABLE, SEARCH_TABLE, searchIndexExists } from '../src/lib/find/lifecycle';
import { prepareQuery } from '../src/lib/find/query';
import { scanSearch } from '../src/lib/find/scan-index';
import { searchLetters, type FindResult } from '../src/lib/find/search';
import { forgetSearchView, registerFindExtraSource, resetFindExtraSources } from '../src/lib/find/sources';
import { findFixture, type FindFixture } from './find-fixture';

let f: FindFixture;
afterEach(() => {
  f?.close();
  f = undefined as never;
  resetFindExtraSources();
});

const ids = (r: FindResult): string[] => (r.status === 'done' ? r.hits.map((h) => h.id) : []);
const find = (raw: string) => ids(searchLetters(f.db, raw, 'child-asha'));
const path = (raw: string) => {
  const r = searchLetters(f.db, raw, 'child-asha');
  return r.status === 'done' ? r.path : r.status;
};

describe('[NS-02-R19] the index and the scan agree', () => {
  const corpus = [
    'You laughed at the rain today.',
    'Un caf\u00e9 avec maman, puis une tarte aux pommes.',
    'El ni\u00f1o comi\u00f3 pi\u00f1a; qu\u00e9 d\u00eda tan bonito.',
    '\u0906\u091c \u0906\u0936\u093e \u0928\u0947 \u0928\u093e\u0935 \u0926\u0947\u0916\u0940 \u0914\u0930 \u0939\u0901\u0938\u0940\u0964',
    '\u0631\u0623\u062a \u0622\u0634\u0627 \u0642\u0627\u0631\u0628 \u0623\u0632\u0631\u0642 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0621.',
    'The blue boat, the blue boats, and a boathouse!',
    "Don't go, said Papa. Rain-or-shine, we went.",
    'Two words. Cafe. Na\u00efve fa\u00e7ade, Zo\u00eb, \u00c5ngstr\u00f6m.',
    '\u3072\u3089\u304c\u306a\u306e\u65e5\u3002\u8239\u3067\u884c\u3063\u305f\u3002',
  ];
  // 'laug', 'pomm' and 'laughed ra' hold only by the last-word-prefix rule, so a drift on that rule between the paths goes
  // red (review A on #798). The operator queries are R45 through the engine: matched as text, never an error.
  const queries = ['rain', 'laughed rain', 'RAIN', 'cafe', 'caf\u00e9 maman', 'nino', 'pina bonito', '\u0928\u093e\u0935', '\u0642\u0627\u0631\u0628', 'blue boat', 'boat', 'boathouse', 'blue boats', 'don', 'rain shine', 'naive facade', 'zoe', 'angstrom', 'xyz', '\u8239', '\u3072\u3089\u304c\u306a', 'laug', 'pomm', 'laughed ra', '"blue boat"', 'blue* OR NOT boat', 'NEAR(blue boat)', 'body:boat', 'blue -boat', '(blue boat'];

  it('[NS-02-R19][NS-02-R45] over the fixtures, the index path and the scan path return the same letters in the same order', () => {
    f = findFixture();
    corpus.forEach((text, i) => f.add({ text, occurredOn: `2026-0${(i % 9) + 1}-10` }));
    for (const raw of queries) {
      const q = prepareQuery(raw);
      const scan = scanSearch(f.db, q, 'child-asha').map((r) => r.id);
      expect(find(raw), raw).toEqual(scan);
      if (q.kind === 'words') expect(ftsSearch(f.db, q, 'child-asha').map((r) => r.id), raw).toEqual(scan);
    }
  });

  it('[NS-02-R19] with no index at all, search answers from the scan with the same letters', () => {
    f = findFixture({ index: false });
    corpus.forEach((text, i) => f.add({ text, occurredOn: `2026-0${(i % 9) + 1}-10` }));
    expect(path('blue boat')).toBe('scan');
    expect(find('blue boat')).toHaveLength(1);
    expect(find('cafe')).toHaveLength(2);
  });

  it('[NS-02-R19] a damaged index answers from the scan, drops itself, and does not stop the app', () => {
    f = findFixture();
    f.add({ text: 'The blue boat.' });
    f.db.exec(`DROP TABLE ${SEARCH_ROWS_TABLE}`); // the map is gone: the index query throws
    expect(path('boat')).toBe('scan');
    expect(find('boat')).toHaveLength(1);
    expect(f.db.get('SELECT 1 AS n FROM sqlite_master WHERE name = ?', SEARCH_TABLE)).toBeNull();
  });

  it('[NS-02-R3] under three characters is idle; a words query uses the index; a CJK query uses the scan', () => {
    f = findFixture();
    f.add({ text: 'Go to the sea. \u6211\u4eec\u770b\u5230\u4e86\u4e00\u53ea\u5c0f\u8239\u3002' });
    for (const q of ['', ' ', '  a ', 'go', 'g o']) expect(searchLetters(f.db, q, 'child-asha'), q).toEqual({ status: 'idle' });
    expect([path('sea'), path('\u8239')]).toEqual(['index', 'scan']);
  });
});

describe('[NS-02-R44][NS-02-R16c] through the index', () => {
  it('[NS-02-R44] a failing index write never loses or refuses the letter; the scan answers until the catch-up repairs it', () => {
    f = findFixture();
    f.db.exec(`DROP TABLE ${SEARCH_ROWS_TABLE}`); // the index cannot be written now
    const id = f.add({ text: 'Written while the index was broken.' });
    expect(entries.get(f.ctx, id)?.finalText).toBe('Written while the index was broken.');
    expect([searchIndexExists(f.db), find('broken'), path('broken')]).toEqual([false, [id], 'scan']);
    expect(ensureSearchIndex(f.db)).toBe('ready');
    expect([find('broken'), path('broken')]).toEqual([[id], 'index']);
  });

  it('[NS-02-R16c] a sealed letter leaves the index and is found again when it opens', () => {
    f = findFixture();
    f.db.exec('CREATE TABLE sealed_fixture (entry_id TEXT PRIMARY KEY)');
    registerFindExtraSource({ id: 'seal', available: () => true, textSql: 'NULL', visibleSql: 'e.id NOT IN (SELECT entry_id FROM sealed_fixture)' });
    forgetSearchView(f.db);
    ensureSearchIndex(f.db);
    const id = f.add({ text: 'A letter for the eighteenth birthday, with a secret recipe.' });
    f.db.run('INSERT INTO sealed_fixture VALUES (?)', id);
    reindexLetter(f.db, id); // the seal's own write calls the one function
    expect([find('recipe'), f.db.all(`SELECT * FROM ${SEARCH_ROWS_TABLE}`)]).toEqual([[], []]);
    f.db.run('DELETE FROM sealed_fixture WHERE entry_id = ?', id); // Open now
    reindexLetter(f.db, id);
    expect([find('recipe'), path('recipe')]).toEqual([[id], 'index']);
  });
});

describe('[NS-02-R10][NS-02-R14][NS-02-R15][NS-02-R22] what a search leaves behind', () => {
  it('[NS-02-R10] a hit carries its id, dates, source and excerpt, and no rank or score', () => {
    f = findFixture();
    f.add({ text: 'The ducks again.' });
    const r = searchLetters(f.db, 'ducks', 'child-asha');
    expect(r.status === 'done' && r.hits.map((h) => Object.keys(h).sort())).toEqual([['capturedAt', 'excerpt', 'id', 'occurredOn', 'source']]);
  });

  it('[NS-02-R14] a query typed through search leaves no trace in any table of the database', () => {
    f = findFixture();
    f.add({ text: 'The blue boat floated.' });
    const canary = 'zqxjkcanaryword';
    searchLetters(f.db, canary, 'child-asha');
    searchLetters(f.db, 'blue boat', 'child-asha');
    const tables = f.db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'letter_search%'");
    for (const t of tables) expect(JSON.stringify(f.db.all(`SELECT * FROM "${t.name}"`)), t.name).not.toContain(canary);
    expect(JSON.stringify(f.db.all('SELECT * FROM settings'))).not.toMatch(/blue boat/);
  });

  it('[NS-02-R15] a canary query, a hit and a forced failure write nothing to any console channel', () => {
    f = findFixture();
    const spies = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((c) => vi.spyOn(console, c).mockImplementation(() => {}));
    try {
      f.add({ text: 'The zqxjkcanaryword floated.' });
      searchLetters(f.db, 'zqxjkcanaryword', 'child-asha');
      f.db.exec(`DROP TABLE ${SEARCH_ROWS_TABLE}`); // forces the index query to fail
      searchLetters(f.db, 'zqxjkcanaryword', 'child-asha');
      for (const s of spies) expect(s).not.toHaveBeenCalled();
    } finally {
      for (const s of spies) s.mockRestore();
    }
  });

  it('[NS-02-R22] the index path, the scan path and the index build touch fetch and XMLHttpRequest 0 times', () => {
    let calls = 0;
    vi.stubGlobal('fetch', () => {
      calls += 1;
      return Promise.reject(new Error('Find must not reach the network'));
    });
    vi.stubGlobal('XMLHttpRequest', class {
      constructor() {
        calls += 1;
      }
    });
    const scanned = findFixture({ index: false });
    f = findFixture();
    try {
      f.add({ text: 'The blue boat floated past the lighthouse.' });
      scanned.add({ text: 'The blue boat floated past the lighthouse.' });
      expect(path('blue boat')).toBe('index');
      expect(searchLetters(scanned.db, 'blue boat', 'child-asha').status).toBe('done');
      ensureSearchIndex(scanned.db);
      expect(searchLetters(scanned.db, '\u8239', 'child-asha').status).toBe('done');
      expect(calls).toBe(0);
    } finally {
      vi.unstubAllGlobals();
      scanned.close();
    }
  });
});

describe('[NS-02-O-1][NS-02-R2] a query runs 150 ms after the last keystroke', () => {
  afterEach(() => vi.useRealTimers());
  const debounced = () => {
    vi.useFakeTimers();
    const ran: string[] = [];
    return { ran, d: createQueryDebounce((q) => ran.push(q)) };
  };

  it('[NS-02-O-1] keystrokes inside 150 ms run once, with the last text, 150 ms after the last one; the delay sits inside R2', () => {
    expect(FIND_DEBOUNCE_MS).toBe(150);
    const { ran, d } = debounced();
    for (const q of ['boa', 'boat', 'boat h']) {
      d.push(q);
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(49);
    expect(ran).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(ran).toEqual(['boat h']);
    vi.advanceTimersByTime(1000);
    expect(ran).toEqual(['boat h']);
  });

  it('[NS-02-O-1][NS-02-R3] clearing the field or going under three characters applies at once and cancels the pending run', () => {
    const { ran, d } = debounced();
    d.push('boat');
    d.push('bo');
    expect(ran).toEqual(['bo']);
    d.push('boat');
    d.push('');
    vi.advanceTimersByTime(500);
    expect(ran).toEqual(['bo', '']);
  });

  it('[NS-02-O-1] the return key runs now; after Find closes nothing runs', () => {
    const { ran, d } = debounced();
    d.push('lighthouse');
    d.flush();
    expect(ran).toEqual(['lighthouse']);
    d.push('harbour');
    d.dispose();
    d.push('kite');
    vi.advanceTimersByTime(1000);
    expect(ran).toEqual(['lighthouse']);
  });
});
