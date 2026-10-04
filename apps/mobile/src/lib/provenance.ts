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
