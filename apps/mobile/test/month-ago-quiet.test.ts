/// <reference types="node" />
/**
 * "A month ago" never brings back a letter from a book this person quieted or hid (NS-23-R8, J-N19; F12-REQ-011).
 * The rule is pure (components/tonight/draft-card.logic.ts `resurfaced`) and runs here; the store's quiet and hide
 * switches run on a real database (node:sqlite); Home's use of them is pinned in its source, since Node cannot load
 * React Native. Fixtures: the fictional family Asha and Avi.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENGINE_VERSION } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { resurfaced } = await import('../src/components/tonight/draft-card.logic');

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const TODAY = '2026-10-17';
const WORDS = 'Bath time. You splash with both hands and both feet, and then you check that I saw.';
const letter = (id: string, occurredOn: string) => ({
  id,
  kind: 'letter' as const,
  inBook: true,
  occurredOn,
  capturedAt: `${occurredOn}T19:00:00.000Z`,
  finalText: WORDS,
});

describe('[NS-23-R8] quiet book never resurfaces', () => {
  it('a quieted book gives no "A month ago" card; unquiet brings the same letter back (J-N19)', () => {
    const inWindow = [letter('a', '2026-09-19'), letter('b', '2026-09-14')];
    expect(resurfaced(inWindow, TODAY, 0, { quiet: false })?.id).toBe('a');
    expect(resurfaced(inWindow, TODAY, 0, { quiet: true })).toBeNull();
    expect(resurfaced([letter('edge', '2026-09-12')], TODAY, 0, { quiet: true })).toBeNull();
  });

  it('Home reads the open book\'s quiet with its room and hands it to "A month ago" (source)', () => {
    const screen = code('app/(tabs)/index.tsx');
    expect(screen).toMatch(/quiet: getActiveChild\(\)\?\.quiet === true/);
    expect(screen).toContain('resurfaced(room?.entries ?? [], today, cards.length, { quiet: !!room?.quiet })');
  });
});

describe('[NS-23-R8] on the real store: quiet and hidden books bring nothing back', () => {
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

  const keep = (id: string, childId: string) =>
    store.saveEntry({
      id,
      kind: 'letter',
      occurredOn: '2026-09-19',
      capturedAt: '2026-09-19T19:00:00.000Z',
      captureMode: 'typed',
      editLevel: 'verbatim',
      promptKey: null,
      engineVersion: ENGINE_VERSION,
      rawTranscript: WORDS,
      machineEdits: [],
      finalText: WORDS,
      inBook: true,
      soundsLikeMe: null,
      childId,
      authorSignsAs: 'Mama',
    });
  // What Home reads for the open book (app/(tabs)/index.tsx readRoom), then what "A month ago" picks from it.
  const monthAgo = () => resurfaced(store.listEntries(), TODAY, 0, { quiet: store.getActiveChild()?.quiet === true });

  it('quiet the open book and the card goes; unquiet and it comes back; a hidden book is never the open one', () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    keep('0199a5b0-0000-7000-8000-0000000000aa', asha.id);
    expect(store.getActiveChildId()).toBe(asha.id);
    expect(monthAgo()?.id).toBe('0199a5b0-0000-7000-8000-0000000000aa');

    store.setChildQuiet(asha.id, true);
    expect(monthAgo()).toBeNull();
    // The letter itself is untouched: quiet only stops it coming back.
    expect(store.listEntries().map((e) => e.finalText)).toEqual([WORDS]);

    store.setChildQuiet(asha.id, false);
    expect(monthAgo()?.id).toBe('0199a5b0-0000-7000-8000-0000000000aa');

    // Hide it with a second book on the phone: Home opens the other book, so the hidden one's letter never comes back.
    store.addChild({ name: 'Avi', birthday: '2026-09-20', dueDate: null, signsAs: 'Mama' });
    store.hideChild(asha.id);
    expect(store.getActiveChildId()).not.toBe(asha.id);
    expect(monthAgo()).toBeNull();
  });
});
