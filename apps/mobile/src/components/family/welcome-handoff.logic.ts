/**
 * When first run's welcome hands over to the Book (EXPERIENCE_PASS_2026-10 5.8 rows 12 and 13), pure so it is tested
 * in Node (test/welcome-handoff.test.ts). app/onboarding.tsx (P2's) asks it before it watches for a book.
 *
 * Only while the welcome itself, or the sign-in sheet over it, is in front. An allow-list, not a deny-list: once the
 * person is anywhere else (the Book, Tonight, the Family tab, Write, Settings, the join sheet), a welcome still in the
 * stack underneath must never pull them back to the Book.
 *  - Row 13, "I already have a book": the sign-in sheet over the welcome brings a book to this phone, and the welcome
 *    goes to the Book at once, sheet and all.
 *  - Row 12, "I was invited": the join sheet over the welcome brings the book too, but the joiner first sees its
 *    cover open, signs, and taps "Open the book" (S59), so the welcome waits while the join sheet is in front. Open
 *    and Close both close the sheet onto the welcome (components/family/join-sheet.logic.ts openLanding), and the
 *    welcome hands over to the Book from there, leaving first run's stack.
 */
export function welcomeMayLeave(step: string, pathname: string): boolean {
  return step === 'welcome' && (pathname === '/onboarding' || pathname === '/sign-in' || pathname.startsWith('/sign-in/'));
}

/**
 * Whether first run's welcome step is the one showing, under any sheet (app/onboarding.tsx sets it as its step
 * changes, and clears it when first run leaves). The join sheet asks it before "Open the book": over the welcome
 * the sheet only closes and the welcome hands over to the Book; over a later first-run step (an invite link opened
 * part-way through first run) it dismisses to the Book itself, because that step never hands over.
 */
let welcomeShowing = false;

export const firstRunWelcome = {
  set(showing: boolean): void {
    welcomeShowing = showing;
  },
  showing(): boolean {
    return welcomeShowing;
  },
};
