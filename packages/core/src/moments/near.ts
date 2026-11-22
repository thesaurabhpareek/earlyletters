/**
 * The near-duplicate rule (spec 7.2a, NS-53-R281(b)). Pictures sorted by time: a picture joins the
 * previous group when its gap to that group's LAST frame is at most nearSeconds and the group's
 * span from its FIRST frame stays within nearGroupMax; the cap stops one long chain from turning a
 * busy day into one candidate. A group never crosses a local midnight. A video is always its own
 * candidate and never breaks a picture chain (CPO-24): the chain is computed over pictures only.
 */
import type { Candidate } from './columns';
import { dayKeyOf, type OffsetAt } from './day';
import type { MomentsRules } from './rules';

const byStart = (a: Candidate, b: Candidate) => a.startMs - b.startMs || (a.ids[0] < b.ids[0] ? -1 : a.ids[0] > b.ids[0] ? 1 : 0);

/** `items` sorted by start time (as `excludeAssets` returns). The result is in the same order. */
export function mergeNear(items: readonly Candidate[], rules: MomentsRules, offsetAt: OffsetAt): Candidate[] {
  const out: Candidate[] = [];
  let open: Candidate | null = null;
  let openDay = '';
  for (const item of items) {
    if (item.video) {
      out.push(item);
      continue;
    }
    const day = dayKeyOf(item.startMs, offsetAt);
    const joins =
      open !== null &&
      day === openDay &&
      item.startMs - open.endMs <= rules.nearSeconds * 1000 &&
      Math.max(open.endMs, item.endMs) - open.startMs <= rules.nearGroupMax * 1000;
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
  return out.sort(byStart);
}
