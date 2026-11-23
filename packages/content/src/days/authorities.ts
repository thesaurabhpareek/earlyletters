/**
 * Who says a date is the date (BL-1011, NS-46-R1). Keys only; no words a parent reads. `verified` is false until a
 * named `content` reader has opened the source and recorded the date (NS-46-R24); it is never set from memory.
 * No third-party table is copied for any rule date (DL-4); copied-source rows ship as `n/r` until counsel answers Q113.
 */
export interface DayAuthority { id: string; label: string; kind: 'statute' | 'computed' | 'observatory' | 'convention'; verified: boolean }

export const DAY_AUTHORITIES: readonly DayAuthority[] = [
  { id: 'us_5usc6103', label: 'United States Code, title 5, section 6103 (federal holidays)', kind: 'statute', verified: false },
  { id: 'us_observance_law', label: 'United States Code, title 36 (patriotic and national observances)', kind: 'statute', verified: false },
  { id: 'us_common_date', label: 'Fixed calendar date by common usage in the United States', kind: 'convention', verified: false },
  { id: 'computus_gregorian', label: 'Gregorian computus (Western Easter), computed on the phone', kind: 'computed', verified: false },
  { id: 'usno_seasons', label: 'U.S. Naval Observatory, Earth\'s seasons (instants in UTC)', kind: 'observatory', verified: false },
];
export const DAY_AUTHORITY_IDS: ReadonlySet<string> = new Set(DAY_AUTHORITIES.map((a) => a.id));
