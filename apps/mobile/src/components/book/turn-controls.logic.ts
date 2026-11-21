/**
 * Read together's two page buttons (EXPERIENCE_PASS S30; COMPONENTS 0.1: "Layouts must reflow at AX5: rows stack,
 * nothing truncates silently, and buttons grow taller instead of clipping"; P5 critics' pass S4). Pure and tested
 * (test/p5-critics.test.ts).
 *
 * Side by side, "Back one" then "Next letter", two equal halves. At an accessibility text size two halves are too
 * narrow for the labels (they became tall circles with "letter" past the edge), so the buttons stack, full width,
 * "Next letter" first: it is the control that turns the page, and it is the one a large-print reader needs whole.
 * Neither button has a fixed width or shape then: each grows with its label.
 */
export type TurnButton = 'back' | 'next';

export function turnControls(accessibilitySize: boolean): { stacked: boolean; order: readonly TurnButton[] } {
  return accessibilitySize ? { stacked: true, order: ['next', 'back'] } : { stacked: false, order: ['back', 'next'] };
}
