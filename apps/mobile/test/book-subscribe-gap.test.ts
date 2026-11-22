/**
 * BL-1428 (BL-458 part 3): an `entries` event between the Book's first read and its subscribe is picked up at once.
 * Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { caughtUp, sameLetters, watchBook, type BookRead } from '../src/components/book/book.logic';
import type { Entry } from '../src/lib/store';

const e = (id: string, finalText = 'Hello'): Entry =>
  ({ id, occurredOn: '2026-10-14', capturedAt: '2026-10-14T19:00:00.000Z', childId: 'child-asha', kind: 'letter', inBook: true, finalText, machineEdits: [] }) as unknown as Entry;

/** A store with the same shape as the real one: a list per book, and listeners called on every change. */
function fakeStore() {
  let list: Entry[] = [e('n1')];
  const listeners = new Set<() => void>();
  return {
    read: (_childId: string) => list.map((x) => ({ ...x, machineEdits: [...x.machineEdits] })),
    subscribe: (l: () => void) => (listeners.add(l), () => void listeners.delete(l)),
    write: (next: Entry[]) => {
      list = next;
      listeners.forEach((l) => l());
    },
  };
}

/** A held state, like `useState`'s, applied the way React applies a functional update. */
function holder(initial: BookRead) {
  let held = initial;
  let renders = 0;
  return {
    get: () => held,
    renders: () => renders,
    set: (next: (h: BookRead) => BookRead) => {
      const n = next(held);
      if (n !== held) renders += 1;
      held = n;
    },
  };
}

describe('the Book catches a change between its first read and its subscribe', () => {
  it('picks up a letter saved after the initialiser read and before the subscribe, with no further event', () => {
    const store = fakeStore();
    const state = holder({ childId: 'child-asha', entries: store.read('child-asha') }); // the initialiser's read
    store.write([e('n2'), e('n1')]); // the event lands here: nobody is subscribed yet
    watchBook({ childId: 'child-asha', read: store.read, subscribe: store.subscribe, set: state.set }); // the effect
    expect(state.get().entries.map((x) => x.id)).toEqual(['n2', 'n1']);
  });

  it('picks up an edit to a letter already in the list, not only a new letter', () => {
    const store = fakeStore();
    const state = holder({ childId: 'child-asha', entries: store.read('child-asha') });
    store.write([e('n1', 'Hello, Asha')]);
    watchBook({ childId: 'child-asha', read: store.read, subscribe: store.subscribe, set: state.set });
    expect(state.get().entries[0]?.finalText).toBe('Hello, Asha');
  });

  it('does not re-render when nothing changed in the gap, and keeps the held read', () => {
    const store = fakeStore();
    const first: BookRead = { childId: 'child-asha', entries: store.read('child-asha') };
    const state = holder(first);
    watchBook({ childId: 'child-asha', read: store.read, subscribe: store.subscribe, set: state.set });
    expect(state.renders()).toBe(0);
    expect(state.get()).toBe(first);
  });

  it('still rereads on every later change, and stops after the unsubscribe', () => {
    const store = fakeStore();
    const state = holder({ childId: 'child-asha', entries: store.read('child-asha') });
    const off = watchBook({ childId: 'child-asha', read: store.read, subscribe: store.subscribe, set: state.set });
    store.write([e('n2'), e('n1')]);
    expect(state.get().entries).toHaveLength(2);
    off();
    store.write([e('n3'), e('n2'), e('n1')]);
    expect(state.get().entries).toHaveLength(2);
  });

  it('reads the new book when the active book is another one', () => {
    const store = fakeStore();
    const state = holder({ childId: 'child-other', entries: [] });
    watchBook({ childId: 'child-asha', read: store.read, subscribe: store.subscribe, set: state.set });
    expect(state.get().childId).toBe('child-asha');
    expect(state.get().entries.map((x) => x.id)).toEqual(['n1']);
  });

  it('compares letters field by field', () => {
    expect(sameLetters([e('a')], [e('a')])).toBe(true);
    expect(sameLetters([e('a')], [e('a', 'Changed')])).toBe(false);
    expect(sameLetters([e('a')], [])).toBe(false);
    const held: BookRead = { childId: 'c', entries: [e('a')] };
    expect(caughtUp(held, 'c', [e('a')])).toBe(held);
    expect(caughtUp(held, 'd', [e('a')])).not.toBe(held);
  });
});
