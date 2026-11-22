/**
 * The bottom-action rule as data (DESIGN_LANGUAGE; BL-418). One primary, 56 pt, full width, above the tab bar or home
 * indicator. Below accessibility sizes it is pinned outside the scroll; from AX1 up it scrolls with the content, last
 * (A11Y-AND-TYPE-AUDIT-20nov rule 3: a two-line pinned button is a quarter of an SE screen at AX1).
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
