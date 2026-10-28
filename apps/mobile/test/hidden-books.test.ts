/// <reference types="node" />
/**
 * Hidden books (package P6d; PRD B-REQ-014, F09-REQ-016, WP-F09-09): "Hide this book" has a way back. The rules are
 * pure (components/settings/hidden-books.logic.ts) and run here, the store's hide and show run on a real database, and
 * the screen's use of them is pinned in its source. Fixtures: the fictional family Asha and Avi.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@scribe/content';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { HIDDEN_BOOKS_HREF, hiddenBooksPage, hiddenBooksRow } = await import('../src/components/settings/hidden-books.logic');

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const s = en.children.settings;

describe('[P6d] the Hidden books row and page', () => {
  it('Settings home shows the row only while a book is hidden', () => {
    expect(hiddenBooksRow([])).toBeNull();
    expect(hiddenBooksRow([{ id: 'avi', name: 'Avi' }])).toEqual({ title: 'Hidden books', href: '/settings/children/hidden' });
    expect(HIDDEN_BOOKS_HREF).toBe('/settings/children/hidden');
  });

  it('the page lists each hidden book with "Show this book again", or says there are none, in content\'s words', () => {
    expect(hiddenBooksPage([])).toEqual({ title: s.hiddenTitle, empty: 'No hidden books.', books: [] });
    const page = hiddenBooksPage([
      { id: 'avi', name: 'Avi' },
      { id: 'nila', name: 'Nila' },
    ]);
    expect(page.empty).toBeNull();
    expect(page.books).toEqual([
      { id: 'avi', name: 'Avi', button: 'Show this book again', buttonLabel: 'Show this book again, Avi' },
      { id: 'nila', name: 'Nila', button: 'Show this book again', buttonLabel: 'Show this book again, Nila' },
    ]);
    // The words were in content already, shown by nothing until now: no new line, no count.
    expect([s.hiddenTitle, s.showButton, s.hiddenEmpty]).toEqual(['Hidden books', 'Show this book again', 'No hidden books.']);
    for (const line of [page.title, ...page.books.map((b) => b.buttonLabel)]) expect(line, line).not.toMatch(/\d/);
  });
});

describe('[P6d] hiding and showing again, on the real store: nothing is deleted', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-17T19:05:00.000Z', newId }).ok).toBe(true);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('a hidden book leaves the list and its letters stay; Show this book again brings it back as it was', () => {
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    const avi = store.addChild({ name: 'Avi', birthday: '2026-09-20', dueDate: null, signsAs: 'Mama' });
    const d = store.createDraft({ childId: avi.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Avi, you held my finger all night.' });
    const entriesBefore = store.listEntriesForChild(avi.id).length;

    store.hideChild(avi.id);
    expect(store.listChildren().map((c) => c.name)).toEqual(['Asha']);
    expect(store.listHiddenChildren().map((c) => c.name)).toEqual(['Avi']);
    expect(hiddenBooksRow(store.listHiddenChildren())).not.toBeNull();
    expect(store.getDraft(d.id)?.typedText).toBe('Avi, you held my finger all night.');

    store.unhideChild(avi.id);
    expect(store.listChildren().map((c) => c.name).sort()).toEqual(['Asha', 'Avi']);
    expect(store.listHiddenChildren()).toEqual([]);
    expect(hiddenBooksRow(store.listHiddenChildren())).toBeNull();
    expect(store.getChild(avi.id)).toMatchObject({ name: 'Avi', birthday: '2026-09-20', signsAs: 'Mama' });
    expect(store.listEntriesForChild(avi.id).length).toBe(entriesBefore);
    expect(store.getDraft(d.id)?.typedText).toBe('Avi, you held my finger all night.');
  });
});

describe('[P6d] the screen', () => {
  const screen = code('app/settings/children/hidden.tsx');

  it('Show this book again only unhides: no delete, no remove, no confirm needed', () => {
    const show = screen.slice(screen.indexOf('const show = '), screen.indexOf('return ('));
    expect(show).toMatch(/unhideChild\(id\);/);
    expect(show).not.toMatch(/delete|Delete|remove|discard|purge|Alert/);
    // Which setting only, never the value, the same key "Hide this book" sends.
    expect(show).toMatch(/track\('child_setting_changed', \{ key: 'hidden', child_ordinal: ordinalOf\(id\) \}\);/);
  });

  it('draws the page from the rules, in content\'s words only, and follows the store', () => {
    expect(screen).toMatch(/const page = hiddenBooksPage\(hidden\);/);
    expect(screen).toMatch(/<Stack\.Screen options=\{\{ title: page\.title \}\} \/>/);
    expect(screen).toMatch(/\{page\.empty\}/);
    expect(screen).toMatch(/label=\{b\.button\} accessibilityLabel=\{b\.buttonLabel\}/);
    expect(screen).toMatch(/subscribe\(\(\) => setHidden\(listHiddenChildren\(\)\)\)/);
    // Every Text child is a lookup, never a literal sentence.
    expect(screen).not.toMatch(/<Text[^>]*>\s*[A-Za-z][^<{]*</);
    // VoiceOver lands on what is next after a book comes back.
    expect(screen).toMatch(/useFocusOnMount\(first, shown > 0, shown\)/);
  });

  it('the web preview can show it: ?seed=asha-hidden adds Avi\'s book, hidden', () => {
    const seed = code('dev/asha-seed.ts');
    expect(seed).toMatch(/if \(opts\.hidden\) \{[\s\S]*addChild\(\{ name: 'Avi'[\s\S]*hideChild\(avi\.id\);/);
    expect(code('dev/store-ready.web.ts')).toMatch(/hidden: seed === 'asha-hidden'/);
  });
});
