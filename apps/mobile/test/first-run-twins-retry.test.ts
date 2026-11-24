/// <reference types="node" />
/**
 * [BL-1658] [NS-43-R9] Twins: a failed second book leaves no first book, so a retry of the last step makes each book once.
 * Since BL-1033 the store makes every book in one transaction (addChildren), so the old "remember the first" memory
 * (resumeBooks) is gone; this runs the real store behind the real tap latch (runFinishOnce). Fictional family Asha only.
 */
import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { runFinishOnce } from '../src/lib/first-run/handoff.logic';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const at = (i: number) => `0199a000-0000-7000-8000-${String(i).padStart(12, '0')}`;
const book = (name: string) => ({ name, birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });

async function setup(plan: string[], names: string[]) {
  vi.resetModules();
  const store = await import('../src/lib/store');
  const { db } = nodeDb();
  const ids = [...plan];
  store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-11-20T09:00:00.000Z', newId: () => ids.shift() ?? at(500 + Math.floor(Math.random() * 1e6)) });
  const latch = { current: false };
  const finish = () => {
    store.addChildren(names.map(book));
    latch.current = true;
  };
  return { store, tap: () => runFinishOnce(latch, finish) };
}

describe('[BL-1658] a retry after a failed second book makes each book once', { timeout: 30_000 }, () => {
  it('twins: the second fails, nothing is kept, the retry makes Asha and Asha B, and more taps add nothing', async () => {
    const s = await setup([at(1), at(1), at(7), at(8)], ['Asha', 'Asha B']);
    expect(() => s.tap()).toThrow();
    expect(s.store.listChildren()).toEqual([]);
    s.tap();
    s.tap();
    expect(s.store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Asha B']);
  });

  it('the second fails twice in a row: still one Asha at the end', async () => {
    const s = await setup([at(1), at(1), at(2), at(2), at(7), at(8)], ['Asha', 'Asha B']);
    expect(() => s.tap()).toThrow();
    expect(() => s.tap()).toThrow();
    s.tap();
    expect(s.store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Asha B']);
  });

  it('the same name twice is two books', async () => {
    const s = await setup([at(1), at(2)], ['Asha', 'Asha']);
    s.tap();
    expect(s.store.listChildren()).toHaveLength(2);
  });
});
