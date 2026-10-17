/**
 * Phone side of the ADTS checks the transcription run makes (ADR 0027):
 * read a recording's frame headers, and, for a take whose last frame a kill
 * cut off, write a temporary copy of its whole frames for the decoder.
 *
 * - The stored recording is only ever read. The copy lives in Caches (never
 *   backed up), under a name that says nothing about the letter, and is
 *   removed when the run ends (transcribe-run.ts `openRecordingForRun`). A
 *   copy left by a run the app was killed in is removed by the next copy or
 *   by the launch sweep once it is an hour old.
 * - Nothing here logs; errors carry no paths.
 */
import { Directory, File, Paths } from 'expo-file-system';
import type { WholeFrameCopy } from '../transcribe-run';
import { scanAdts, type AdtsScan } from './adts';

const PREFIX = 'whole-frames-';
/** A copy older than this is left over from a run that never finished. */
export const STALE_COPY_MS = 60 * 60 * 1000;

/** The ADTS frame count of a stored recording, or null when it is not ADTS or cannot be read. */
export async function scanRecordingFile(uri: string): Promise<AdtsScan | null> {
  try {
    return scanAdts(await new File(uri).bytes());
  } catch {
    return null;
  }
}

function copiesIn(dir: Directory): File[] {
  try {
    return dir.list().filter((f): f is File => f instanceof File && f.name.startsWith(PREFIX));
  } catch {
    return [];
  }
}

/**
 * Writes the first `wholeBytes` of a recording (its whole frames) to a new
 * file in Caches. Runs one at a time (the transcription queue runs one job),
 * so any earlier copy is a leftover and is removed first.
 */
export async function wholeFramesCopy(uri: string, wholeBytes: number): Promise<WholeFrameCopy> {
  removeWholeFrameCopies(0);
  const bytes = await new File(uri).bytes();
  const copy = new File(Paths.cache, `${PREFIX}${Date.now().toString(36)}.aac`);
  copy.create({ overwrite: true });
  copy.write(bytes.subarray(0, Math.min(wholeBytes, bytes.length)));
  return {
    uri: copy.uri,
    remove: () => {
      if (copy.exists) copy.delete();
    },
  };
}

/** Removes whole-frame copies at least `olderThanMs` old (0: all of them). Returns how many went. */
export function removeWholeFrameCopies(olderThanMs = STALE_COPY_MS, nowMs = Date.now()): number {
  let removed = 0;
  for (const f of copiesIn(Paths.cache)) {
    const made = f.creationTime ?? f.modificationTime ?? 0;
    if (olderThanMs > 0 && nowMs - made < olderThanMs) continue;
    try {
      f.delete();
      removed += 1;
    } catch {
      // try again next time
    }
  }
  return removed;
}
