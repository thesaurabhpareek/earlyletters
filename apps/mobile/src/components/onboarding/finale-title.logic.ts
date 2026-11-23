/**
 * Keeps the last two words of a heading together at render time (BL-419), so a wrapped title never leaves one
 * word alone on its last line. The content string is not changed.
 */
const NBSP = String.fromCharCode(0xa0);

export function joinLastTwoWords(text: string): string {
  const i = text.lastIndexOf(' ');
  if (i <= 0 || i === text.length - 1) return text;
  return text.slice(0, i) + NBSP + text.slice(i + 1);
}
