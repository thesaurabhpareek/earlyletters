/**
 * The near-duplicate rule (spec 7.2a, NS-53-R281(b)). Sorted by time, a candidate joins the
 * previous group when its gap to that group's LAST frame is at most NEAR_SECONDS and the group's
 * span from its FIRST frame stays within NEAR_GROUP_MAX_SECONDS; the cap stops one long chain from
 * turning a busy day into one candidate. A group never crosses a local midnight, and a video is
 * always its own candidate (ASSUMED: the spec is silent; a video must stay visible as a video).
 */
import type { Candidate } from './columns';
import { dayKeyOf, type OffsetAt } from './day';
import type { GroupingRules } from './rules-input';

/** `items` sorted by start time (as `excludeAssets` returns). */
export function mergeNear(items: readonly Candidate[], rules: GroupingRules, offsetAt: OffsetAt): Candidate[] {
  const out: Candidate[] = [];
  let open: Candidate | null = null;
  let openDay = '';
  for (const item of items) {
    const day = dayKeyOf(item.startMs, offsetAt);
    const joins =
      open !== null &&
      !open.video &&
      !item.video &&
      day === openDay &&
      item.startMs - open.endMs <= rules.NEAR_SECONDS * 1000 &&
      Math.max(open.endMs, item.endMs) - open.startMs <= rules.NEAR_GROUP_MAX_SECONDS * 1000;
    if (open !== null && joins) {
      open = {
        ids: [...open.ids, ...item.ids],
        startMs: open.startMs,
        endMs: Math.max(open.endMs, item.endMs),
        video: false,
        favourite: open.favourite || item.favourite,
        durationMs: Math.max(open.durationMs, item.durationMs),
      };
    } else {
      if (open !== null) out.push(open);
      open = item;
      openDay = day;
    }
  }
  if (open !== null) out.push(open);
  return out;
}
