/**
 * The words card on the letter page, under the player (EXPERIENCE_PASS S28, D-086; P5 critics' pass S3). Pure and
 * tested (test/p5-critics.test.ts).
 *
 *   waiting  a recording kept before its words were written down. The card gives the reason and, when it would
 *            help, one action (Try again, or Get words ready), then "Write the words".
 *   noWords  a recording whose words came back empty (nobody talked in it, or the phone did not hear it as talking).
 *            "Write the words" only: there is nothing to try again or fetch, so no "Try again" or "Get words ready"
 *            shows, whatever an old job says. The app's own note above the player already says there are no words.
 *            Offered only where the store can take the words: not once the letter is on the server, where the raw
 *            is fixed (store.canTypeWordsFor), so the button never promises what the write refuses.
 *   null     no card: the other parent's letter (their words are theirs to write), or a letter with words.
 *
 * Both kinds open the same sheet and leave the same way: the typed words are kept at once, and Review opens for the
 * letter, where Keep counts them.
 */
import type { LetterWords } from './letter-words.logic';

export type WordsCardKind = 'waiting' | 'noWords';

export function wordsCardKind(o: { own: boolean; words: LetterWords; canWrite: boolean }): WordsCardKind | null {
  if (!o.own) return null;
  if (o.words === 'waiting') return 'waiting';
  if (o.words === 'nobodySpoke' && o.canWrite) return 'noWords';
  return null;
}

/** The words queue's job for the letter, as far as the card reads it. */
type JobView = { phase: string; failure?: string } | null | undefined;

/** What the queue's job lets the card show. A letter with no words has no job to follow. */
export function wordsCardState(kind: WordsCardKind, job: JobView): { failed: boolean; retryable: boolean; packWait: boolean; languageWait: boolean } {
  if (kind === 'noWords') return { failed: false, retryable: false, packWait: false, languageWait: false };
  const failed = job?.phase === 'failed';
  return {
    failed,
    // A missing file or an unsupported recording will not change by trying again.
    retryable: failed && job?.failure !== 'file_missing' && job?.failure !== 'unsupported',
    packWait: job?.phase === 'waiting_for_pack',
    languageWait: job?.phase === 'waiting_for_language',
  };
}
