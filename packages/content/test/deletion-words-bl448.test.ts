/**
 * BL-448, ruling CPrivO-18 (fail closed), words read by CPrivO-60: the book-deletion email says only what the app and
 * the server do today. No export line: no book-deletion screen offers Save a copy during the wait
 * (`request_book_deletion` has no caller in the app; the one Delete this book screen runs only on a phone that never
 * signed in, offers Export before the confirm, and sends nothing).
 * The website Delete account page's half of BL-448 is not here: it lived in src/pages.en.ts, which BL-556 (#2056)
 * removed. The site has no Delete account page for now, so that half waits for the page. The request email's co-parent
 * line is pinned in server-surfaces-account-deletion.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { accountEmails } from '../src';

const EXPORT = /\bexport|\bsave a copy\b|\bkeep a copy\b/i;

describe('[BL-448] the book-deletion email offers no export', () => {
  const book = accountEmails['book-deletion-scheduled'];

  it('neither the preheader nor the body offers an export', () => {
    expect(book.preheader).not.toMatch(EXPORT);
    for (const line of book.body) expect(line).not.toMatch(EXPORT);
  });

  it('[CPrivO-60] the preheader is the approved line, word for word', () => {
    expect(book.preheader).toBe('On {deletionDate}. You can change your mind until then.');
  });
});
