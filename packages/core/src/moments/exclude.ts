/**
 * Step 2 of the pipeline (spec 10.1): drop what is never a candidate, then collapse bursts.
 * Excluded assets leave no trace: no count, no id, no empty candidate (NS-53-R38).
 * The parent's "leave out this picture" is dropped (R255, v3), so there is no per-picture exclusion.
 */
import { KIND_VIDEO, SUBTYPE, type Candidate } from './columns';
import type { LibraryWindow } from './types';

const EXCLUDED = SUBTYPE.SCREENSHOT | SUBTYPE.SCREEN_RECORDING | SUBTYPE.ANIMATED;

interface Frame {
  id: string;
  ms: number;
  video: boolean;
  heart: boolean;
  burst: string | null;
  duration: number;
}

const byTime = (a: Frame, b: Frame) => a.ms - b.ms || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function toCandidate(fs: Frame[]): Candidate {
  return {
    ids: fs.map((f) => f.id),
    startMs: fs[0].ms,
    endMs: fs[fs.length - 1].ms,
    video: fs[0].video,
    favourite: fs.some((f) => f.heart),
    durationMs: fs.reduce((m, f) => Math.max(m, f.duration), 0),
  };
}

/** Candidates sorted by start time then id, so the result is the same in any input order. */
export function excludeAssets(c: LibraryWindow): Candidate[] {
  const loose: Frame[] = [];
  const bursts = new Map<string, Frame[]>();
  for (let i = 0; i < c.ids.length; i++) {
    const ms = c.creationMs[i];
    // CDO-21: a missing date crosses the bridge as NaN; a reset camera clock gives 0 or less.
    if (!Number.isFinite(ms) || ms <= 0) continue;
    if (c.subtypeFlags[i] & EXCLUDED) continue;
    const video = c.kind[i] === KIND_VIDEO;
    // CPO-24: a burst id on a video is ignored. A short burstId column reads as no burst.
    const burst = video ? null : (c.burstId[i] ?? null);
    const f: Frame = { id: c.ids[i], ms, video, heart: c.favourite[i] === 1, burst, duration: c.durationMs[i] };
    if (burst === null) loose.push(f);
    else (bursts.get(burst) ?? bursts.set(burst, []).get(burst)!).push(f);
  }
  const out = loose.map((f) => toCandidate([f]));
  for (const frames of bursts.values()) out.push(toCandidate(frames.sort(byTime)));
  return out.sort((a, b) => a.startMs - b.startMs || (a.ids[0] < b.ids[0] ? -1 : 1));
}
