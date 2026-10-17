/**
 * The device half of "Erase now" and the 30 day purge (D-085): removes a
 * deleted letter's recording and its listening copy. The store calls this
 * first and removes the row only after it returns (store.eraseEntry), so a
 * file never outlives its row where the sweep could re-attach it.
 *
 * The recording is removed where it is now, not only where the row says:
 * after iOS moves the app's container the stored path names the old one,
 * while the file sits in this container's `Documents/ExpoAudio`. The sweep
 * pairs files with rows by name, so a file of that name left in a recording
 * folder would come back as a draft at the next launch (recordings.ts).
 *
 * A file another draft or letter may own is never removed: one the other row
 * names exactly, or a same-name file the sweep could pair with it
 * (sweep.logic.ts belongsToAnotherRow). The letter's row still goes; the file
 * stays with the row that has it.
 *
 * Idempotent: a file that is already gone is success. A file that exists and
 * cannot be removed throws, which keeps the row on the shelf for a retry.
 */
import { Platform } from 'react-native';
import { removeListeningCopy } from '../audio-enhance';
import { audioRows, eraseEntry, finishServerErased, purgeExpired, recordLaunch, type AudioEraser } from '../store';
import { erasableFiles } from './recordings';

export const eraseAudioFile: AudioEraser = (uri, entryId) => {
  // The web preview has no recordings on disk (the sweep skips it too): nothing to remove there.
  if (uri && Platform.OS !== 'web') {
    for (const f of erasableFiles(uri, otherAudioUris(entryId))) if (f.exists) f.delete();
  }
  removeListeningCopy(entryId);
};

/** Stored paths of every other draft and letter, deleted letters included (they can still be restored). */
function otherAudioUris(entryId: string): string[] {
  const { drafts, entries } = audioRows();
  return [...drafts, ...entries.filter((e) => e.id !== entryId)].flatMap((r) => (r.audioUri ? [r.audioUri] : []));
}

/** Erase now, from the shelf. True when the letter and its recording are gone. */
export function eraseDeletedLetter(id: string): boolean {
  return eraseEntry(id, eraseAudioFile);
}

/** Letters the server erased for good: their files, then their rows (after every pull, and at launch). */
export function finishErasedLetters(): number {
  return finishServerErased(eraseAudioFile);
}

/** Launch purge, then record this launch for the clock guard. Returns how many letters were erased. */
export function purgeShelfAtLaunch(nowMs = Date.now()): number {
  const n = purgeExpired(nowMs, eraseAudioFile) + finishServerErased(eraseAudioFile);
  recordLaunch(nowMs);
  return n;
}
