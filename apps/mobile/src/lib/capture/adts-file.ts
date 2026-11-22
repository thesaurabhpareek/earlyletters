/**
 * Phone side of the ADTS checks the transcription run makes (ADR 0027):
 * read a recording's frame headers, and, for a take whose last frame a kill
 * cut off, write a temporary copy of its whole frames for the decoder.
 *
 * The copy is a second copy of a person's voice, so it never outlives its
 * use (privacy; LEGAL-REQ-018; #207 "erase removes every copy"):
 * - The stored recording is only ever read. The copy lives in Caches (never
 *   backed up), under a name that says nothing about the letter: a short
 *   key of the recording's file name, so erase can find it, and the time.
 * - It is removed when the run ends (transcribe-run.ts `openRecordingForRun`).
 * - Erase now and the 30 day purge remove the copies of the recording they
 *   erase (erase.ts), also mid-run.
 * - The transcription queue removes every copy when it starts, before its
 *   first job (a copy then is left from a run the app was killed in).
 * - The launch sweep removes any copy an hour old, as a backstop.
 * - Nothing here logs; errors carry no paths.
 */
import { Directory, File, Paths } from 'expo-file-system';
import type { WholeFrameCopy } from '../transcribe-run';
import { scanAdts, type AdtsScan } from './adts';
import { fileNameOf } from './sweep.logic';

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

/**
 * Eight hex digits from a recording's file name (FNV-1a), the same in every
 * container: it ties a copy to its recording without naming the recording or
 * the letter.
 */
export function copyKeyOf(uri: string): string {
  let h = 0x811c9dc5;
  for (const ch of fileNameOf(uri)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function copiesIn(dir: Directory, prefix = PREFIX): File[] {
  try {
    return dir.list().filter((f): f is File => f instanceof File && f.name.startsWith(prefix));
  } catch {
    return [];
  }
}

/**
 * Writes the first `wholeBytes` of a recording (its whole frames) to a new
 * file in Caches. Runs one at a time (the transcription queue runs one job),
 * so any earlier copy is a leftover and is removed first. If the recording
 * was erased while the copy was being written, the copy goes too and this
 * throws, as reading a missing recording does.
 */
export async function wholeFramesCopy(uri: string, wholeBytes: number): Promise<WholeFrameCopy> {
  removeWholeFrameCopies(0);
  const bytes = await new File(uri).bytes();
  const copy = new File(Paths.cache, `${PREFIX}${copyKeyOf(uri)}-${Date.now().toString(36)}.aac`);
  copy.create({ overwrite: true });
  copy.write(bytes.subarray(0, Math.min(wholeBytes, bytes.length)));
  if (!new File(uri).exists) {
    if (copy.exists) copy.delete();
    throw Object.assign(new Error('recording_missing'), { code: 'ERR_SCRIBE_AUDIO_FILE_MISSING' });
  }
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

/**
 * Removes every whole-frame copy of the recording at `uri`, for erase. A copy
 * that exists and cannot be removed throws, like the recording itself
 * (erase.ts keeps the letter on the shelf for a retry).
 */
export function removeWholeFrameCopiesOf(uri: string): number {
  const copies = copiesIn(Paths.cache, `${PREFIX}${copyKeyOf(uri)}-`);
  for (const f of copies) if (f.exists) f.delete();
  return copies.length;
}
