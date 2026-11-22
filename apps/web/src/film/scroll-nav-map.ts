/**
 * Which scroll position the next or previous button goes to: the first part's rest position more than `slack` px
 * away in that direction. Going up with no earlier part left returns to the very top; null means nowhere to go.
 */
export function pickTarget(tops: number[], y: number, dir: 1 | -1, slack = 48): number | null {
  if (dir === 1) return tops.find((t) => t > y + slack) ?? null;
  const before = tops.filter((t) => t < y - slack);
  return before.length ? before[before.length - 1] : y > slack ? 0 : null;
}
