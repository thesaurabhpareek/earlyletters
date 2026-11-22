// One FNV-1a helper for every Moments rule that must agree across phones (rotation in rank.ts,
// place-cell tie-breaks in place resolution). Pure, no clock, no random source (CODE-R13: one definition).

/** FNV-1a, 32 bit, over UTF-16 code units. Fixed so two phones agree. */
export function fixedHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
