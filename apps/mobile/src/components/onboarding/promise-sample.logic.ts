/**
 * Pure parts of the promise specimen (EXPERIENCE_PASS S04). The sample's raw words go through the real engine on
 * the path a spoken letter takes (lib/transcription-queue/clean.ts `cleanSpoken`: faithfulClean, with every edit
 * checked by verifyEdits), and the screen draws whatever comes back: the person's words as they are, and each small
 * fix as a mark over the words it took out. Nothing here writes or chooses a word. The sample is fictional and names
 * no child. Tested in test/promise-sample.test.ts.
 *
 * The specimen shows removals only (a filler, a repeat): a mark is the words an edit took out, struck through, and
 * putting it back shows those words again. If the engine ever returns anything else for the sample (a changed word,
 * an edit that cuts a word in two, a rejected edit), `promiseSample` gives no marks and the screen shows the raw
 * sentence as it is: the engine is never bent to fit the sample, and the test fails so the words get changed (P0).
 */
import { finalText, type Edit } from '@scribe/core';
import { cleanSpoken } from '@/lib/transcription-queue/clean';

/** A run of the sentence as drawn: one of the person's words, or a mark over the words one edit took out. */
export type SamplePiece = { kind: 'word'; text: string } | { kind: 'mark'; text: string; edit: number };

export type PromiseSample = {
  raw: string;
  /** The edits the engine applied (every one accepted by verifyEdits). Empty when the sample cannot be marked. */
  edits: readonly Edit[];
  pieces: readonly SamplePiece[];
};

/** Words of `raw` with where each sits, split at whitespace. */
function wordsOf(raw: string): { text: string; start: number; end: number }[] {
  return [...raw.matchAll(/\S+/g)].map((m) => ({ text: m[0], start: m.index!, end: m.index! + m[0].length }));
}

/** A removal that takes out whole words (and the space beside them), nothing more and nothing new. */
function isWholeWordRemoval(raw: string, e: Edit): boolean {
  if (e.replacement.trim() !== '' || e.original.trim() === '') return false;
  if (raw.slice(e.start, e.end) !== e.original) return false;
  const before = raw[e.start - 1];
  const after = raw[e.end];
  const startsClean = e.start === 0 || /\s/.test(raw[e.start]) || /\s/.test(before ?? ' ');
  const endsClean = e.end === raw.length || /\s/.test(raw[e.end - 1]) || /\s/.test(after ?? ' ');
  return startsClean && endsClean;
}

/**
 * The sentence as pieces: each word of `raw`, with the words an edit took out grouped into one mark. Joined with
 * single spaces the pieces are `raw` with its spacing normalised, so the specimen shows every word the person said.
 */
export function samplePieces(raw: string, edits: readonly Edit[]): SamplePiece[] {
  const pieces: SamplePiece[] = [];
  for (const w of wordsOf(raw)) {
    const edit = edits.findIndex((e) => e.start <= w.start && w.end <= e.end);
    const last = pieces[pieces.length - 1];
    if (edit < 0) pieces.push({ kind: 'word', text: w.text });
    else if (last?.kind === 'mark' && last.edit === edit) last.text = `${last.text} ${w.text}`;
    else pieces.push({ kind: 'mark', text: w.text, edit });
  }
  return pieces;
}

/** The edits the specimen may mark: all of them when every one is a whole-word removal and none was refused, else none. */
export function markableEdits(raw: string, applied: readonly Edit[], rejected: readonly unknown[]): readonly Edit[] {
  return rejected.length === 0 && applied.length > 0 && applied.every((e) => isWholeWordRemoval(raw, e)) ? applied : [];
}

/** The sample, cleaned by the engine, ready to draw. No marks unless every edit is a whole-word removal. */
export function promiseSample(raw: string): PromiseSample {
  const out = cleanSpoken(raw, [], 'en');
  const edits = markableEdits(raw, out.applied, out.rejected);
  return { raw, edits, pieces: samplePieces(raw, edits) };
}

/** The sentence as it now reads, with the fixes in `putBack` returned to the person's own words. */
export function sampleText(sample: PromiseSample, putBack: readonly number[]): string {
  return finalText(
    sample.raw,
    sample.edits.filter((_, i) => !putBack.includes(i)),
  );
}

/**
 * What VoiceOver reads for the sentence: every word in order, each mark said as `takenOut` filled with its words
 * ("Taken out: um,"), or as the words alone once it is put back.
 */
export function sampleA11yLabel(sample: PromiseSample, putBack: readonly number[], takenOut: (words: string) => string): string {
  return sample.pieces.map((p) => (p.kind === 'mark' && !putBack.includes(p.edit) ? takenOut(p.text) : p.text)).join(' ');
}
