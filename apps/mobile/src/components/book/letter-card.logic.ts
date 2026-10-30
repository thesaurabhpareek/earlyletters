/**
 * What a Book card says to a screen reader (COMPONENTS 2.5, EXPERIENCE_PASS S26, S27). Pure and tested
 * (test/p5-critics.test.ts). One label for the whole card, with every word of the letter in it.
 *
 * "Recording kept on this phone" is a fact about where the recording is, so it is said only for the reader's own
 * letters (K-42, D-033: the "on this phone" fact must be true where it is said). The other parent's recording is on
 * their phone, which the letter page's player says in words ("Recording kept on Papa's phone"), and the card is silent
 * about it, as it is for the eye (P5 critics' pass, S7).
 */
export function cardLabel(o: {
  /** "From Mama", or null where the card shows no signature (no words to sign). */
  signature: string | null;
  /** The spoken dateline, with the child's age. */
  dateline: string;
  /** The letter's words, or the app's own note when there are none. */
  text: string;
  inBook: boolean;
  privateLabel: string;
  /** The waiting card's live reason ("Getting ready, 40%"). */
  reason?: string | null;
  spoken: boolean;
  /** Written on this phone's account (isOwnEntry). */
  own: boolean;
  recordingOnPhone: string;
}): string {
  return [o.signature, o.dateline, o.text, o.inBook ? null : o.privateLabel, o.reason ?? null, o.spoken && o.own ? o.recordingOnPhone : null].filter(Boolean).join('. ');
}
