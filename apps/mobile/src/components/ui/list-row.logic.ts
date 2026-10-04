/**
 * Row and divider order for inset-grouped lists (ListSection, ChoiceGroup "list").
 * Pure and tested (list-row.logic.test.ts).
 *
 * iOS inset-grouped lists (Settings, Day One, Apple Journal) indent the hairline
 * between rows, not the rows: every row keeps the full width and the same 16 pt
 * leading padding, and only the divider starts in from the edge. It lines up with
 * the text of the row below it, so a row with a leading icon gets a deeper inset.
 * There is no divider above the first row or below the last.
 */
export type ListItem<T> = { type: 'row'; row: T; key: string } | { type: 'divider'; key: string; inset: number };

/** Row leading padding (tokens.space[4]): where a row's text starts without an icon. */
export const DIVIDER_INSET = 16;
/** Leading icon column (w-7) plus its gap (gap-3): text starts here when a row has an icon. */
export const LEADING_COLUMN = 28 + 12;

export function dividerInset(hasLeading: boolean): number {
  return hasLeading ? DIVIDER_INSET + LEADING_COLUMN : DIVIDER_INSET;
}

export function withDividers<T>(rows: readonly T[], hasLeading: (row: T) => boolean = () => false): ListItem<T>[] {
  const out: ListItem<T>[] = [];
  rows.forEach((row, i) => {
    if (i > 0) out.push({ type: 'divider', key: `d${i}`, inset: dividerInset(hasLeading(row)) });
    out.push({ type: 'row', row, key: `r${i}` });
  });
  return out;
}

/**
 * A row that can be pressed always shows what it will do: a chevron (it opens something), a value
 * followed by a chevron, or its own control (a switch, a check). Rows with a value but no chevron
 * (language, child fields, Restore purchases, Tidying, English model, Family can read) read as
 * captions, not controls (QA journey critique, "_journey"). Destructive rows say the action in
 * words and never carry a chevron. Android's list rows omit it by platform convention (`android`).
 */
export function showsChevron(row: {
  pressable: boolean;
  disabled?: boolean;
  destructive?: boolean;
  /** The row already has its own trailing control (a switch, a node). */
  hasTrailingNode: boolean;
  android?: boolean;
}): boolean {
  if (row.android || row.disabled || row.destructive || row.hasTrailingNode) return false;
  return row.pressable;
}
