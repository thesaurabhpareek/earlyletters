/**
 * When first run's welcome hands over to the Book (EXPERIENCE_PASS_2026-10 5.8 rows 12 and 13), pure so it is tested
 * in Node (test/welcome-handoff.test.ts). app/onboarding.tsx (P2's) asks it before it watches for a book.
 *
 *  - Row 13, "I already have a book": the sign-in sheet over the welcome brings a book to this phone, and the welcome
 *    goes to the Book at once, sheet and all.
 *  - Row 12, "I was invited": the join sheet over the welcome brings the book too, but the joiner first sees its
 *    cover open, signs, and taps "Open the book", which lands on the Book itself (S59). So while an /invite route is
 *    in front the welcome waits; when the sheet closes without opening the book, the welcome hands over then.
 *  - Once the Book is in front there is nothing left to hand over, so the landing is never replaced a second time
 *    (which would drop its `joined` mark, and the light it raises once).
 */
export function welcomeMayLeave(step: string, pathname: string): boolean {
  return !(step !== 'welcome' || pathname.startsWith('/invite') || pathname === '/book');
}
