/**
 * The cleaner listening copy of a recording (founder decision 8, 3 Oct 2026).
 *
 * The original recording is never altered. The speech agent may make a
 * second file for listening (Apple voice processing, RNNoise or
 * DeepFilterNet). The player plays that copy when it exists and matches the
 * original, and the person can always switch to the original. Export carries
 * only the original.
 *
 * CONTRACT FOR THE SPEECH AGENT (src/lib/capture or a speech module):
 * call `provideListeningCopies(lookup)` once at boot. `lookup(entryId)`
 * returns the copy for that letter or null, synchronously (read it from your
 * own table or a sidecar file; no network). A copy is used only when:
 * - `uri` is a local file that exists, AAC-LC in an M4A like the original;
 * - `sourceSha256` equals the letter's `audioSha256` (the original's hash at
 *   capture), so a copy made from a different take is never played;
 * - `uri` is not the original's own path.
 * Keep copies in Application Support with the models (not backed up; they
 * can be made again), and delete a copy when its letter is purged.
 */
import { File } from 'expo-file-system';
import { getSetting, setSetting, type Entry } from '../store';
import { usableListeningCopy, type ListeningCopy } from './player.logic';

export type { ListeningCopy } from './player.logic';
export type ListeningCopyLookup = (entryId: string) => ListeningCopy | null;

let lookup: ListeningCopyLookup | null = null;

/** Registers where listening copies come from (null removes it). */
export function provideListeningCopies(fn: ListeningCopyLookup | null): void {
  lookup = fn;
}

function exists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/** The usable listening copy for a letter, or null (no provider, none made, stale, or the file is gone). */
export function listeningCopyFor(entry: Pick<Entry, 'id' | 'audioUri' | 'audioSha256'>): ListeningCopy | null {
  if (!lookup || !entry.audioUri) return null;
  let copy: ListeningCopy | null = null;
  try {
    copy = lookup(entry.id);
  } catch {
    return null;
  }
  return usableListeningCopy({ originalUri: entry.audioUri, recordedSha256: entry.audioSha256 ?? null, copy, copyExists: copy ? exists(copy.uri) : false });
}

const ORIGINAL_KEY = 'player.original';

/** "Original recording" switch, remembered on this phone (a plain on/off, L2). */
export function prefersOriginal(): boolean {
  return getSetting(ORIGINAL_KEY) === 'on';
}

export function setPrefersOriginal(on: boolean): void {
  setSetting(ORIGINAL_KEY, on ? 'on' : 'off');
}
