/**
 * Room to record (EXPERIENCE_PASS_2026-10 S13, package P4): Listen checks this phone's free space before
 * `beginTake`, so a full phone says "This phone is full" instead of "The microphone is off".
 *
 * Pure, so it is tested in Node (test/free-space.test.ts): the reader is passed in. listen.tsx passes
 * expo-file-system's `Paths.availableDiskSpace`, the same reading the speech download and export use (the privacy
 * manifest's DiskSpace reason E174.1: check for space before writing a file, and behave visibly differently).
 *
 * 50 MB is about 100 minutes of voice at 0.48 MB a minute (recorder.ts: AAC-LC, mono, 64 kbps), with room for the
 * database and the listening copy. Below it a new take is not started; nothing already on the phone is touched.
 * A reading that is missing, zero or not a number is unknown (the web preview reports 0), and unknown never blocks a
 * take. On a phone the reading is always there; were it ever unknown on a full phone, the recorder's own start would
 * fail and Listen would show its start-failure state with Try again (listen.logic.ts `startFailure`).
 */

/** Below this many free bytes Listen does not start a take (S13). */
export const MIN_FREE_BYTES_TO_RECORD = 50_000_000;

/** Free bytes from a reader, or null when the reading is unknown. Never throws. */
export function freeBytesFrom(read: () => number): number | null {
  try {
    const n = read();
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Whether a take may start: true at or above the threshold, and when the free space is unknown. */
export function roomToRecord(freeBytes: number | null): boolean {
  return freeBytes === null || freeBytes >= MIN_FREE_BYTES_TO_RECORD;
}
