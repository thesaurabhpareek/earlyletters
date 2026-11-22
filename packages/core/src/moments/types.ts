// Moments (NS-53): the shapes the engine passes around. Pure, no platform import.
// A Moment holds ids and closed keys, never bytes, never a coordinate, never a machine-written
// string. The only free text on it is the parent's own label (R59, R201).
import type { CardKind } from './domain';
import type { Reason } from './reasons';

export type { AccessState, CardKind, MediaKind } from './domain';

/** A local ISO date, `YYYY-MM-DD`, no zone. The stable day key (7.3). */
export type DayKey = string;

declare const parentLabelBrand: unique symbol;
/** Words the parent typed (at most LABEL_MAX_CHARS). Not assignable from or to a machine line. */
export type ParentLabel = string & { readonly [parentLabelBrand]: 'ParentLabel' };

/**
 * A machine line is a closed key, never display text (R201). Place and holiday carry an external
 * table id (R229), never a readable name.
 */
export type MachineLine =
  | { readonly kind: 'reason'; readonly reason: Reason }
  | { readonly kind: 'place'; readonly placeId: string }
  | { readonly kind: 'holiday'; readonly holidayId: string };

export interface Moment {
  readonly dayKey: DayKey;
  readonly cardKind: CardKind;
  /** Exactly one reason per card (R42). */
  readonly reason: Reason;
  /** The machine slot (R201): reason, place, holiday. Disjoint from `parentLabel`. */
  readonly machineLines: readonly MachineLine[];
  /** The parent's own words slot (R201). Null when the parent named nothing. */
  readonly parentLabel: ParentLabel | null;
  /** Tile candidates in tile order: library local ids, memory only (R247). */
  readonly tileIds: readonly string[];
}

/** Columnar, typed arrays, one window. No coordinate, no filename, no pixel data (5.1). */
export interface LibraryWindow {
  readonly ids: readonly string[];
  /** UTC milliseconds. */
  readonly creationMs: Float64Array;
  /** Seconds east of UTC at that asset's date (R223). */
  readonly utcOffsetSec: Int32Array;
  /** Index into MEDIA_KINDS order: 0 image, 1 video. */
  readonly kind: Uint8Array;
  readonly subtypeFlags: Uint32Array;
  readonly favourite: Uint8Array;
  readonly burstId: readonly (string | null)[];
  /** A coarse place cell or id, never a coordinate (R220). */
  readonly placeCell: readonly (string | null)[];
  readonly durationMs: Float64Array;
  readonly truncated: boolean;
}

/** Injected; core never loads it (R229). Null at the call site means date-only cards. */
export interface PlaceTable {
  readonly version: number;
  readonly checksum: string;
}

export type { MomentsRules } from './rules';

