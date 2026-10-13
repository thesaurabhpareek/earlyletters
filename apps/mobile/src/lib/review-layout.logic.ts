/**
 * Review layout rules that must hold at every text size (QA journey J06-01, "_journey": 56 pt footers
 * at AX3, the question hidden behind the footer). Pure and tested (test/review-layout.test.ts).
 *
 * At the default size the save actions are pinned under the letter (the thumb zone, always on screen).
 * From accessibility sizes up (AX1+, Apple's definition) a pinned footer of two controls would take a
 * third or more of the screen and clip the content above it, so the actions move to the end of the
 * scrolling content: nothing is hidden, nothing is clipped, and the letter keeps the screen.
 */
import { tokens } from '@scribe/design-tokens';

export type FooterPlacement = 'pinned' | 'inline';

export function footerPlacement(accessibilitySize: boolean): FooterPlacement {
  return accessibilitySize ? 'inline' : 'pinned';
}

/**
 * Pinned footer height at the default size: one primary (56) and one quiet button (44), 12 pt above,
 * 8 pt below, 4 pt between. About 124 pt including the hairline, down from 130 + inset of two 56 pt buttons.
 */
export function pinnedFooterHeight(): number {
  return 12 + tokens.target.primary + 4 + tokens.target.min + 8;
}

/** Smallest the trust copy on Review may be, pt at the default size: the subhead step, never caption 13 or footnote 14. */
export const TRUST_COPY_MIN_PT = tokens.type.subhead.fontSize;
