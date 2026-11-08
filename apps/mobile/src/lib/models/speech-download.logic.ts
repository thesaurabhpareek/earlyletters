/**
 * What a language's speech download is doing right now, from the pack engine's latest event per pack. Pure, so
 * Node tests can check it (test/speech-download-status.test.ts); speech-packs.ts and the transcription queue feed
 * it the live map.
 *
 * The rule (TestFlight build 1, 1 Nov 2026): a percent exists only while bytes are moving, that is while a pack is
 * in the engine's `downloading` phase. A pack that is queued, waiting for Wi-Fi, being checked or being moved into
 * place is not moving, so it has a stage and no percent. Before this rule a queued or Wi-Fi-waiting pack counted as
 * "in flight" with 0 bytes, and the first-run card read "Getting ready, 0%" for something that was not moving.
 */

export interface PackEvent {
  phase: string;
  bytesDone: number;
}

/** The download's stage when no bytes are moving: waiting its turn, or checking and finishing the file. */
export type DownloadStage = 'queued' | 'verifying' | 'installing';

export interface DownloadMotion {
  /** 0..1 across every pack the language needs (installed ones count in full), or null when no bytes are moving. */
  progress: number | null;
  /** What a pack that is not moving is doing, when nothing is moving; null when idle, moving, waiting or failed. */
  stage: DownloadStage | null;
}

const STAGES: readonly string[] = ['queued', 'verifying', 'installing'];

export function downloadMotion(
  packs: readonly string[],
  bytesOf: (id: string) => number,
  installed: (id: string) => boolean,
  latest: ReadonlyMap<string, PackEvent>,
): DownloadMotion {
  let done = 0;
  let total = 0;
  let moving = false;
  let stage: DownloadStage | null = null;
  for (const id of packs) {
    const bytes = bytesOf(id);
    total += bytes;
    if (installed(id)) {
      done += bytes;
      continue;
    }
    const p = latest.get(id);
    if (!p) continue;
    if (p.phase === 'downloading') {
      moving = true;
      done += Math.min(bytes, Math.max(0, p.bytesDone));
    } else if (STAGES.includes(p.phase) && stage === null) {
      stage = p.phase as DownloadStage;
    }
  }
  if (moving && total > 0) return { progress: done / total, stage: null };
  return { progress: null, stage };
}

/** The whole percent to show, or null when there is none worth showing: never "0%", never "100%" before it is done. */
export function shownPercent(progress: number | null): number | null {
  if (progress === null || !Number.isFinite(progress)) return null;
  const n = Math.floor(progress * 100);
  return n < 1 ? null : Math.min(99, n);
}
