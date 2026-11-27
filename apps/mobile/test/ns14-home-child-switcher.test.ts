/// <reference types="node" />
/**
 * NS-14 (docs/product/prd/09-capture.md, BL-941): whose book a letter goes to, with the Book's switcher on Home.
 * The store half runs the real store facade over node:sqlite (as test/store.facade.test.ts does); the screen half
 * reads the screens' source, because Listen, Write, Review and Home are not rendered in Node. The rendered half of
 * R1, R2 and R5 is test/component/home-child-switcher.test.tsx. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';
import { stripComments } from './helpers/strip-comments';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

const src = (p: string) => stripComments(readFileSync(join(__dirname, '..', 'src', p), 'utf8'));
let close: () => void = () => {};
let seq = 0;
const now = () => '2026-11-27T09:00:00.000Z';
const newId = () => `019ac4b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId });
});
afterEach(() => {
  store.closeStore();
  close();
  close = () => {};
});

/** Asha's book first (the active one, as the first book made), then Nila's. */
function twoBooks() {
  const asha = store.addChild({ name: 'Asha', birthday: '2026-03-10', dueDate: null, signsAs: 'Mama' });
  const nila = store.addChild({ name: 'Nila', birthday: '2024-06-02', dueDate: null, signsAs: 'Mama' });
  return { asha, nila };
}

/** What Write does when it opens (write.tsx: the active child, read once) and Keep does in Review (the draft's child). */
function writeAndKeep(text: string) {
  const child = store.getActiveChild()!;
  const d = store.createDraft({ childId: child.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  const kept = store.getDraft(d.id)!;
  expect(store.saveLetterFromDraft(d.id, letter({ id: d.id, childId: kept.childId, captureMode: 'typed', finalText: text, audioUri: null, audioDurationMs: null, audioSha256: null, audioBytes: null }), false)).toBe(true);
  return d.id;
}

describe('[NS-14-R3] the letter files where the parent chose', () => {
  it('[NS-14-R3] the letter files where the parent chose: after a switch to Nila, the next kept letter is in that book', () => {
    const { asha, nila } = twoBooks();
    expect(store.getActiveChildId()).toBe(asha.id);
    store.setActiveChildId(nila.id);
    const id = writeAndKeep('Nila, you found the moon tonight.');
    expect(store.getEntry(id)?.childId).toBe(nila.id);
    expect(store.listEntriesForChild(nila.id).map((e) => e.id)).toContain(id);
    expect(store.listEntriesForChild(asha.id).map((e) => e.id)).not.toContain(id);
  });

  it('[NS-14-R3] every capture takes the book at the moment it starts, and Keep files by the draft, never by the switch', () => {
    // Listen and Write read the active book once, when they open; Review keeps into the draft's own child.
    expect(src('app/listen.tsx')).toMatch(/const \[child\] = useState\(getActiveChild\);/);
    expect(src('app/listen.tsx')).toMatch(/beginTake\(recorder, \{ childId: child\.id/);
    expect(src('app/write.tsx')).toMatch(/const \[child\] = useState\(getActiveChild\);/);
    expect(src('app/write.tsx')).toMatch(/createDraft\(\{ childId: child\.id/);
    expect(src('app/review.tsx')).toMatch(/useState\(draft\?\.childId \?\? ''\)/);
    expect(src('app/review.tsx')).not.toMatch(/getActiveChild/);
  });
});

describe('[NS-14-R4] a draft keeps its child', () => {
  it("[NS-14-R4] a draft keeps its child: a draft waiting for Asha stays Asha's after a switch to Nila, and keeps into Asha's book", () => {
    const { asha, nila } = twoBooks();
    const d = store.createDraft({ childId: asha.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha, the rain.' });
    store.setActiveChildId(nila.id);
    expect(store.getDraft(d.id)?.childId).toBe(asha.id);
    // Home lists the waiting drafts of the book it shows: Asha's waits under Asha's book, not under Nila's.
    expect(store.listDrafts(asha.id).map((x) => x.id)).toContain(d.id);
    expect(store.listDrafts(nila.id).map((x) => x.id)).not.toContain(d.id);
    const kept = store.getDraft(d.id)!;
    expect(store.saveLetterFromDraft(d.id, letter({ id: d.id, childId: kept.childId, captureMode: 'typed', finalText: 'Asha, the rain.', audioUri: null, audioDurationMs: null, audioSha256: null, audioBytes: null }), false)).toBe(true);
    expect(store.getEntry(d.id)?.childId).toBe(asha.id);
  });

  it('[NS-14-R4] the switcher changes only the selection: it never moves a draft or a letter', () => {
    const switcher = src('components/child/child-switcher.tsx');
    expect(switcher).toMatch(/select\(id\);/);
    expect(switcher).not.toMatch(/setDraftChild|updateEntry|saveEntry/);
  });
});

describe('[NS-14-R1] whose book, for VoiceOver', () => {
  it('[NS-14-R1] the switcher names whose book the letters go to, in existing words: "For Asha" as its name, "Asha\'s book" as its value', () => {
    // A new line ("Letters go to {child}'s book", the card's intent) waits for content; until then the name stays the
    // visible label (Voice Control's command) and the value is the book's own title, copy.book.title.
    const switcher = src('components/child/child-switcher.tsx');
    expect(switcher).toMatch(/accessibilityLabel=\{fill\(s\.label, \{ child: active\.name \}\)\}/);
    expect(switcher).toMatch(/accessibilityValue=\{\{ text: fill\(copy\.book\.title, \{ child: active\.name \}\) \}\}/);
    expect(switcher).toMatch(/accessibilityHint=\{s\.hint\}/);
  });

  it('[NS-14-R1] a switch on Home is counted as Home\'s, from the event\'s own allowlist', () => {
    expect(src('app/(tabs)/index.tsx')).toMatch(/<ChildSwitcher surface="tonight" \/>/);
    expect(src('components/child/child-switcher.tsx')).toMatch(/track\('capture:child_update', \{ child_ordinal: ordinalOf\(id\), surface \}\)/);
  });
});

describe('[NS-14-R6] one selection for Home and Book', () => {
  it('[NS-14-R6] one selection for Home and Book: a switch on either is the book the other reads, both ways', () => {
    const { asha, nila } = twoBooks();
    // Home reads the room through getActiveChildId (readRoom, getFamily); the Book reads getActiveChild (useChildren).
    store.setActiveChildId(nila.id);
    expect(store.getActiveChild()?.id).toBe(nila.id);
    expect(store.getFamily()?.childName).toBe('Nila');
    store.setActiveChildId(asha.id);
    expect(store.getActiveChild()?.id).toBe(asha.id);
    expect(store.getFamily()?.childName).toBe('Asha');
  });

  it('[NS-14-R6] Home and the Book draw the same switcher, which writes the one selection the Book also reads', () => {
    const home = src('app/(tabs)/index.tsx');
    const book = src('app/(tabs)/book.tsx');
    expect(home).toMatch(/import \{ ChildSwitcher \} from '@\/components\/child\/child-switcher';/);
    expect(book).toMatch(/import \{ ChildSwitcher \} from '@\/components\/child\/child-switcher';/);
    expect(src('components/child/use-children.ts')).toMatch(/select: \(id: string\) => setActiveChildId\(id\)/);
    // Home re-reads its room on any store change, so a switch made on the Book is the book Home shows next.
    expect(home).toMatch(/useEffect\(\(\) => subscribe\(load\), \[load\]\);/);
    expect(home).toMatch(/const childId = getActiveChildId\(\);/);
  });
});
