/**
 * How a language name sits in a row (BL-1979, refines BL-411). Pure, tested in test/rtl-date-pill-language-list.test.ts.
 *
 * The name keeps its own writing direction (Arabic shapes and reads right to left), but the block that holds the
 * names is aligned to the start of the row, in the direction of the app: `alignItems: 'flex-start'` is mirrored by
 * the layout engine, where a physical textAlign of 'left' or 'right' is not. So under a right-to-left app every row
 * starts on the right, under a left-to-right app on the left, whatever script the name is written in, and an Arabic
 * name no longer jumps to the far edge of a left-aligned list.
 */
export type WritingDirection = 'ltr' | 'rtl';

export interface NameBlockStyle {
  alignItems: 'flex-start';
}

export interface NameTextStyle {
  writingDirection: WritingDirection;
}

/** The column that holds a row's names: start-aligned, never a physical side. */
export function nameBlockStyle(): NameBlockStyle {
  return { alignItems: 'flex-start' };
}

/** The native name keeps its script's direction and sets no textAlign. */
export function nameTextStyle(direction: WritingDirection): NameTextStyle {
  return { writingDirection: direction };
}
