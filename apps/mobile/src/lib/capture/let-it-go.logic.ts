/**
 * "Let it go" in Review, confirmed (BL-379; F04-REQ-009). Three steps, in this order, so a kill between any two never
 * leaves a draft whose audio is gone but which still looks like a letter:
 *   1. beginDiscard marks the draft `discarding` (it leaves every list at once),
 *   2. the audio file is deleted (a file already gone is the same as removed),
 *   3. finishDiscard removes the row.
 * A kill after step 1 leaves the mark; the launch sweep finishes it and never re-attaches the file.
 *
 * Pure: the three steps are passed in. Tested in Node (test/let-it-go.test.ts).
 */
export interface LetItGoSteps {
  beginDiscard: (id: string) => boolean;
  deleteFile: (uri: string) => void;
  finishDiscard: (id: string) => boolean;
}

/** True when the draft is gone. False when there was no such draft (nothing was touched, no file deleted). */
export function letItGo(id: string, audioUri: string | null | undefined, steps: LetItGoSteps): boolean {
  if (!steps.beginDiscard(id)) return false;
  if (audioUri) {
    try {
      steps.deleteFile(audioUri);
    } catch {
      // A file already gone is the same as removed.
    }
  }
  return steps.finishDiscard(id);
}
