/**
 * The purchase-confirmed screen's layout and share outcome as data (BL-1722, CDO-A-003). Pure, so Node tests can
 * check them without a phone; the on-device check is BL-1786.
 *
 * Done: on this screen it stays pinned at every text size, unlike PinnedActionLayout's rule of scrolling last from
 * AX1 (pinned-action.logic.ts). The terms above it are long, so at AX5 a Done at the end of the scroll sits well below
 * the fold. One word on one line keeps the pinned bar small enough to leave most of the screen for the terms.
 */
import { tokens } from '@scribe/design-tokens';
import { PINNED_ACTION } from '@/components/ui/pinned-action.logic';

/** The share of the window the pinned Done bar may take before it crowds the terms (a quarter, as BL-418). */
export const DONE_BAR_MAX_SHARE = 0.25;

/** The pinned Done bar's height in pt at a font scale: its padding, and one line of the label (18/22 token, py-3) or the 56 pt target. */
export function doneBarHeight(fontScale: number): number {
  const label = Math.ceil(tokens.type.label.lineHeight * fontScale) + 2 * tokens.space[3];
  return PINNED_ACTION.top + PINNED_ACTION.bottom + Math.max(PINNED_ACTION.minHeight, label);
}

/** Done is in view without scrolling: it is pinned at every size, and the bar leaves the terms at least three quarters of the window. */
export function doneInView(fontScale: number, windowHeight: number): boolean {
  return doneBarHeight(fontScale) <= windowHeight * DONE_BAR_MAX_SHARE;
}

/** What the screen shows after Save a copy: nothing when the share sheet opened (or was closed), one plain line when it could not open. */
export function saveCopyLine(outcome: 'shared' | 'failed', words: { saveCopyFailed: string }): string | null {
  return outcome === 'failed' ? words.saveCopyFailed : null;
}
