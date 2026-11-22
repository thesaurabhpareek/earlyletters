/**
 * Step 3 (spec 10.1, 7.1): the local calendar day through `offsetAt`, then sessions.
 * `offsetAt(ms)` is the UTC offset in seconds the phone's zone has at that instant; core never
 * reads a zone database (no Intl; NS-53-R223 scopes that rule to `moments/`). Because the day is
 * read off the local wall clock, the repeated hour of a clock change stays inside one day.
 */
import type { Candidate } from './columns';
import { dayKeyOf, type OffsetAt } from './day';
import { excludeAssets } from './exclude';
import { mergeNear } from './near';
import type { MomentsRules } from './rules';
import type { LibraryWindow } from './types';

export { dayKeyOf, type OffsetAt } from './day';

export interface DayGroup {
  readonly dayKey: string;
  /** In time order. */
  readonly candidates: readonly Candidate[];
  /** Split where the gap to the previous candidate's end exceeds SESSION_GAP; never named or counted for a person. */
  readonly sessions: readonly (readonly Candidate[])[];
}

/** Exclude, collapse, merge near-duplicates, then group by local day, oldest day first. */
export function groupByDay(c: LibraryWindow, offsetAt: OffsetAt, rules: MomentsRules): DayGroup[] {
  const byDay = new Map<string, Candidate[]>();
  for (const cand of mergeNear(excludeAssets(c), rules, offsetAt)) {
    const k = dayKeyOf(cand.startMs, offsetAt);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(cand);
  }
  return [...byDay.keys()].sort().map((dayKey) => {
    const candidates = byDay.get(dayKey)!;
    const sessions: Candidate[][] = [];
    let prevEnd = -Infinity;
    for (const cand of candidates) {
      if (cand.startMs - prevEnd > rules.sessionGap * 1000) sessions.push([]);
      sessions[sessions.length - 1].push(cand);
      prevEnd = Math.max(prevEnd, cand.endMs);
    }
    return { dayKey, candidates, sessions };
  });
}
