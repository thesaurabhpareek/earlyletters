/**
 * Whether more than one person writes in a book (BL-421), for the Book's letter cards: a card repeats the writer's
 * name only when it tells two writers apart. Read from the letters themselves (`countBookWriters`, distinct authors of
 * the book's live letters), not from the book's members: a partner invited but not yet writing adds nothing to tell
 * apart, a co-parent who left still wrote the letters they left behind, and a book only on this phone has no members
 * list at all.
 *
 * Every card of a book asks, so the answer is kept per book and dropped on any change to the letters or the settings
 * (the owner id, which decides whose unsigned rows are, is a setting). The drop runs before any card hears the change:
 * it is subscribed once, before the first card's own listener, and the bus calls listeners in the order they came.
 * So a change costs one count, not one per card.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { countBookWriters, subscribeTo } from '@/lib/store';

const TABLES = ['entries', 'settings'] as const;
const kept = new Map<string, boolean>();
let dropping: (() => void) | null = null;

function dropOnChange(): void {
  dropping ??= subscribeTo(TABLES, () => kept.clear());
}

/** True when two or more people wrote this book's letters. Kept per book until the letters or settings change. */
export function bookIsShared(childId: string): boolean {
  dropOnChange();
  let shared = kept.get(childId);
  if (shared === undefined) {
    try {
      shared = countBookWriters(childId) > 1;
    } catch {
      // A store that cannot be read keeps the card as it was before BL-421 (signed), and is asked again next time.
      return true;
    }
    kept.set(childId, shared);
  }
  return shared;
}

/** The hook a card uses: re-renders when the answer for its book changes. */
export function useBookIsShared(childId: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    dropOnChange();
    return subscribeTo(TABLES, onChange);
  }, []);
  const read = useCallback(() => bookIsShared(childId), [childId]);
  return useSyncExternalStore(subscribe, read, read);
}

/** Tests only: forget the kept answers and the drop listener (a fresh store per test). */
export function resetBookWritersForTest(): void {
  dropping?.();
  dropping = null;
  kept.clear();
}
