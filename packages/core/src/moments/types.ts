/**
 * NS-53 Moments: the card type (spec 5, R59). The type has no words in it:
 * the only free text is the parent's own label; everything else is a closed
 * key. There is no album member (D6, R57 dropped) and no picture identifier.
 */
import type { MomentKind } from '../domain';
import type { MomentReason } from './reasons';

/** One stable local calendar day key, `YYYY-MM-DD` in the phone's zone (spec 7.1, 7.3). */
export type DayKey = string;

export interface Moment {
  readonly dayKey: DayKey;
  readonly kind: MomentKind;
  /** Exactly one reason from the closed list (R42). */
  readonly reason: MomentReason;
  /** The parent's own typed words, shown verbatim, at most `LABEL_MAX` characters (R55). */
  readonly label?: string;
}
