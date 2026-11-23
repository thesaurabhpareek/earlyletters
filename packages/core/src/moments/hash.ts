// The one FNV-1a helper for Moments rules that must agree across phones. Today `rank.ts` uses it for
// the For you rotation (`localDate|bookId`). PR 5 (#1414) will import it in its test fixture for the
// place-table checksum; `place.ts` itself takes an injected hash. Pure: no clock, no random source (CODE-R13).

/** FNV-1a, 32 bit, over UTF-16 code units. Fixed so two phones agree. */
export function fixedHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
