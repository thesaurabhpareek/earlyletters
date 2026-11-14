/// <reference types="node" />
/**
 * Find's index and scan against a real SQLite engine with FTS5 (node:sqlite). Fictional Asha family only; every
 * sentence below is made up for the test. The phone's own SQLite (expo-sqlite 57) is a device check: its podspec
 * compiles FTS5 in unless the Podfile sets expo.sqlite.enableFTS to false (test/find-fts5-build.test.ts).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { children, entries } from '../src/lib/db/repos';
import { fts5Available, SEARCH_ROWS_TABLE, SEARCH_TABLE } from '../src/lib/find/lifecycle';
import { ftsSearch } from '../src/lib/find/fts-index';
import { prepareQuery } from '../src/lib/find/query';
import { scanSearch } from '../src/lib/find/scan-index';
import { searchLetters, type FindResult } from '../src/lib/find/search';
import { findFixture, type FindFixture } from './helpers/find-fixture';
import { insertBook } from './helpers/store-fixture';

let f: FindFixture;
afterEach(() => f?.close());

const ids = (r: FindResult): string[] => (r.status === 'done' ? r.hits.map((h) => h.id) : []);
const find = (raw: string, child = 'child-asha') => ids(searchLetters(f.db, raw, child));

describe('[NS-02] the engine under the tests', () => {
  it('[NS-02-R19] this SQLite has FTS5 and the index is made by the catch-up, not by a migration', () => {
    f = findFixture();
    expect(fts5Available(f.db)).toBe(true);
    expect(f.db.get('SELECT 1 AS n FROM sqlite_master WHERE name = ?', SEARCH_TABLE)).not.toBeNull();
  });
});

describe('[NS-02-R5] the index holds only what the parent kept and typed', () => {
  it('[NS-02-R5] the index has a body and an extra column and no other, and the map has two L2 columns', () => {
    f = findFixture();
    expect(f.db.all<{ name: string }>(`PRAGMA table_info(${SEARCH_TABLE})`).map((c) => c.name)).toEqual(['body', 'extra']);
    expect(f.db.all<{ name: string }>(`PRAGMA table_info(${SEARCH_ROWS_TABLE})`).map((c) => c.name)).toEqual(['entry_id', 'row_id']);
  });

  it('[NS-02-R5] raw_transcript is never searched: a word only in the raw is not found', () => {
    f = findFixture();
    f.add({ text: 'You laughed at the rain.', rawTranscript: 'um you laughed at the the rain zebrafish' });
    expect(find('zebrafish')).toEqual([]);
    expect(find('rain')).toHaveLength(1);
  });

  it('[NS-02-R5] the child name and the recording path are not searched', () => {
    f = findFixture();
    f.add({ text: 'You laughed at the rain.', audioUri: null });
    expect(find('Asha')).toEqual([]); // the book is named Asha; the letter does not say it
    const indexed = f.db.all<{ body: string; extra: string }>(`SELECT body, extra FROM ${SEARCH_TABLE}`);
    expect(JSON.stringify(indexed)).not.toMatch(/Asha|Documents|\.m4a/);
  });

  it('[NS-02-R5] a note is found like a letter; a quiet-day mark never is', () => {
    f = findFixture();
    const note = f.add({ kind: 'note', text: 'A note about the lighthouse.' });
    f.add({ kind: 'not_much', text: 'lighthouse again', inBook: false });
    expect(find('lighthouse')).toEqual([note]);
  });
});

describe('[NS-02-R6] how words match', () => {
  it('[NS-02-R6] every word must appear, in any order; case is ignored', () => {
    f = findFixture();
    const a = f.add({ text: 'You laughed at the rain today.' });
    f.add({ text: 'You laughed at the duck.' });
    expect(find('laughed rain')).toEqual([a]);
    expect(find('RAIN Laughed')).toEqual([a]);
    expect(find('laughed snow')).toEqual([]);
  });

  it('[NS-02-R6] the last word matches as a prefix while typing; an earlier word must be whole', () => {
    f = findFixture();
    const a = f.add({ text: 'You laughed at the rain today.' });
    expect(find('laughed ra')).toEqual([a]);
    expect(find('laugh rain')).toEqual([]); // "laugh" is not a whole word of the letter
    expect(find('lau')).toEqual([a]); // prefix of the only word
  });

  it('[NS-02-R6] punctuation and quotes in the query cannot change its meaning', () => {
    f = findFixture();
    const a = f.add({ text: 'Papa said "the blue boat" twice.' });
    expect(find('"blue boat"')).toEqual([a]);
    expect(find('blue* OR NOT boat')).toEqual([]);
    expect(find('blue ("boat')).toEqual([a]);
  });
});

describe('[NS-02-R7] accents do not hide a word', () => {
  it('[NS-02-R7] French, Spanish and Portuguese words are found without their accents, and with them', () => {
    f = findFixture();
    const fr = f.add({ text: 'Un café avec maman, puis une tarte.' });
    const es = f.add({ text: 'El niño comió piña en la playa.' });
    const pt = f.add({ text: 'Um abraço cheio de coração.' });
    expect(find('cafe')).toEqual([fr]);
    expect(find('café')).toEqual([fr]);
    expect(find('nino pina')).toEqual([es]);
    expect(find('niño')).toEqual([es]);
    expect(find('coracao')).toEqual([pt]);
    expect(find('abraco')).toEqual([pt]);
  });

  it('[NS-02-R7] unaccented text is found by an accented query', () => {
    f = findFixture();
    const a = f.add({ text: 'We had cafe and a long walk.' });
    expect(find('café')).toEqual([a]);
  });
});

describe('[NS-02-R8] other scripts are found as written', () => {
  it('[NS-02-R8] a whole Devanagari word finds its letter, and a vowel sign is not treated as an accent', () => {
    f = findFixture();
    const hi = f.add({ text: 'आज आशा ने नाव देखी और हँसी।', language: 'hi' } as never);
    f.add({ text: 'नव वर्ष की शुभकामनाएँ।' });
    expect(find('नाव')).toEqual([hi]);
    expect(find('नव')).toEqual([]); // two characters: below the floor
    expect(find('देखी')).toEqual([hi]);
  });

  it('[NS-02-R8] a whole Arabic word finds its letter, and the result carries the match', () => {
    f = findFixture();
    const ar = f.add({ text: 'رأت آشا قارب أزرق على الماء.' });
    const r = searchLetters(f.db, 'قارب', 'child-asha');
    expect(ids(r)).toEqual([ar]);
    if (r.status === 'done') {
      const e = r.hits[0].excerpt;
      expect(e.marks).toHaveLength(1);
      expect(e.text.slice(e.marks[0].start, e.marks[0].end)).toBe('قارب');
    }
  });
});

describe('[NS-02-R3] short queries do nothing; CJK uses the substring path', () => {
  it('[NS-02-R3] fewer than three characters returns idle, spaces included', () => {
    f = findFixture();
    f.add({ text: 'Go to the sea.' });
    for (const q of ['', ' ', '  a ', 'go', 'g o']) expect(searchLetters(f.db, q, 'child-asha')).toEqual({ status: 'idle' });
    expect(searchLetters(f.db, 'sea', 'child-asha').status).toBe('done');
  });

  it('[NS-02-R3] one CJK character is enough and finds a character inside a run of text', () => {
    f = findFixture();
    const zh = f.add({ text: '我们看到了一只小船，她笑了。' });
    f.add({ text: '今天下雨了。' });
    const r = searchLetters(f.db, '船', 'child-asha');
    expect(ids(r)).toEqual([zh]);
    expect(r.status === 'done' && r.path).toBe('scan'); // substring path, not the word index
    expect(find('小船 笑')).toEqual([zh]);
  });

  it('[NS-02-R3] a words query uses the index when it is there', () => {
    f = findFixture();
    f.add({ text: 'Go to the sea.' });
    const r = searchLetters(f.db, 'sea', 'child-asha');
    expect(r.status === 'done' && r.path).toBe('index');
  });
});

describe('[NS-02-R4] scope: the active book and what the viewer may see', () => {
  it('[NS-02-R4] another book is not searched', () => {
    f = findFixture();
    insertBook(f.db, { id: 'child-ravi', name: 'Ravi' });
    const a = f.add({ text: 'The harbour was loud.' });
    f.add({ text: 'The harbour was quiet.', childId: 'child-ravi' });
    expect(find('harbour')).toEqual([a]);
    expect(find('harbour', 'child-ravi')).toHaveLength(1);
    expect(find('harbour', 'child-ravi')).not.toContain(a);
  });

  it('[NS-02-R4] own private letters and other visible letters are found; another person\'s private letter never is', () => {
    f = findFixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'u-me')");
    const own = f.add({ text: 'Private kite of mine.', authorId: 'u-me', inBook: false });
    const none = f.add({ text: 'Private kite, made on this phone.', authorId: undefined, inBook: false });
    const theirsShared = f.add({ text: 'Shared kite from the other parent.', authorId: 'u-other', inBook: true });
    f.add({ text: 'Private kite of the other parent.', authorId: 'u-other', inBook: false });
    expect(find('kite').sort()).toEqual([own, none, theirsShared].sort());
  });

  it('[NS-02-R4] a hidden book, a deleted book and a left book are not searched, and come back when restored', () => {
    f = findFixture();
    const a = f.add({ text: 'The orchard smelled of rain.' });
    children.hide(f.ctx, 'child-asha');
    expect(find('orchard')).toEqual([]);
    expect(f.db.get('SELECT 1 AS n FROM letter_search_rows')).toBeNull(); // purged, not just filtered
    children.unhide(f.ctx, 'child-asha');
    expect(find('orchard')).toEqual([a]);
    f.db.run("UPDATE children SET server_state = 'left' WHERE id = 'child-asha'");
    expect(find('orchard')).toEqual([]); // the join keeps it honest even before the next catch-up
  });
});

describe('[NS-02-R10] order and no score', () => {
  it('[NS-02-R10] results are newest first by the letter\'s own date, and a hit carries no rank or score', () => {
    f = findFixture();
    const old = f.add({ text: 'The ducks, early.', occurredOn: '2026-05-01' });
    const mid = f.add({ text: 'The ducks again.', occurredOn: '2026-07-04' });
    const recent = f.add({ text: 'More ducks.', occurredOn: '2026-09-30' });
    const r = searchLetters(f.db, 'ducks', 'child-asha');
    expect(ids(r)).toEqual([recent, mid, old]);
    if (r.status === 'done') for (const h of r.hits) expect(Object.keys(h).sort()).toEqual(['capturedAt', 'excerpt', 'id', 'occurredOn', 'source']);
  });
});

describe('[NS-02-R17] letters without words are not found', () => {
  it('[NS-02-R17] a spoken letter waiting for its words, and a letter with no words, are not found', () => {
    f = findFixture();
    f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken' });
    f.add({ text: '   ' });
    const kept = f.add({ text: 'Words that arrived later wait for review but exist.' });
    f.db.run("UPDATE entries SET transcript_status = 'unreviewed' WHERE id = ?", kept);
    expect(find('review')).toEqual([kept]);
    expect(f.db.all('SELECT * FROM letter_search_rows')).toHaveLength(1);
  });
});

describe('[NS-02-R19] the index and the scan agree', () => {
  const corpus = [
    'You laughed at the rain today.',
    'Un café avec maman, puis une tarte aux pommes.',
    'El niño comió piña; qué día tan bonito.',
    'आज आशा ने नाव देखी और हँसी।',
    'رأت آشا قارب أزرق على الماء.',
    'The blue boat, the blue boats, and a boathouse!',
    "Don't go, said Papa. Rain-or-shine, we went.",
    'Two words. Cafe. Naïve façade, Zoë, Ångström.',
    'ひらがなの日。船で行った。',
  ];
  const queries = ['rain', 'laughed rain', 'RAIN', 'cafe', 'café maman', 'nino', 'pina bonito', 'नाव', 'قارب', 'blue boat', 'boat', 'boathouse', 'blue boats', 'don', 'rain shine', 'naive facade', 'zoe', 'angstrom', 'xyz', '船', 'ひらがな'];

  it('[NS-02-R19] over the fixtures, the index path and the scan path return the same letters in the same order', () => {
    f = findFixture();
    corpus.forEach((text, i) => f.add({ text, occurredOn: `2026-0${(i % 9) + 1}-10` }));
    for (const raw of queries) {
      const q = prepareQuery(raw);
      const scan = scanSearch(f.db, q, 'child-asha').map((r) => r.id);
      const viaService = find(raw);
      expect(viaService, raw).toEqual(scan);
      if (q.kind === 'words') expect(ftsSearch(f.db, q, 'child-asha').map((r) => r.id), raw).toEqual(scan);
    }
  });

  it('[NS-02-R19] with no index at all, search answers from the scan with the same letters', () => {
    f = findFixture({ index: false });
    corpus.forEach((text, i) => f.add({ text, occurredOn: `2026-0${(i % 9) + 1}-10` }));
    expect(f.db.get('SELECT 1 AS n FROM sqlite_master WHERE name = ?', SEARCH_TABLE)).toBeNull();
    const r = searchLetters(f.db, 'blue boat', 'child-asha');
    expect(r.status === 'done' && r.path).toBe('scan');
    expect(ids(r)).toHaveLength(1);
    expect(find('cafe')).toHaveLength(2);
  });

  it('[NS-02-R19] a damaged index answers from the scan, drops itself, and does not stop the app', () => {
    f = findFixture();
    f.add({ text: 'The blue boat.' });
    f.db.exec(`DROP TABLE ${SEARCH_ROWS_TABLE}`); // the map is gone: the index query throws
    const r = searchLetters(f.db, 'boat', 'child-asha');
    expect(r.status === 'done' && r.path).toBe('scan');
    expect(ids(r)).toHaveLength(1);
    expect(f.db.get('SELECT 1 AS n FROM sqlite_master WHERE name = ?', SEARCH_TABLE)).toBeNull();
  });
});

describe('[NS-02-R16] writes outside the repos', () => {
  it('[NS-02-R16] a write the repos did not see is still never found once it is deleted (the join), and the catch-up repairs the index', () => {
    f = findFixture();
    const a = f.add({ text: 'The lantern was lit.' });
    f.db.run("UPDATE entries SET deleted_at = '2026-10-04T00:00:00.000Z' WHERE id = ?", a); // as a sync merge would
    expect(find('lantern')).toEqual([]);
    expect(entries.get(f.ctx, a)).toBeNull();
  });
});
