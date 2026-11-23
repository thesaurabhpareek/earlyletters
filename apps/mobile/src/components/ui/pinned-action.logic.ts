/**
 * The bottom-action rule as data (DESIGN_LANGUAGE; BL-418). One primary, 56 pt, full width, above the tab bar or home
 * indicator. Below accessibility sizes it is pinned outside the scroll; from AX1 up it scrolls with the content, last
 * (A11Y-AND-TYPE-AUDIT-20nov rule 3: a two-line pinned button is a quarter of an SE screen at AX1).
 *
 * Exception (CDESO-6): an action may stay pinned from AX1 up when its label is one word on one line, its bar passes
 * `DONE_BAR_MAX_SHARE` (a quarter of the window), and the content above is long enough that a last-in-scroll action
 * would sit below the fold at AX5. Named uses: the purchase-confirmed screen's Done. Each use is named here, not
 * decided per screen.
 */
import { tokens } from '@scribe/design-tokens';
import { isAccessibilitySize } from '@/lib/a11y.logic';

export const PINNED_ACTION = {
  gutter: tokens.space[5],
  top: tokens.space[2],
  bottom: tokens.space[3],
  minHeight: tokens.target.primary,
} as const;

/** Pinned below AX1; from AX1 the action is the last thing in the scroll. */
export function isPinned(fontScale: number): boolean {
  return !isAccessibilitySize(fontScale);
}
