/**
 * Settings > Delete account, what the page decides (EXPERIENCE_PASS_2026-10 S64, package P8c). Pure: no React Native,
 * so test/delete-account.test.ts runs it in Node. The deletion itself (the two steps, the 30-day window, cancel, the
 * per-book lines) is S14's, in lib/account-deletion/**; this file only lays those lines out and picks the words.
 *
 * Held for counsel (spec chapter 7 and section 7, C8: what deletion removes, and the 30 days, are retention promises).
 * Build 12 (servers on, recording backup off) shows `c.what.intro`, which names only what the build holds on our
 * servers (letters and books); the proposed line that named a recording backup is gone from packages/content.
 */
import { accountDeletionCopy as c } from '@scribe/content';
import type { CancelFailure } from '@/lib/account-deletion/api';
import { confirmationMatches, expectedDeletionDate, localDay } from '@/lib/account-deletion/logic';

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

/** What VoiceOver reads for one book: its line, then its family note when it has one (the row is one element). */
export function bookRowLabel(b: BookLine): string {
  return b.note ? `${b.line} ${b.note}` : b.line;
}

/** A stable key per row: two books can read the same (two children both called Asha), so the place comes first. */
export function bookRowKey(b: BookLine, i: number): string {
  return `${i}:${b.line}`;
}

/** Step 2's date: the local calendar day a request made at `now` would be carried out (the server sets the real one). */
export function confirmDay(now: Date): string {
  return localDay(expectedDeletionDate(now));
}

/** The scheduled page's date: the local calendar day of the server's `scheduled_for`. */
export function scheduledDay(status: { scheduledFor: string }): string {
  return localDay(status.scheduledFor);
}

/** The failure line for a Delete account request. Each one says that nothing has changed (S64). */
export function failureLine(error: CancelFailure | null): string | null {
  if (error === null) return null;
  return error === 'offline' ? c.errors.offline : c.errors.failed;
}

/**
 * The line for a Cancel deletion press that did not go through: here and on the deletion screen, for the same press.
 *  - Offline or failed (BL-491 point 5, CDesO-46): not `failureLine`, because cancelDeletion gives up on a lost answer
 *    without reading the status again, so the phone does not know whether the server cancelled, and "nothing has
 *    changed" would read as if the person were safe while the request may still be open. Offline also covers a
 *    connection lost mid-call.
 *  - `limited`, the daily limit (SCRAT, CDesO-58): the outcome is known and pressing again does not help yet.
 *  - `auth`, still refused after one refresh of the session (CDesO-59): nothing ran on the server, so "nothing has
 *    changed" is true, with the date drawn above it.
 *  - Signed out (`signedIn` false, the refresh removed the session): no line. The page's signed-out view, beside its
 *    Sign in button, is the one place the sign-in words show (CDesO-59).
 */
export function cancelFailureLine(error: CancelFailure | null, signedIn: boolean): string | null {
  if (error === null || !signedIn) return null;
  if (error === 'limited') return c.errors.cancelLimited;
  if (error === 'auth') return c.errors.failed;
  return c.errors.cancelFailed;
}

/**
 * The line when the page could not load (its status or its book lines). Nothing was tried, so "nothing has changed"
 * would be an odd thing to say there (BL-492 point 4); offline keeps its own line, which is true in both places.
 */
export function loadFailureLine(error: CancelFailure | null): string {
  return error === 'offline' ? c.errors.offline : c.errors.loadFailed;
}

/** Where the page goes once a cancel went through: back to Settings, not on to step 1 again (BL-492 point 2). */
export function afterCancel(canGoBack: boolean): 'back' | 'settings' {
  return canGoBack ? 'back' : 'settings';
}

/** "Delete account" is enabled only when the word is typed and no request is on its way. */
export function canDelete(typed: string, busy: boolean): boolean {
  return confirmationMatches(typed) && !busy;
}

/**
 * Step 1's line about this phone (CPrivO-56): "until you erase them" only where the shelf shows Erase now (pass
 * `shelfActions(...).eraseNow`); a sync build without `EXPO_PUBLIC_SERVER_ERASE=on` gets the ruling's fallback.
 */
export function phoneLine(eraseNowShown: boolean): string {
  return eraseNowShown ? c.what.onThisPhone : c.what.onThisPhoneNoErase;
}
