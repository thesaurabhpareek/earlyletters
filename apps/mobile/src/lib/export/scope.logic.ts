/**
 * What an export reads from the phone, and when that grows (DATA-REQ-053, P0; BL-446). Pure: the readers are passed
 * in, so test/export-open-request.test.ts runs it on the real repositories in Node.
 *
 * The rule. Normally an export holds the listed books (hidden ones too) and the letters that are not deleted. While an
 * account-deletion request is open, the request has moved things the person did not move: it tombstones every letter
 * of a sole parent's account and closes her book on the server, and the next sync puts those letters in Recently
 * deleted and unlists the book (the pull row carries no reason, so the phone sees an ordinary deletion). DATA-REQ-053
 * says Export works for everything not yet purged, including letters tombstoned by the request. So, while a request
 * is open (scheduled, held or executing), the export also reads the books the server closed and the Recently deleted
 * letters of every book it reads.
 *
 * The phone cannot tell a letter the request tombstoned from one the person deleted themselves in the last 30 days,
 * so while a request is open both are in. That is more than the spec's minimum and all of it is the person's own and
 * not yet purged. When the request is cancelled or over, the export is as before.
 */
import { countedNote, type OpenRequest } from '../account-deletion/open-request';

/** True while this account has a deletion request that has not been cancelled (the phone's note of it, for the account signed in). */
export function deletionRequestOpen(note: OpenRequest | null, userId: string | null | undefined, nowMs: number): boolean {
  const n = countedNote(note, userId, nowMs);
  return n !== null && n.state !== 'cancelled';
}

export interface ScopeReaders<B extends { id: string }, E> {
  listed: () => B[];
  hidden: () => B[];
  /** Books the server closed (server_state 'deleted'). */
  closedByServer: () => B[];
  live: (bookId: string) => E[];
  deleted: (bookId: string) => E[];
}

export function exportScope<B extends { id: string }, E>(r: ScopeReaders<B, E>, requestOpen: boolean): { book: B; hidden: boolean; letters: E[] }[] {
  const books: { book: B; hidden: boolean }[] = [
    ...r.listed().map((book) => ({ book, hidden: false })),
    ...r.hidden().map((book) => ({ book, hidden: true })),
  ];
  if (requestOpen) {
    const seen = new Set(books.map((b) => b.book.id));
    for (const book of r.closedByServer()) if (!seen.has(book.id)) books.push({ book, hidden: false });
  }
  return books.map((b) => ({ ...b, letters: requestOpen ? [...r.live(b.book.id), ...r.deleted(b.book.id)] : r.live(b.book.id) }));
}
