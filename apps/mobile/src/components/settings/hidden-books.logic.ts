/**
 * Hidden books (package P6d; PRD B-REQ-014, F09-REQ-016 and F09-REQ-024, WP-F09-09): the way back from "Hide this book".
 * Pure, so test/hidden-books.test.ts runs it in Node; app/settings/children/hidden.tsx draws it.
 *
 * Hiding a book is not destructive (nothing is deleted), and it must not be a trap either: Settings home shows a
 * "Hidden books" row under Children while at least one book is hidden on this phone, and its page lists each hidden
 * book with "Show this book again" (store.unhideChild). With none hidden the row is not there at all; the page,
 * reached any other way, says "No hidden books.". Every word is packages/content's (`children.settings.hiddenTitle`,
 * `showButton`, `hiddenEmpty`), except each book's own name. No count of hidden books is shown.
 */
import { copy } from '@/lib/copy';

export const HIDDEN_BOOKS_HREF = '/settings/children/hidden' as const;

type Book = { id: string; name: string };

/** Settings home's row under Children: only while a book is hidden. */
export function hiddenBooksRow(hidden: readonly Book[]): { title: string; href: typeof HIDDEN_BOOKS_HREF } | null {
  return hidden.length > 0 ? { title: copy.children.settings.hiddenTitle, href: HIDDEN_BOOKS_HREF } : null;
}

export type HiddenBooksPage = {
  title: string;
  /** "No hidden books." when there are none; null otherwise. */
  empty: string | null;
  /** One per hidden book, oldest first (store.listHiddenChildren's order). */
  books: { id: string; name: string; button: string; buttonLabel: string }[];
};

export function hiddenBooksPage(hidden: readonly Book[]): HiddenBooksPage {
  const s = copy.children.settings;
  return {
    title: s.hiddenTitle,
    empty: hidden.length === 0 ? s.hiddenEmpty : null,
    // VoiceOver hears which book each button brings back ("Show this book again, Avi"): the same words, then the name.
    books: hidden.map((b) => ({ id: b.id, name: b.name, button: s.showButton, buttonLabel: `${s.showButton}, ${b.name}` })),
  };
}
