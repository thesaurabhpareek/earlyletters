/**
 * The device half of "Erase now" and the 30 day purge (D-085): removes a
 * deleted letter's recording and its listening copy. The store calls this
 * first and removes the row only after it returns (store.eraseEntry), so a
 * file never outlives its row where the sweep could re-attach it.
 *
 * Idempotent: a file that is already gone is success. A file that exists and
 * cannot be removed throws, which keeps the row on the shelf for a retry.
 */
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { removeListeningCopy } from '../audio-enhance';
import { eraseEntry, purgeExpired, recordLaunch, type AudioEraser } from '../store';

export const eraseAudioFile: AudioEraser = (uri, entryId) => {
  // The web preview has no recordings on disk (the sweep skips it too): nothing to remove there.
  if (uri && Platform.OS !== 'web') {
    const f = new File(uri);
    if (f.exists) f.delete();
  }
  removeListeningCopy(entryId);
};

/** Erase now, from the shelf. True when the letter and its recording are gone. */
export function eraseDeletedLetter(id: string): boolean {
  return eraseEntry(id, eraseAudioFile);
}

/** Launch purge, then record this launch for the clock guard. Returns how many letters were erased. */
export function purgeShelfAtLaunch(nowMs = Date.now()): number {
  const n = purgeExpired(nowMs, eraseAudioFile);
  recordLaunch(nowMs);
  return n;
}
