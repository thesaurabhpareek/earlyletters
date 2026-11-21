/**
 * Step 4 (spec 7.2, 7.2a, NS-53-R40, R281(a)): which local days qualify. Returns the closed list of
 * ways a day qualifies (empty: it does not). These are NOT card reasons: reasons are PR 1's closed
 * list and are chosen later by precedence. Both busy predicates exist behind `BUSY_RULE`.
 * Under the span rule BUSY_DAY alone does not qualify: a burst-heavy hour is not a day out.
 * Occasion and kept-close come from PR 4 and the decisions store; they arrive as context.
 */
import type { DayGroup } from './group';
import type { GroupingRules } from './rules-input';

export type QualifyBy = 'busy-day' | 'busy-hours' | 'span' | 'sessions' | 'heart' | 'video' | 'occasion' | 'kept-close';
export interface QualifyContext {
  readonly occasion?: boolean;
  readonly keptClose?: boolean;
}

const hoursDense = (starts: readonly number[], count: number, withinMs: number) => {
  for (let i = 0; i + count - 1 < starts.length; i++) if (starts[i + count - 1] - starts[i] <= withinMs) return true;
  return false;
};

export function qualifyDay(day: DayGroup, rules: GroupingRules, ctx: QualifyContext = {}): QualifyBy[] {
  const by: QualifyBy[] = [];
  const cs = day.candidates;
  if (rules.BUSY_RULE === 'hours') {
    if (cs.length >= rules.BUSY_DAY) by.push('busy-day');
    else if (hoursDense(cs.map((c) => c.startMs), rules.BUSY_HOURS_COUNT, rules.BUSY_HOURS_WITHIN_SECONDS * 1000)) by.push('busy-hours');
  } else if (cs.length >= rules.BUSY_HOURS_COUNT) {
    const span = cs[cs.length - 1].endMs - cs[0].startMs;
    if (day.sessions.length >= 2) by.push('sessions');
    else if (span >= rules.MIN_SPAN_SECONDS * 1000) by.push('span');
  }
  if (cs.some((c) => c.favourite)) by.push('heart');
  if (cs.some((c) => c.video)) by.push('video');
  if (ctx.occasion) by.push('occasion');
  if (ctx.keptClose) by.push('kept-close');
  return by;
}

export const qualifies = (day: DayGroup, rules: GroupingRules, ctx: QualifyContext = {}): boolean => qualifyDay(day, rules, ctx).length > 0;
