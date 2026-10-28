/**
 * Settings > Delete account, what the page decides (EXPERIENCE_PASS_2026-10 S64, package P8c). Pure: no React Native,
 * so test/delete-account.test.ts runs it in Node. The deletion itself (the two steps, the 30-day window, cancel, the
 * per-book lines) is S14's, in lib/account-deletion/**; this file only lays those lines out and picks the words.
 *
 * Held for counsel (spec chapter 7 and section 7, C8: the deletion lines P8 corrects go to counsel before they ship).
 * The page shows today's words until counsel clears the new ones; then the switch is the one line named:
 * - `intro`: `c.what.intro` to `c.what.introProposed` ("... your letters, recordings, books and recording backup
 *   from our servers. ..."). Then `introProposed` moves into `what.intro` in packages/content and the key goes.
 */
import { accountDeletionCopy as c } from '@scribe/content';
import { confirmationMatches } from '@/lib/account-deletion/logic';

export const HELD = {
  intro: c.what.intro,
} as const;

/** One book on step 1: its line, and the family note that belongs to it when it has one. */
export type BookLine = { line: string; note: string | null };

/**
 * Step 1's list. `books` are the per-book lines, in S14's order, with each family note under its own book; `copies`
 * closes the list; `empty` is the line for an account with no books. `known` is false until S14's lines arrive, and
 * Continue waits for it, so every book's outcome is on the page before Continue (S64 acceptance).
 */
export type WhatHappens = { known: boolean; books: BookLine[]; empty: string | null; copies: string | null };

export function whatHappens(lines: readonly string[] | null): WhatHappens {
  if (lines === null) return { known: false, books: [], empty: null, copies: null };
  const books: BookLine[] = [];
  let empty: string | null = null;
  let copies: string | null = null;
  for (const line of lines) {
    if (line === c.what.noBooks) empty = line;
    else if (line === c.what.copies) copies = line;
    else if (line === c.what.deletedFamily && books.length > 0) books[books.length - 1].note = line;
    else books.push({ line, note: null });
  }
  return { known: true, books, empty, copies };
}

/** The failure line. Each one says that nothing has changed (S64). */
export function failureLine(error: 'offline' | 'failed' | null): string | null {
  if (error === null) return null;
  return error === 'offline' ? c.errors.offline : c.errors.failed;
}

/** "Delete account" is enabled only when the word is typed and no request is on its way. */
export function canDelete(typed: string, busy: boolean): boolean {
  return confirmationMatches(typed) && !busy;
}
