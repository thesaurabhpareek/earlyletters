/**
 * Review of a letter whose words arrived later (F14 6.1 :129, 6.2 B2 steps 3 and 4; M17, D-103; F14-REQ-037).
 *
 * A voice letter kept without words is already saved. Its words come later: the machine writes them down, or the
 * author types them on the letter page ("Write the words"). Either way they are stored at once as the letter's
 * words waiting for the author's review (Entry.wordsUnreviewed), so they are never lost, and the letter page never
 * counts them and never shows a Plus sheet (6.1, 6.4). It opens Review for the letter instead, and Review's one Keep
 * step (keepNeedsPlus, lib/billing/keep-step.ts) decides: the letter counts there, or the Keep sheet opens there.
 *
 * Review reads the letter through the draft shape it already knows. The words are shown exactly as they are stored,
 * as typed words are: no fix is proposed and nothing can be changed here, because keeping them writes no words
 * (store `keepReviewedWords`). Pure; tested in test/review-later-words.test.ts.
 */
import type { Draft, Entry } from '@/lib/store';

/** The letter as Review's draft, when it is a letter of the author's with words waiting for review; else null. */
export function laterWordsDraft(e: Entry | null | undefined, own: (e: Entry) => boolean): Draft | null {
  if (!e || e.kind !== 'letter' || !e.wordsUnreviewed || !e.childId || !own(e)) return null;
  return {
    id: e.id,
    childId: e.childId,
    captureMode: e.captureMode,
    promptKey: e.promptKey,
    createdAt: e.capturedAt,
    audioUri: e.audioUri ?? null,
    audioDurationMs: e.audioDurationMs ?? null,
    rawTranscript: e.rawTranscript,
    // Shown as typed words are: exactly as stored, with no fix proposed (they are kept as they are).
    typedText: e.finalText,
    state: 'ready',
    audioSha256: e.audioSha256 ?? null,
    audioBytes: e.audioBytes ?? null,
    recoveredAt: null,
  };
}
