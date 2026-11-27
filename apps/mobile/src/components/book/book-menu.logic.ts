/**
 * More for this book (NS-22-R3, R7; BL-938; design B-S02 as trimmed by docs/design/specs/NS-22-BOOK-HEADER-DELTA-27nov.md):
 * which rows the Book's end menu offers, in which words, and what a tap does. Pure, so a test can drive it.
 *
 * Quiet this book, or Turn Quiet off on a quieted book (R7). Hide this book only when there are two or more books, the
 * same as Me (`app/settings/children/[id].tsx`), so a parent never hides the only book. Every word is an existing key
 * except the menu's own name (`book.menu.*`, PROPOSED).
 */
import { copy, fill } from '@/lib/copy';

export type BookMenuRow = { id: 'quiet' | 'hide'; label: string };

/** The rows, in order. `books` counts the books shown on this phone. */
export function bookMenuRows(o: { quiet: boolean; books: number }): BookMenuRow[] {
  const rows: BookMenuRow[] = [{ id: 'quiet', label: o.quiet ? copy.children.quiet.offLabel : copy.children.quiet.label }];
  if (o.books > 1) rows.push({ id: 'hide', label: copy.children.settings.hideLabel });
  return rows;
}

/** The end control's hint: only when the menu holds Hide, because with one book it holds Quiet only. */
export function bookMenuHint(books: number): string | undefined {
  return books > 1 ? copy.book.menu.labelA11y : undefined;
}

/**
 * Turn Quiet on or off for this book and say so in one line. A write that throws keeps the old state and says that
 * it did not save (NS-22 s6, Failed). The line names the book with `{child}` only; nothing is logged.
 */
export function toggleQuiet(o: { id: string; name: string; quiet: boolean; set: (id: string, quiet: boolean) => void }): { ok: boolean; message: string } {
  const on = !o.quiet;
  try {
    o.set(o.id, on);
  } catch {
    return { ok: false, message: saveFailedLine(o.name) };
  }
  return { ok: true, message: fill(on ? copy.children.quiet.quietedToast : copy.children.quiet.offToast, { child: o.name }) };
}

/** One line when a Quiet or Hide write fails: the book is as it was. */
export function saveFailedLine(name: string): string {
  return fill(copy.children.quiet.saveFailed, { child: name });
}

/** The Hide confirm, Me's own: the title and confirm are Hide this book, the body says nothing is deleted. */
export function hideConfirm(name: string): { title: string; body: string; cancel: string; confirm: string } {
  const s = copy.children.settings;
  return { title: s.hideLabel, body: fill(s.hideBody, { child: name }), cancel: copy.common.cancelButton, confirm: s.hideLabel };
}
