/**
 * "Let it go" in Review, confirmed (BL-379; F04-REQ-009). Three steps, in this order, so a kill between any two never
 * leaves a draft whose audio is gone but which still looks like a letter:
 *   1. beginDiscard marks the draft `discarding` (it leaves every list at once),
 *   2. the audio file is deleted (a file already gone is the same as removed; any other failure stops here),
 *   3. finishDiscard removes the row.
 * A kill after step 1 leaves the mark; the launch sweep finishes it and never re-attaches the file.
 *
 * Pure: the three steps are passed in. Tested in Node (test/let-it-go.test.ts).
 */
export interface LetItGoSteps {
  beginDiscard: (id: string) => boolean;
  /** Must treat a file that is already gone as success (see deleteIfPresent); any throw means the file may still be there. */
  deleteFile: (uri: string) => void;
  finishDiscard: (id: string) => boolean;
}

/** The file-system side of step 2: a file that is not there counts as removed; a real failure (permission, IO) throws. */
export function deleteIfPresent(file: { exists: boolean; delete: () => void }): void {
  if (file.exists) file.delete();
}

/**
 * True when the draft is gone. False when there was no such draft (nothing was touched, no file deleted), or when the
 * audio file could not be deleted: then the row is NOT removed and stays `discarding` (off every list), so the audio is
 * never orphaned behind a vanished row and a later pass can finish the job.
 */
export function letItGo(id: string, audioUri: string | null | undefined, steps: LetItGoSteps): boolean {
  if (!steps.beginDiscard(id)) return false;
  if (audioUri) {
    try {
      steps.deleteFile(audioUri);
    } catch {
      return false;
    }
  }
  return steps.finishDiscard(id);
}
