/**
 * The columnar window the native fetch hands to the engine (spec 10.1 step 1, ARCHITECTURE-BRIEF 5.1).
 * Pure: no platform import (CODE-R10). Ids live in memory only (R247). No coordinate, filename or
 * pixel data is in this shape. PR 1's `types.ts` may export the same names later; this file is the
 * minimum PR 2 needs and is to be reconciled there (one definition, CODE-R13).
 */
export const KIND_IMAGE = 0;
export const KIND_VIDEO = 1;

/**
 * Subtype bits. ASSUMED values: PR 9 (`scribe-library`) must write the same bits; a parity test
 * belongs with that PR. HIDDEN is defensive: the fetch never sets `includeHiddenAssets` (7.1).
 */
export const SUBTYPE = {
  SCREENSHOT: 1 << 0,
  SCREEN_RECORDING: 1 << 1,
  ANIMATED: 1 << 2,
  HIDDEN: 1 << 3,
  NOT_USER_LIBRARY: 1 << 4,
  PANORAMA: 1 << 5,
  LIVE: 1 << 6,
} as const;

export interface AssetColumns {
  ids: readonly string[];
  /** UTC ms. A missing date arrives as 0 or NaN and is excluded. */
  creationMs: Float64Array;
  kind: Uint8Array;
  subtypeFlags: Uint32Array;
  favourite: Uint8Array;
  burstId: readonly (string | null)[];
  durationMs: Float64Array;
}

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
