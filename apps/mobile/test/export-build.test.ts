/// <reference types="node" />
/**
 * The export builder's pure rules (DELETION_AND_EXPORT_SPEC 4.1, 4.2; LEGAL-REQ-034;
 * DATA-REQ-050; D-084, D-085), unit by unit: file and folder names, ordering,
 * chapters and years, what counts as a missing recording, the printable set,
 * and the data rows. The golden test proves the whole ZIP; this proves each
 * rule on its own with a small fictional Asha snapshot.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import {
  audioMissingReason,
  audioPath,
  bookHtml,
  chapterName,
  childFolders,
  dataFiles,
  escapeHtml,
  letterPath,
  monthOf,
  oldestFirst,
  paperFor,
  paragraphs,
  phoneConsent,
  planExport,
  safeSegment,
  yearOf,
  type ExportSnapshot,
  type SnapshotChild,
  type SnapshotEntry,
} from '../src/lib/export/build.logic';
import type { EntriesFile, ChildrenFile, AccountFile } from '../src/lib/export/schema';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const ASHA: SnapshotChild = { id: 'child-asha-0001', name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false, hidden: false };
const DEV: SnapshotChild = { ...ASHA, id: 'child-dev-0002', name: 'आशा', birthday: null, dueDate: '2027-01-15', hidden: true };

function entry(p: Partial<SnapshotEntry> & Pick<SnapshotEntry, 'id' | 'occurredOn'>): SnapshotEntry {
  return {
    kind: 'letter',
    capturedAt: `${p.occurredOn}T19:30:00.000Z`,
    captureMode: 'spoken',
    editLevel: 'clean',
    promptKey: null,
    engineVersion: 3,
    rawTranscript: 'um Asha you laughed',
    machineEdits: [{ type: 'filler', start: 0, end: 3, original: 'um ', replacement: '', source: 'rule' }],
    finalText: 'Asha, you laughed.',
    inBook: true,
    soundsLikeMe: null,
    childId: ASHA.id,
    authorSignsAs: 'Mama',
    audioUri: `file:///doc/audio/${p.id}.m4a`,
    audioDurationMs: 12_000,
    audioSha256: 'a'.repeat(64),
    audioBytes: 4096,
    transcriptStatus: null,
    own: true,
    audioOnPhone: true,
    audioSizeOnPhone: 4096,
    ...p,
  };
}

const snapshot = (entries: SnapshotEntry[], children: SnapshotChild[] = [ASHA]): ExportSnapshot => ({
  generatedAt: '2026-10-03T09:00:00.000Z', appVersion: '1.0.0', engineVersion: 3, locale: 'en-GB', plan: 'free', signedIn: false, consent: phoneConsent(true, null), children, entries,
});

describe('names and paths', () => {
  it.each([
    ['Asha', 'Asha'],
    ['  Asha  ', 'Asha'],
    ['A/s\\h:a*?"<>|', 'A s h a'],
    ['...Asha...', 'Asha'],
    ['Asha\u0000\u001f\u007f', 'Asha'],
    ['आशा', 'आशा'],
    ['عمر', 'عمر'],
    ['Ashe\u0301', 'Ash\u00e9'], // a decomposed accent is stored composed (NFC)
    ['', 'fallback'],
    ['   ', 'fallback'],
    ['/', 'fallback'],
  ])('safeSegment(%j)', (name, expected) => {
    expect(safeSegment(name, 'fallback')).toBe(expected);
  });

  it('safeSegment cuts at 60 characters a person would count, never inside an emoji or a Devanagari cluster', () => {
    const long = 'a'.repeat(59) + '😀😀';
    expect([...safeSegment(long, 'x')]).toHaveLength(60);
    expect(safeSegment(long, 'x').endsWith('😀')).toBe(true);
    expect(safeSegment('x'.repeat(100), 'f')).toHaveLength(60);
  });

  it('childFolders: one folder per child, same names (any case) get the id added, empty names get a fallback', () => {
    const twins = childFolders([{ id: 'id-aaaaaaaa-1', name: 'Asha' }, { id: 'id-bbbbbbbb-2', name: 'asha' }, { id: 'id-cccccccc-3', name: 'Avi' }, { id: 'id-dddddddd-4', name: ' ' }]);
    expect(twins.get('id-aaaaaaaa-1')).toBe('Asha-id-aaaaa');
    expect(twins.get('id-bbbbbbbb-2')).toBe('asha-id-bbbbb');
    expect(twins.get('id-cccccccc-3')).toBe('Avi');
    expect(twins.get('id-dddddddd-4')).toBe('book-id-ddddd');
  });

  it('letterPath and audioPath are flat, dated and unique per letter', () => {
    expect(letterPath('Asha', { id: 'e1', occurredOn: '2026-10-03' })).toBe('letters/Asha/2026-10/2026-10-03_e1.txt');
    expect(letterPath('Asha', { id: 'e1', occurredOn: '2026-10-03T19:00:00Z' })).toBe('letters/Asha/2026-10/2026-10-03_e1.txt');
    expect(audioPath('e1')).toBe('audio/e1.m4a');
  });

  it('oldestFirst orders by day, then capture time, then id, and does not change its input', () => {
    const input = [
      { id: 'b', occurredOn: '2026-10-03', capturedAt: '2026-10-03T20:00:00Z' },
      { id: 'a', occurredOn: '2026-10-03', capturedAt: '2026-10-03T20:00:00Z' },
      { id: 'c', occurredOn: '2026-10-03', capturedAt: '2026-10-03T08:00:00Z' },
      { id: 'd', occurredOn: '2026-09-30', capturedAt: '2026-10-03T23:00:00Z' },
    ];
    const copy = [...input];
    expect(oldestFirst(input).map((e) => e.id)).toEqual(['d', 'c', 'a', 'b']);
    expect(input).toEqual(copy);
  });
});

describe('chapters, years and paper', () => {
  it('monthOf: null before birth or without a birthday, 0 in the first weeks, then the month of age', () => {
    expect(monthOf({ birthday: null }, '2026-10-03')).toBeNull();
    expect(monthOf(ASHA, '2026-03-07')).toBeNull();
    expect(monthOf(ASHA, '2026-03-08')).toBe(0);
    expect(monthOf(ASHA, '2026-04-07')).toBe(0);
    expect(monthOf(ASHA, '2026-04-08')).toBe(1);
    expect(monthOf(ASHA, '2027-03-08')).toBe(12);
  });

  it('chapterName and yearOf: Before You, the newborn month, numbered months, years of twelve', () => {
    expect(chapterName(null)).toBe(en.book.beforeYouChapter);
    expect(chapterName(0)).toBe(en.book.chapterNewborn);
    expect(chapterName(16)).toBe(en.book.chapterTitle.replace('{month}', '16'));
    expect(chapterName(null)).not.toBe(chapterName(0));
    expect(chapterName(0)).not.toBe(chapterName(1));
    expect(chapterName(16)).toContain('16');
    expect([null, 0, 11].map(yearOf)).toEqual([1, 1, 1]);
    expect([12, 23, 24].map(yearOf)).toEqual([2, 2, 3]);
  });

  it.each([
    ['en-US', 'letter'],
    ['en-CA', 'letter'],
    ['es-MX', 'letter'],
    ['es_mx', 'letter'],
    ['en-GB', 'a4'],
    ['en-IN', 'a4'],
    ['pt-BR', 'a4'],
    ['en', 'a4'],
    ['', 'a4'],
  ])('paperFor(%s) is %s', (locale, name) => {
    const p = paperFor(locale);
    expect(p.name).toBe(name);
    expect(p).toEqual(name === 'letter' ? { width: 612, height: 792, name } : { width: 595, height: 842, name });
  });
});

describe('recordings', () => {
  it.each([
    ['typed: never a recording', { captureMode: 'typed' as const }, null],
    ['a family letter: the recording stays on their phone', { own: false }, 'not_on_this_device'],
    ['own, recordings were off: nothing to miss', { audioUri: null, audioOnPhone: false }, null],
    ['own, file gone', { audioOnPhone: false }, 'not_on_this_device'],
    ['own, file here', {}, null],
    ['mixed (typed words on a recording) counts as spoken', { captureMode: 'mixed' as const, audioOnPhone: false }, 'not_on_this_device'],
  ])('audioMissingReason: %s', (_name, over, reason) => {
    expect(audioMissingReason(entry({ id: 'e', occurredOn: '2026-10-03', ...over }))).toBe(reason);
  });

  it('planExport packs a recording only when it is own, spoken, named and on this phone', () => {
    const plan = planExport(
      snapshot([
        entry({ id: 'own', occurredOn: '2026-10-01' }),
        entry({ id: 'fam', occurredOn: '2026-10-02', own: false }),
        entry({ id: 'typed', occurredOn: '2026-10-03', captureMode: 'typed', audioUri: null }),
        entry({ id: 'gone', occurredOn: '2026-10-04', audioOnPhone: false, audioSizeOnPhone: null }),
      ]),
    );
    expect(plan.audio).toEqual([{ entryId: 'own', uri: 'file:///doc/audio/own.m4a', path: 'audio/own.m4a', recordedSha256: 'a'.repeat(64), durationMs: 12_000, sizeHint: 4096 }]);
  });
});

describe('the plan', () => {
  it('[D-085] a letter of a book that is not in the snapshot (deleted) is left out; a hidden book is exported', () => {
    const plan = planExport(snapshot([entry({ id: 'a', occurredOn: '2026-10-01' }), entry({ id: 'z', occurredOn: '2026-10-02', childId: 'child-gone' }), entry({ id: 'd', occurredOn: '2026-10-02', childId: DEV.id })], [ASHA, DEV]));
    const paths = plan.textFiles.map((f) => f.path);
    expect(paths).toContain('letters/Asha/2026-10/2026-10-01_a.txt');
    expect(paths).toContain('letters/आशा/2026-10/2026-10-02_d.txt');
    expect(paths.some((p) => p.includes('_z.txt'))).toBe(false);
    expect(paths.slice(0, 2)).toEqual(['README.txt', 'schema/export-v1.schema.json']);
    expect(paths[paths.length - 1]).toBe('index.html');
  });

  it('[D-084] the printable book holds only letters in the book with words: no private, waiting, empty or quiet-day rows', () => {
    const plan = planExport(
      snapshot([
        entry({ id: 'in', occurredOn: '2026-10-01' }),
        entry({ id: 'private', occurredOn: '2026-10-02', inBook: false }),
        entry({ id: 'waiting', occurredOn: '2026-10-03', transcriptStatus: 'waiting', finalText: '', rawTranscript: '' }),
        entry({ id: 'empty', occurredOn: '2026-10-04', finalText: '   ' }),
        entry({ id: 'mark', occurredOn: '2026-10-05', kind: 'not_much', inBook: true, finalText: 'Tuesday. Not much today.', captureMode: 'typed', audioUri: null }),
      ]),
    );
    expect(plan.books).toHaveLength(1);
    expect(plan.books[0]).toMatchObject({ childId: ASHA.id, path: 'book/Asha.pdf', letters: 1 });
    expect(plan.books[0].html).toContain('Asha, you laughed.');
    expect(plan.books[0].html).not.toContain('Not much today');
    const noBook = planExport(snapshot([entry({ id: 'private', occurredOn: '2026-10-02', inBook: false })]));
    expect(noBook.books).toEqual([]);
  });

  it('[D-084] a quiet-day letter file carries the date and the label only; the old sentence never appears anywhere', () => {
    const plan = planExport(snapshot([entry({ id: 'mark', occurredOn: '2026-10-05', kind: 'not_much', inBook: true, finalText: 'Tuesday. Not much today. Just Asha.', rawTranscript: 'Tuesday. Not much today. Just Asha.', captureMode: 'typed', audioUri: null })]));
    const text = plan.textFiles.find((f) => f.path.endsWith('_mark.txt'))!.text;
    expect(text).not.toMatch(/Not much today|Just Asha|Mama|To:|From:/);
    expect(text.split('\n')[0]).toMatch(/^Date: /);
    const index = plan.textFiles.find((f) => f.path === 'index.html')!.text;
    expect(index).not.toContain('Not much today');
    expect(index).toContain('class="mark"');
  });

  it('[DATA-REQ-050] an own spoken letter file shows the words as heard only when they differ; a family letter never does', () => {
    const plan = planExport(snapshot([entry({ id: 'fixed', occurredOn: '2026-10-01' }), entry({ id: 'exact', occurredOn: '2026-10-02', rawTranscript: 'Asha, you laughed.' }), entry({ id: 'fam', occurredOn: '2026-10-03', own: false, authorSignsAs: 'Nani' })]));
    const file = (id: string) => plan.textFiles.find((f) => f.path.endsWith(`_${id}.txt`))!.text;
    expect(file('fixed')).toContain('um Asha you laughed');
    expect(file('exact')).not.toContain('Exactly');
    expect(file('fam')).not.toContain('um Asha you laughed');
    expect(file('fam')).toContain('From: Nani');
    expect(file('fam')).toContain('Recording: Not on this phone');
  });
});

describe('the data files', () => {
  const sha256Text = async (t: string) => sha(t);

  async function build(entries: SnapshotEntry[], children: SnapshotChild[] = [ASHA], results = new Map<string, { sha256: string; bytes: number }>()) {
    const s = snapshot(entries, children);
    const plan = planExport(s);
    const { files, audioMissing } = await dataFiles(s, plan, results, sha256Text);
    const read = <T,>(path: string) => JSON.parse(files.find((f) => f.path === path)!.text) as T;
    return { plan, audioMissing, entries: read<EntriesFile>('data/entries.json'), children: read<ChildrenFile>('data/children.json'), account: read<AccountFile>('data/account.json') };
  }

  it('[DATA-REQ-050] own rows carry raw, its hash, every machine edit and the engine; family rows carry none of that', async () => {
    const { entries } = await build([entry({ id: 'own', occurredOn: '2026-10-01' }), entry({ id: 'fam', occurredOn: '2026-10-02', own: false })]);
    const own = entries.entries.find((e) => e.id === 'own')!;
    const fam = entries.entries.find((e) => e.id === 'fam')!;
    expect(own.raw_transcript).toBe('um Asha you laughed');
    expect(own.raw_sha256).toBe(sha('um Asha you laughed'));
    expect(own.machine_edits).toEqual([{ type: 'filler', start: 0, end: 3, original: 'um ', replacement: '', source: 'rule' }]);
    expect(own.engine_version).toBe(3);
    expect(own.author).toEqual({ signs_as: 'Mama', is_exporter: true });
    for (const key of ['raw_transcript', 'raw_sha256', 'machine_edits', 'engine_version', 'prompt_key', 'sounds_like_me', 'stt_meta', 'alignment']) expect(fam, key).not.toHaveProperty(key);
    expect(fam.author.is_exporter).toBe(false);
  });

  it('[DATA-REQ-046] audio integrity: ok when the packed hash matches, mismatch when it changed, unchecked when none was recorded', async () => {
    const results = new Map([
      ['ok', { sha256: 'a'.repeat(64), bytes: 4096 }],
      ['changed', { sha256: 'b'.repeat(64), bytes: 4000 }],
      ['none', { sha256: 'c'.repeat(64), bytes: 10 }],
    ]);
    const { entries, audioMissing } = await build(
      [entry({ id: 'ok', occurredOn: '2026-10-01' }), entry({ id: 'changed', occurredOn: '2026-10-02' }), entry({ id: 'none', occurredOn: '2026-10-03', audioSha256: null }), entry({ id: 'unread', occurredOn: '2026-10-04' })],
      [ASHA],
      results,
    );
    const by = Object.fromEntries(entries.entries.map((e) => [e.id, e]));
    expect(by.ok.audio).toMatchObject({ path: 'audio/ok.m4a', integrity: 'ok', recorded_sha256: 'a'.repeat(64), bytes: 4096, duration_ms: 12_000, codec: 'aac-lc', media_type: 'audio/mp4' });
    expect(by.changed.audio?.integrity).toBe('mismatch');
    expect(by.none.audio).toMatchObject({ integrity: 'unchecked', recorded_sha256: null });
    // planned but not readable at packing time: reported as missing, never as a bad hash
    expect(by.unread.audio).toBeNull();
    expect(by.unread.audio_missing).toEqual({ reason: 'not_on_this_device' });
    expect(audioMissing).toBe(1);
  });

  it('[D-084] a quiet-day row keeps kind not_much with no words, whatever an old row stored, and is not in the book', async () => {
    const { entries } = await build([entry({ id: 'mark', occurredOn: '2026-10-05', kind: 'not_much', inBook: true, finalText: 'Tuesday. Not much today.', rawTranscript: 'Tuesday. Not much today.', captureMode: 'typed', audioUri: null })]);
    const [row] = entries.entries;
    expect(row).toMatchObject({ kind: 'not_much', final_text: '', words: 'ready', in_book: true, audio: null, audio_missing: null });
    expect(row.raw_transcript).toBe('Tuesday. Not much today.'); // the raw never changes (DATA-REQ-040); the words shown are empty
  });

  it('a waiting letter says so and carries no words; children.json lists every signature used and the book file', async () => {
    const { entries, children, account, plan } = await build(
      [entry({ id: 'w', occurredOn: '2026-10-01', transcriptStatus: 'waiting', finalText: '', rawTranscript: '' }), entry({ id: 'p', occurredOn: '2026-10-02', authorSignsAs: 'Papa' }), entry({ id: 'd', occurredOn: '2026-10-03', childId: DEV.id, inBook: false })],
      [ASHA, DEV],
    );
    expect(entries.entries.find((e) => e.id === 'w')).toMatchObject({ words: 'waiting_for_words', final_text: '' });
    const asha = children.children.find((c) => c.id === ASHA.id)!;
    expect(asha.signatures).toEqual(['Mama', 'Papa']);
    expect(asha.book_file).toBe('book/Asha.pdf');
    const dev = children.children.find((c) => c.id === DEV.id)!;
    expect(dev).toMatchObject({ hidden: true, due_date: '2027-01-15', birthday: null, book_file: null, signatures: ['Mama'] });
    expect(plan.books.map((b) => b.childId)).toEqual([ASHA.id]);
    expect(account).toMatchObject({ signed_in: false, plan: 'free', exported_from: 'phone' });
    expect(account.memberships).toEqual([{ child_id: ASHA.id, role: 'parent', signs_as: 'Mama' }, { child_id: DEV.id, role: 'parent', signs_as: 'Mama' }]);
  });
});

describe('HTML helpers and the printable book', () => {
  it('escapeHtml and paragraphs keep a person\'s words safe inside markup', () => {
    expect(escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
    expect(paragraphs('One line.\nSecond line.\n\n\n  Third paragraph. <3 ')).toBe('<p dir="auto">One line.<br>Second line.</p>\n<p dir="auto">Third paragraph. &lt;3</p>');
    expect(paragraphs('')).toBe('');
  });

  it('bookHtml: a single year has no year headings; two years get them once each; the cover names the child', () => {
    const one = bookHtml(ASHA, [entry({ id: 'a', occurredOn: '2026-10-01' })], 'en-GB');
    expect(one).not.toContain('class="year"');
    expect(one).toContain('Asha');
    const two = bookHtml(ASHA, [entry({ id: 'a', occurredOn: '2026-10-01' }), entry({ id: 'b', occurredOn: '2027-05-01' })], 'en-GB');
    expect(two.match(/class="year"/g)).toHaveLength(2);
    expect(two.indexOf('2026') < two.indexOf('2027')).toBe(true);
  });

  it('bookHtml never prints a quiet-day mark, a waiting letter or a private letter even when handed them', () => {
    const html = bookHtml(
      ASHA,
      [
        entry({ id: 'mark', occurredOn: '2026-10-05', kind: 'not_much', inBook: true, finalText: 'Tuesday. Not much today.', captureMode: 'typed', audioUri: null }),
        entry({ id: 'w', occurredOn: '2026-10-06', transcriptStatus: 'waiting', finalText: 'should not print' }),
        entry({ id: 'p', occurredOn: '2026-10-07', inBook: false, finalText: 'private words' }),
      ],
      'en-GB',
    );
    expect(html).not.toMatch(/Not much today|should not print|private words/);
    expect(html).not.toContain('<article>');
  });
});
