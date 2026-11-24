/// <reference types="node" />
/**
 * BL-413: "Change words" on a saved letter's page (journeys J10-17, J01-04 "read each letter and fix anything we got
 * wrong"). Through the store, on real SQLite (node:sqlite): the person's words are a person edit, raw_transcript and the
 * machine edits never change, every edit can be put back on its own, and with sync on each write is one entry.upsert of
 * the words group. Also the v14 column on an existing phone, the row text, when the page offers the control, and the
 * page's wiring (screens do not load in Node, so the page's lines are pinned in source). Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MIGRATIONS, migrate, userVersion } from '../src/lib/db/migrations';
import { changeRow, offersChangeWords } from '../src/components/book/change-words.logic';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { takeOwnership } = await import('../src/lib/sync/ownership');

const MAMA = '11111111-1111-1111-1111-111111111111';
let close: () => void = () => {};
let seq = 0;
const now = () => '2026-10-03T09:00:00.000Z';
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let raw: ReturnType<typeof nodeDb>['db'];

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  raw = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

const SAID = 'um Usher you laughed at the the rain';
const KEPT = 'Usher, you laughed at the rain.';
function keep(): string {
  const childId = store.addChild({ name: 'Asha', birthday: '2026-03-13', dueDate: null, signsAs: 'Mama' }).id;
  const d = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: SAID });
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: '2026-08-20', capturedAt: now(), captureMode: 'typed', editLevel: 'clean', promptKey: null,
    engineVersion: 5, rawTranscript: SAID, machineEdits: [], finalText: KEPT, inBook: true, soundsLikeMe: null, childId, authorSignsAs: 'Mama', audioUri: null,
  });
  return d.id;
}
const words = (id: string) => raw.get<{ raw_transcript: string; machine_edits: string; final_text: string }>(
  'SELECT raw_transcript, machine_edits, final_text FROM entries WHERE id = ?', id,
);
const ops = () => raw.all<{ type: string; payload: string }>('SELECT type, payload FROM sync_outbox ORDER BY seq');

describe('[BL-413, constitution] a saved letter can be edited, and every edit can be put back', () => {
  it('Change words keeps raw_transcript and the machine edits; the page reads the person\'s words', () => {
    const id = keep();
    const before = words(id)!;
    expect(store.canChangeLetterWords(id)).toBe(true);
    expect(store.changeLetterWords(id, 'Asha, you laughed at the rain.')).toBe(true);
    expect(store.getEntry(id)).toMatchObject({ finalText: 'Asha, you laughed at the rain.', rawTranscript: SAID });
    expect(words(id)).toMatchObject({ raw_transcript: before.raw_transcript, machine_edits: before.machine_edits });
  });

  it('two edits, each put back on its own: the letter ends exactly as kept', () => {
    const id = keep();
    store.changeLetterWords(id, 'Asha, you laughed in the rain.');
    const layer = store.letterAuthorEdits(id)!;
    expect(layer.edits).toHaveLength(2);
    expect(store.putBackLetterEdit(id, layer.edits[0])).toBe(true);
    expect(store.getEntry(id)?.finalText).toBe('Usher, you laughed in the rain.');
    expect(store.putBackLetterEdit(id, store.letterAuthorEdits(id)!.edits[0])).toBe(true);
    expect(store.getEntry(id)?.finalText).toBe(KEPT);
    expect(store.letterAuthorEdits(id)).toBeNull();
    expect(words(id)!.raw_transcript).toBe(SAID);
  });

  it('with sync on, an edit and its put back go out as an entry.upsert of the words group, raw unchanged', () => {
    takeOwnership(raw, MAMA, { now: now(), newId });
    const id = keep();
    raw.run('DELETE FROM sync_outbox');
    raw.run("UPDATE entries SET server_version = '5', sync_state = 'synced' WHERE id = ?", id);
    const sent = () => ops().map((o) => ({ type: o.type, ...(JSON.parse(o.payload) as { changed: string[]; data: Record<string, unknown> }) }));
    store.changeLetterWords(id, 'Asha, you laughed at the rain.');
    expect(sent()).toMatchObject([{ type: 'entry.upsert', changed: ['text'], data: { final_text: 'Asha, you laughed at the rain.', raw_transcript: SAID } }]);
    // Not sent yet: the outbox folds the put back into the same op, so the server gets the letter's words as they are now.
    store.putBackLetterEdit(id, store.letterAuthorEdits(id)!.edits[0]);
    expect(sent()).toMatchObject([{ type: 'entry.upsert', changed: ['text'], data: { final_text: KEPT, raw_transcript: SAID } }]);
    expect(store.getEntry(id)?.syncState).toBe('pending');
  });

  it('a letter in a book this phone has left is refused, and not offered', () => {
    const id = keep();
    raw.run("UPDATE children SET server_state = 'left'");
    expect(store.canChangeLetterWords(id)).toBe(false);
    expect(store.changeLetterWords(id, 'Asha, you laughed at the rain.')).toBe(false);
    expect(store.getEntry(id)?.finalText).toBe(KEPT);
  });

  it('the page follows the store: each write tells the entries list once', () => {
    const id = keep();
    let told = 0;
    const stop = store.subscribeTo('entries', () => told++);
    store.changeLetterWords(id, 'Asha, you laughed at the rain.');
    store.putBackLetterEdit(id, store.letterAuthorEdits(id)!.edits[0]);
    stop();
    expect(told).toBe(2);
  });
});

describe('[BL-413] local schema v14: author_base on a phone that already has letters', () => {
  it('adds the column, empty, and keeps every letter as it was', () => {
    const { db, close: shut } = nodeDb();
    try {
      migrate(db, { now: now(), newId }, MIGRATIONS.filter((m) => m.version <= 13));
      db.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version, raw_transcript,
           machine_edits, final_text, in_book, updated_at) VALUES ('e1', 'letter', '2026-09-01', ?, 'typed', 'verbatim', NULL, 2, ?, '[]', ?, 1, ?)`,
        now(), KEPT, KEPT, now(),
      );
      migrate(db, { now: now(), newId });
      expect(userVersion(db)).toBe(14);
      expect(db.get('SELECT final_text, raw_transcript, author_base FROM entries WHERE id = ?', 'e1')).toEqual({ final_text: KEPT, raw_transcript: KEPT, author_base: null });
    } finally {
      shut();
    }
  });
});

describe('[BL-413] each change row says what the words read as kept and what they read now', () => {
  const base = 'Usher laughed at the rain.';
  it('a changed word: the two words', () => {
    expect(changeRow(base, { start: 0, end: 5, replacement: 'Asha' })).toEqual({ from: 'Usher', to: 'Asha' });
  });
  it('words only added or only taken out: the word on each side is named too, so neither side is empty', () => {
    expect(changeRow(base, { start: 13, end: 13, replacement: ' loudly' })).toEqual({ from: 'laughed at', to: 'laughed loudly at' });
    expect(changeRow(base, { start: 13, end: 16, replacement: '' })).toEqual({ from: 'laughed at the', to: 'laughed the' });
  });
  it('a change that reads the same once trimmed (a line break) shows its neighbours, so the two sides differ', () => {
    expect(changeRow(base, { start: 13, end: 14, replacement: '\n' })).toEqual({ from: 'laughed at', to: 'laughed\nat' });
  });
  it('at the very start, only the word after is named', () => {
    expect(changeRow(base, { start: 0, end: 0, replacement: 'Oh ' })).toEqual({ from: 'Usher', to: 'Oh Usher' });
  });
});

describe('[BL-413] when the letter page offers Change words', () => {
  it('only for the person\'s own letter, with words on the page, that the store would change', () => {
    expect(offersChangeWords({ editable: true, hasWords: true, canChange: true })).toBe(true);
    expect(offersChangeWords({ editable: false, hasWords: true, canChange: true })).toBe(false);
    expect(offersChangeWords({ editable: true, hasWords: false, canChange: true })).toBe(false);
    expect(offersChangeWords({ editable: true, hasWords: true, canChange: false })).toBe(false);
  });
});

describe('[BL-413, J10-17] the letter page is wired this way', () => {
  const page = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8');
  const sheet = readFileSync(join(__dirname, '..', 'src', 'components', 'book', 'change-words.tsx'), 'utf8');

  it('offers Change words from the store\'s own rule, and draws the rows that put each change back', () => {
    expect(page).toMatch(/offersChangeWords\(\{[^}]*canChangeLetterWords\(entry\.id\)/);
    expect(page).toMatch(/\{changeWords && \(\s*<ListRow\s+title=\{copy\.review\.editTextButton\}/);
    expect(page).toContain('{changeWords && <ChangeRows entryId={entry.id} />}');
    expect(sheet).toContain('changeLetterWords(entry.id, text)');
    expect(sheet).toContain('putBackLetterEdit(entryId, edit)');
  });

  it('a letter whose words arrived in the background still opens Review from its card, before anything else', () => {
    expect(page).toMatch(/if \(entry\.wordsUnreviewed\) return router\.push\(\{ pathname: '\/review', params: \{ entryId: entry\.id \} \}\);/);
  });
});
