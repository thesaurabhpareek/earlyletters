/**
 * How a letter's words came to be, in the one place both the letter page and the export read (D-086).
 * Pure: no React Native, no alias imports, so it is unit tested.
 *
 * "Spoken, exactly as said" is a claim, so it is made only when it is true: the words kept equal the words
 * the microphone heard. A letter whose level is `verbatim` can still carry a name or punctuation fix (every
 * language without fix rules does), so the level alone never earns the word "exactly".
 */
export type Provenance = 'spokenFixed' | 'spokenExact' | 'typed';

export function provenanceKey(e: { captureMode: string; finalText: string; rawTranscript: string }): Provenance {
  // Typed words (including words typed for a recording that could not be written down) are the person's own typing.
  if (e.captureMode === 'typed' || e.captureMode === 'mixed') return 'typed';
  return e.finalText.trim() === e.rawTranscript.trim() ? 'spokenExact' : 'spokenFixed';
}

/** What the letter page can call a letter's words: the three above, and "spoken" alone where the fixes cannot be known. */
export type PageProvenance = Provenance | 'spokenOther';

/**
 * The key for the letter page's one provenance line (S27). The other parent's phone never holds their raw words
 * (the book view leaves out the author's working material), so there the kept words can be compared with nothing:
 * "with small fixes" and "exactly as said" would both be guesses, the first a claim that software changed a person's
 * words. Where the raw words are not on this phone, a spoken letter is called only spoken (P5 critics' pass, S8).
 * Typed words are known to be typed from the capture mode alone.
 */
export function pageProvenanceKey(e: { captureMode: string; finalText: string; rawTranscript: string }, o: { own: boolean }): PageProvenance {
  const key = provenanceKey(e);
  if (key === 'typed') return key;
  return o.own && e.rawTranscript.trim() !== '' ? key : 'spokenOther';
}

/**
 * The letter page's provenance line: how the words came to be and, for the reader's own spoken letter, where the
 * recording is ("Spoken, with small fixes. Recording kept on this phone."). The other parent's recording is on their
 * phone, which the player says, so their line carries no place. Strings come in, so this stays pure.
 */
export function provenanceLine(
  e: { captureMode: string; finalText: string; rawTranscript: string },
  o: { own: boolean; words: Record<PageProvenance, string>; recordingOnPhone: string },
): string {
  const how = o.words[pageProvenanceKey(e, o)];
  return e.captureMode !== 'typed' && o.own ? `${how}. ${o.recordingOnPhone}.` : how;
}

/**
 * Whether the letter page offers "Exactly as said": the author's own spoken letter, with words, whose raw words are on
 * this phone and differ from the kept words. With no raw words here (the author's raw is empty on this phone), the view
 * would be an empty page, and the provenance line says only "Spoken" (S8), so there is nothing to switch to.
 */
export function exactViewAvailable(e: { captureMode: string; finalText: string; rawTranscript: string }, o: { own: boolean; hasWords: boolean }): boolean {
  return o.own && o.hasWords && e.captureMode !== 'typed' && e.rawTranscript.trim() !== '' && e.rawTranscript !== e.finalText;
}
