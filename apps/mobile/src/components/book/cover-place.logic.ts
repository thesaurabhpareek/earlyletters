/**
 * Where the small book cover sits beside a child's name, and when it steps aside. One rule for the three screens that
 * name a book: the first-run name step, the first-run signature step and Add a child (EXPERIENCE_PASS_2026-10 v1.3:
 * S05, S06, S47). Pure, so test/first-run-cover.test.ts runs it in Node; cover-heading.tsx draws it.
 *
 * - Under the keyboard (S05 Visual, line 311; acceptance, line 323): "With the keyboard up and under 480 pt of free
 *   height, the cover hides, so the name field stays in view." Free height is the window less the keyboard with its
 *   QuickType bar up, as P2-V measured it on a web export (unverified on a phone): 407 pt on an iPhone SE, 538 on a
 *   17 Pro, 610 on a Pro Max, so the SE hides the cover and the other two keep it while the name is typed.
 * - At accessibility text sizes (P6A critics' pass S2): the heading takes the whole row and the cover sits under it,
 *   instead of squeezing the heading to a word a line beside it. The cover is artwork and does not scale.
 */

/** The cover hides when the keyboard leaves less free height than this: S05 Visual, line 311 (v1.3, #238). */
export const COVER_MIN_FREE_HEIGHT = 480;

/** `beside` the heading, `below` it (accessibility text sizes), or `hidden` (the keyboard leaves too little room). */
export type CoverPlace = 'beside' | 'below' | 'hidden';

/** True while the keyboard is down, or leaves at least COVER_MIN_FREE_HEIGHT pt of the window free. */
export function coverFitsAboveKeyboard(windowHeight: number, keyboardHeight: number): boolean {
  return keyboardHeight === 0 || windowHeight - keyboardHeight >= COVER_MIN_FREE_HEIGHT;
}

/** Where the cover goes right now. The keyboard rule comes first: a hidden cover is hidden at every text size. */
export function coverPlace({ windowHeight, keyboardHeight, accessibilitySize }: { windowHeight: number; keyboardHeight: number; accessibilitySize: boolean }): CoverPlace {
  if (!coverFitsAboveKeyboard(windowHeight, keyboardHeight)) return 'hidden';
  return accessibilitySize ? 'below' : 'beside';
}
