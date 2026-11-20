/// <reference types="node" />
/**
 * What may be found (`searchable_letters`, ADR 0028 D4) and the scan that reads it (NS-02-R4, R5, R7, R8, R10, R16b, R17,
 * R33, and the substring path of R3). Real SQLite (node:sqlite), no index yet: the index arrives in BL-952 slice 3 and is
 * held against this scan in slice 4. Moved from #798's find-index.test.ts and find-lifecycle.test.ts, run through the
 * scan. Fictional Asha family only; every sentence is made up.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { children, entries, wipe } from '../src/lib/db/repos';
import { prepareQuery, snippetSource } from '../src/lib/find/query';
import { scanSearch } from '../src/lib/find/scan-index';
import { ensureSearchView, registerFindExtraSource, resetFindExtraSources } from '../src/lib/find/sources';
import { findFixture, type FindFixture } from './find-fixture';
import { insertBook } from './helpers/store-fixture';

let f: FindFixture;
afterEach(() => {
  f?.close();
  f = undefined as never;
  resetFindExtraSources();
});

const rows = (raw: string, child = 'child-asha') => {
  ensureSearchView(f.db);
  return scanSearch(f.db, prepareQuery(raw), child);
};
const find = (raw: string, child = 'child-asha') => rows(raw, child).map((r) => r.id);

describe('[NS-02-R5] only what the parent kept and typed is findable', () => {
  it('[NS-02-R5] raw_transcript is never searched: a word only in the raw is not found', () => {
    f = findFixture();
    f.add({ text: 'You laughed at the rain.', rawTranscript: 'um you laughed at the the rain zebrafish' });
    expect(find('zebrafish')).toEqual([]);
    expect(find('rain')).toHaveLength(1);
  });

  it('[NS-02-R5] the child name and the recording path are not searched', () => {
    f = findFixture();
    f.add({ text: 'You laughed at the rain.', audioUri: 'file:///Documents/takes/a.m4a' });
    expect(find('Asha')).toEqual([]); // the book is named Asha; the letter does not say it
    expect(find('Documents')).toEqual([]);
    expect(JSON.stringify(rows('rain'))).not.toMatch(/Asha|Documents|\.m4a/);
  });

  it('[NS-02-R5] a note is found like a letter; a quiet-day mark never is', () => {
    f = findFixture();
    const note = f.add({ kind: 'note', text: 'A note about the lighthouse.' });
    f.add({ kind: 'not_much', text: 'lighthouse again', inBook: false });
    expect(find('lighthouse')).toEqual([note]);
  });

  it('[NS-02-R5] the findable view never names raw_transcript, audio, a hash or a child name', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'find', 'sources.ts'), 'utf8');
    const viewSql = src.slice(src.indexOf('export function searchableViewSql'), src.indexOf('const viewState'));
    expect(viewSql).not.toMatch(/raw_transcript|audio|sha256|machine_edits|c\.name|author_signs_as/);
  });

  it('[NS-02-R5] parent-typed photo words and a typed place are found and quoted; a place read from the file is not', () => {
    f = findFixture();
    const id = f.add({ text: 'We stayed home all day.' });
    expect(find('slide')).toEqual([]); // no photo table on this phone yet: the source contributes nothing, and nothing fails
    f.db.exec('CREATE TABLE entry_media (id TEXT PRIMARY KEY, entry_id TEXT, photo_text TEXT, place TEXT, sha256 TEXT, derived_place TEXT)');
    f.db.run("INSERT INTO entry_media VALUES ('m1', ?, 'Asha on the red slide', 'Bishop Park', 'abc', 'Mission District')", id);
    expect(find('slide')).toEqual([id]);
    expect(find('bishop')).toEqual([id]);
    expect(find('mission')).toEqual([]);
    expect(find('abc')).toEqual([]);
    const q = prepareQuery('slide');
    expect(snippetSource(q, rows('slide')[0])).toBe('extra');
    expect(snippetSource(prepareQuery('stayed'), rows('stayed')[0])).toBe('body');
  });
});

describe('[NS-02-R33] a draft is not found', () => {
  it('[NS-02-R33] the view reads kept letters only: it never names the drafts table', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'find', 'sources.ts'), 'utf8');
    const viewSql = src.slice(src.indexOf('export function searchableViewSql'), src.indexOf('const viewState'));
    expect(viewSql).toMatch(/FROM entries e/);
    expect(viewSql).not.toMatch(/\bdrafts\b/);
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

  it("[NS-02-R4] own private letters and other visible letters are found; another person's private letter never is", () => {
    f = findFixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'u-me')");
    const own = f.add({ text: 'Private kite of mine.', authorId: 'u-me', inBook: false });
    const none = f.add({ text: 'Private kite, made on this phone.', authorId: undefined, inBook: false });
    const theirsShared = f.add({ text: 'Shared kite from the other parent.', authorId: 'u-other', inBook: true });
    f.add({ text: 'Private kite of the other parent.', authorId: 'u-other', inBook: false });
    expect(find('kite').sort()).toEqual([own, none, theirsShared].sort());
  });

  it('[NS-02-R4][NS-02-R16b] a hidden, deleted or left book is not searched, and a restored one is again', () => {
    f = findFixture();
    const a = f.add({ text: 'The orchard smelled of rain.' });
    children.hide(f.ctx, 'child-asha');
    expect(find('orchard')).toEqual([]);
    children.unhide(f.ctx, 'child-asha');
    expect(find('orchard')).toEqual([a]);
    expect(wipe.markDeleted(f.ctx, 'child-asha')).toBe(true);
    expect(find('orchard')).toEqual([]);
    expect(wipe.unmarkDeleted(f.ctx, 'child-asha')).toBe(true);
    expect(find('orchard')).toEqual([a]);
    f.db.run("UPDATE children SET server_state = 'left' WHERE id = 'child-asha'");
    expect(find('orchard')).toEqual([]);
  });
});

describe('[NS-02-R16b] a hidden letter is not found at once', () => {
  it('[NS-02-R16b] a letter deleted by a write no repo saw (a sync merge) is not found from that moment', () => {
    f = findFixture();
    const a = f.add({ text: 'The lantern was lit.' });
    expect(find('lantern')).toEqual([a]);
    f.db.run("UPDATE entries SET deleted_at = '2026-10-04T00:00:00.000Z' WHERE id = ?", a);
    expect(find('lantern')).toEqual([]);
  });

  it('[NS-02-R16b] a registered visibility clause (the seal build) hides a letter until it holds again', () => {
    f = findFixture();
    f.db.exec('CREATE TABLE sealed_fixture (entry_id TEXT PRIMARY KEY)');
    registerFindExtraSource({ id: 'seal', available: () => true, textSql: 'NULL', visibleSql: 'e.id NOT IN (SELECT entry_id FROM sealed_fixture)' });
    const id = f.add({ text: 'A letter for the eighteenth birthday, with a secret recipe.' });
    expect(find('recipe')).toEqual([id]);
    f.db.run('INSERT INTO sealed_fixture VALUES (?)', id);
    expect(find('recipe')).toEqual([]);
    f.db.run('DELETE FROM sealed_fixture WHERE entry_id = ?', id); // its day arrives
    expect(find('recipe')).toEqual([id]);
  });
});

describe('[NS-02-R10] order', () => {
  it("[NS-02-R10] results are newest first by the letter's own date, then capture time, then id", () => {
    f = findFixture();
    const old = f.add({ text: 'The ducks, early.', occurredOn: '2026-05-01' });
    const mid = f.add({ text: 'The ducks again.', occurredOn: '2026-07-04' });
    const recent = f.add({ text: 'More ducks.', occurredOn: '2026-09-30' });
    expect(find('ducks')).toEqual([recent, mid, old]);
  });
});

describe('[NS-02-R17][NS-02-R33] letters without kept words are not found', () => {
  it('[NS-02-R17] a spoken letter waiting for its words, and a letter with no words, are not found', () => {
    f = findFixture();
    f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken' });
    f.add({ text: '   ' });
    const kept = f.add({ text: 'Kept words about the review.' });
    expect(find('review')).toEqual([kept]);
    ensureSearchView(f.db);
    expect(f.db.all('SELECT id FROM searchable_letters')).toEqual([{ id: kept }]);
  });

  it('[NS-02-R33] machine words the author has not kept from Review yet are not found; once kept, they are', () => {
    f = findFixture();
    const id = f.add({ text: '', transcriptStatus: 'waiting', captureMode: 'spoken', rawTranscript: '' });
    entries.setWordsOnce(f.ctx, id, { rawTranscript: 'the harbour', machineEdits: [], finalText: 'The harbour.', editLevel: 'clean', engineVersion: 5 });
    expect(find('harbour')).toEqual([]); // 'unreviewed' (M17): words exist but are not kept
    expect(entries.markWordsReviewed(f.ctx, id)).toBe(true);
    expect(find('harbour')).toEqual([id]);
  });
});

describe('[NS-02-R7][NS-02-R8][NS-02-R3] scripts, through the scan', () => {
  it('[NS-02-R7] French, Spanish and Portuguese words are found without their accents, and with them', () => {
    f = findFixture();
    const fr = f.add({ text: 'Un caf\u00e9 avec maman, puis une tarte.' });
    const es = f.add({ text: 'El ni\u00f1o comi\u00f3 pi\u00f1a en la playa.' });
    const pt = f.add({ text: 'Um abra\u00e7o cheio de cora\u00e7\u00e3o.' });
    const plain = f.add({ text: 'We had cafe and a long walk.' });
    expect(find('cafe').sort()).toEqual([fr, plain].sort());
    expect(find('caf\u00e9').sort()).toEqual([fr, plain].sort());
    expect(find('nino pina')).toEqual([es]);
    expect(find('coracao')).toEqual([pt]);
  });

  it('[NS-02-R8] whole Devanagari and Arabic words find their letters; two Devanagari characters are below the floor', () => {
    f = findFixture();
    const hi = f.add({ text: '\u0906\u091c \u0906\u0936\u093e \u0928\u0947 \u0928\u093e\u0935 \u0926\u0947\u0916\u0940 \u0914\u0930 \u0939\u0901\u0938\u0940\u0964' });
    const ar = f.add({ text: '\u0631\u0623\u062a \u0622\u0634\u0627 \u0642\u0627\u0631\u0628 \u0623\u0632\u0631\u0642 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0621.' });
    expect(find('\u0928\u093e\u0935')).toEqual([hi]);
    expect(find('\u0926\u0947\u0916\u0940')).toEqual([hi]);
    expect(find('\u0928\u0935')).toEqual([]);
    expect(find('\u0642\u0627\u0631\u0628')).toEqual([ar]);
  });

  it('[NS-02-R3] one CJK character finds a character inside a run of text', () => {
    f = findFixture();
    const zh = f.add({ text: '\u6211\u4eec\u770b\u5230\u4e86\u4e00\u53ea\u5c0f\u8239\uff0c\u5979\u7b11\u4e86\u3002' });
    f.add({ text: '\u4eca\u5929\u4e0b\u96e8\u4e86\u3002' });
    expect(find('\u8239')).toEqual([zh]);
    expect(find('\u5c0f\u8239 \u7b11')).toEqual([zh]);
  });
});
