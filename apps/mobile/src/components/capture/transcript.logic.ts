/**
 * Where a mark's card opens in the letter (EXPERIENCE_PASS S17 Motion, MOTION 5d: "tapping a mark expands an inline
 * card under its line"; P4 critics' pass S8). Pure, tested in Node (test/review-critics.test.ts, "[S8]").
 *
 * The paragraph is one Text, so the card cannot sit inside it. Instead the letter is cut in two at the end of the
 * line the open mark ends on, the card goes between, and the rest of the letter carries on below. Cut at a line's end,
 * the rest starts where it would have started anyway, so no line moves. The lines come from the paragraph's own
 * layout (`onTextLayout`, iOS and Android). Where they are not known (the web preview, or before the first layout), or
 * do not add up to the words shown, the cut is at the end of the mark's sentence instead.
 */

/** A sentence ends at . ! or ?, with any closing quote or bracket, and then a space or the end. */
const SENTENCE_END = /[.!?]+["')\]]*(\s+|$)/g;

/**
 * The character offset, in the words shown (`shown`, one string per segment, in order), where the letter is cut so the
 * card opens under the line that segment `open` ends on. `lines` is the paragraph's lines as laid out, or null.
 */
export function cardCutAt(input: { shown: readonly string[]; open: number; lines: readonly string[] | null }): number {
  const full = input.shown.join('');
  if (input.open < 0 || input.open >= input.shown.length) return full.length;
  const markEnd = input.shown.slice(0, input.open + 1).reduce((n, s) => n + s.length, 0);
  if (input.lines && input.lines.join('').length === full.length) {
    let end = 0;
    for (const line of input.lines) {
      end += line.length;
      if (end >= markEnd) return end;
    }
    return full.length;
  }
  const sentenceEnd = new RegExp(SENTENCE_END.source, 'g');
  sentenceEnd.lastIndex = markEnd;
  const m = sentenceEnd.exec(full);
  return m ? m.index + m[0].length : full.length;
}

/** Where each segment goes around the card: wholly above, wholly below, or (a run of plain words only) cut at `at`. */
export type Placement = 'above' | 'below' | { cut: number };

/**
 * Place every segment around the cut. A plain run of words may be cut in two (`cut`: characters kept above); a mark
 * is never cut, so a mark that runs over the cut stays whole above it.
 */
export function placeAroundCard(input: { shown: readonly string[]; plain: readonly boolean[]; at: number }): Placement[] {
  let pos = 0;
  return input.shown.map((s, i) => {
    const start = pos;
    const end = pos + s.length;
    pos = end;
    if (end <= input.at) return 'above';
    if (start >= input.at) return 'below';
    return input.plain[i] ? { cut: input.at - start } : 'above';
  });
}
