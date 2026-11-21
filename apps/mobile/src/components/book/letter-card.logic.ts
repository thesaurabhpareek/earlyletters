/**
 * What a Book card says to a screen reader (COMPONENTS 2.5, EXPERIENCE_PASS S26, S27). Pure and tested
 * (test/p5-critics.test.ts). One label for the whole card, with every word of the letter in it.
 *
 * "Recording kept on this phone" is a fact about where the recording is, so it is said only when this phone holds a
 * recording file reference for the letter, `audioUri` and nothing else (K-42, D-033: the "on this phone" fact must be
 * true where it is said; NX-36-S17 G3: a letter pulled onto a new phone, or made with Keep recordings off, has none).
 * The other parent's recording is on their phone, which the letter page's player says in words ("Recording kept on
 * Papa's phone"), and the card is silent about it, as it is for the eye (P5 critics' pass, S7).
 */
export function cardLabel(o: {
  /** "From Mama", or null where the card shows no signature (no words to sign). */
  signature: string | null;
  /** The spoken dateline, with the child's age. */
  dateline: string;
  /** "Voice recording, 1 minute 6 seconds" (book.card.voiceA11y), or null without a recording length. */
  voice?: string | null;
  /** The letter's words, or the app's own note when there are none. */
  text: string;
  inBook: boolean;
  privateLabel: string;
  /** The waiting card's live reason ("Getting ready, 40%"). */
  reason?: string | null;
  /**
   * The letter's recording file reference on THIS phone (`entry.audioUri`). The only fact the clause reads (NX-36-S17 G3,
   * `hasLocalAudio`): a letter pulled onto a new phone has none, and so does one made with Keep recordings off, and
   * neither may be told "kept on this phone". The other parent's letters carry none either.
   */
  audioUri: string | null | undefined;
  recordingOnPhone: string;
}): string {
  return [o.signature, o.dateline, o.voice ?? null, o.text, o.inBook ? null : o.privateLabel, o.reason ?? null, o.audioUri ? o.recordingOnPhone : null].filter(Boolean).join('. ');
}
