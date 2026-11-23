/**
 * Read together's two page buttons (EXPERIENCE_PASS S30; COMPONENTS 0.1: "Layouts must reflow at AX5: rows stack,
 * nothing truncates silently, and buttons grow taller instead of clipping"; P5 critics' pass S4). Pure and tested
 * (test/p5-critics.test.ts).
 *
 * Side by side, "Earlier letter" then "Next letter", two equal halves. At an accessibility text size two halves are too
 * narrow for the labels (they became tall circles with "letter" past the edge), so the buttons stack, full width,
 * "Next letter" first: it is the control that turns the page, and it is the one a large-print reader needs whole.
 * Neither button has a fixed width or shape then: each grows with its label.
 */
import { tokens } from '@scribe/design-tokens';

export type TurnButton = 'back' | 'next';

export function turnControls(accessibilitySize: boolean): { stacked: boolean; order: readonly TurnButton[] } {
  return accessibilitySize ? { stacked: true, order: ['next', 'back'] } : { stacked: false, order: ['back', 'next'] };
}

/**
 * Where the page buttons live (BL-1791, PER3-006). At the usual sizes they are pinned under the letter, in the thumb
 * zone. From AX1 up two stacked 56 pt buttons plus padding left one or two lines of the letter (audit rule 3: a pinned
 * primary takes under a quarter of the viewport), so they move to the end of the letter's scroll and nothing is pinned.
 * A swipe stays as the second way. Pure and tested (test/read-together-buttons.test.ts); `isAccessibilitySize` is the
 * same threshold the stacking uses.
 */
export type ButtonPlacement = 'pinned' | 'inline';

/** Pinned bar: 12 pt above, one 56 pt button, 8 pt below (side by side at the usual sizes). */
export const PINNED_BAR_PT = 12 + tokens.target.primary + 8;

export function buttonPlacement(accessibilitySize: boolean): ButtonPlacement {
  return accessibilitySize ? 'inline' : 'pinned';
}

/** What is pinned under the letter: the bar at the usual sizes, nothing from AX1 up. */
export function pinnedHeight(accessibilitySize: boolean): number {
  return buttonPlacement(accessibilitySize) === 'pinned' ? PINNED_BAR_PT : 0;
}

/** The letter's own area: the viewport less the header (and the progress line) and whatever is pinned. */
export function letterAreaHeight(viewportPt: number, headerPt: number, accessibilitySize: boolean): number {
  return Math.max(0, viewportPt - headerPt - pinnedHeight(accessibilitySize));
}

/** The wrapper's classes for the page buttons, pinned or at the end of the scroll (the scroll already pads its sides). */
export function pageButtonsClass(stacked: boolean, placement: ButtonPlacement): string {
  if (placement === 'inline') return stacked ? 'gap-3 pt-2' : 'flex-row gap-3 pt-2';
  return stacked ? 'gap-3 px-5 pb-2 pt-3' : 'flex-row gap-3 px-5 pb-2 pt-3';
}
