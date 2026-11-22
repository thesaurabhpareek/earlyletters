/**
 * The closed values the native fetch and the engine share for the columnar window (spec 10.1 step 1,
 * ARCHITECTURE-BRIEF 5.1). The window itself is `LibraryWindow` in `types.ts`. This file is the one
 * owner of the kind and subtype values; PR 9 imports them (CPrivO-13). Pure: no platform import (CODE-R10).
 */
import { MEDIA_KINDS } from './domain';

export const KIND_IMAGE = MEDIA_KINDS.indexOf('image');
export const KIND_VIDEO = MEDIA_KINDS.indexOf('video');

/**
 * Subtype bits. ASSUMED values: PR 9 (`scribe-library`) must write the same bits; a parity test
 * belongs with that PR. Hidden and non-user-library assets are not bits here (CPrivO-13): the fetch
 * never sets `includeHiddenAssets` and passes its source option explicitly (UNVERIFIED on a device, G1a-L).
 */
export const SUBTYPE = {
  SCREENSHOT: 1 << 0,
  SCREEN_RECORDING: 1 << 1,
  ANIMATED: 1 << 2,
  PANORAMA: 1 << 3,
  LIVE: 1 << 4,
} as const;

/** One thing a person could have wanted to keep: a picture, a burst or near-duplicate group, or a video. */
export interface Candidate {
  readonly ids: readonly string[];
  readonly startMs: number;
  readonly endMs: number;
  readonly video: boolean;
  /** True when any member is a favourite. */
  readonly favourite: boolean;
  readonly durationMs: number;
}
