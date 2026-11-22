/**
 * For you, pictures slot: the class order and the seeded rotation
 * (NS-53-R51; MT-P6-R30 to R33, R39; PRD 28 section 7.3).
 *
 * Ranking is never from a score, a heart count, a tap or a dwell. Only
 * explicit teaching counts, and it arrives as `excludeDayKeys`. No random
 * source and no clock: the same library, book and local date give the same
 * day on every open and on two phones.
 */

import { fixedHash } from './hash';
import { MOMENTS_RULES } from './rules';

export interface RankDay {
  /** Stable local day key, `YYYY-MM-DD`. */
  readonly dayKey: string;
  readonly occasion: boolean;
  readonly yearAgo: boolean;
  /** Holds a picture the parent hearted. */
  readonly heart: boolean;
  readonly busy: boolean;
  readonly video: boolean;
}

export type PicturesClass = 'occasion' | 'yearAgo' | 'heart' | 'busy' | 'video';

/** Candidate classes in order (MT-P6-R30). */
export const PICTURES_CLASS_ORDER: readonly PicturesClass[] = ['occasion', 'yearAgo', 'heart', 'busy', 'video'];

export interface RankContext {
  readonly bookId: string;
  /** The phone's local date, `YYYY-MM-DD`. */
  readonly localDate: string;
  /** The newest days the rotation draws from. Defaults to `MOMENTS_RULES.rotateK` (PROPOSED, CPO-25). */
  readonly rotateK?: number;
  /** Day keys under "Not this one" or "Hide this day". */
  readonly excludeDayKeys?: readonly string[];
}

export interface PicturesPick {
  readonly dayKey: string;
  readonly class: PicturesClass;
}

export { fixedHash } from './hash';

export function selectPicturesDay(days: readonly RankDay[], ctx: RankContext): PicturesPick | null {
  const excluded = new Set(ctx.excludeDayKeys ?? []);
  // One stable key per day: duplicate entries merge their flags (R32).
  const merged = new Map<string, RankDay>();
  for (const d of days) {
    if (excluded.has(d.dayKey)) continue;
    const prev = merged.get(d.dayKey);
    merged.set(d.dayKey, {
      dayKey: d.dayKey,
      occasion: !!prev?.occasion || !!d.occasion,
      yearAgo: !!prev?.yearAgo || !!d.yearAgo,
      heart: !!prev?.heart || !!d.heart,
      busy: !!prev?.busy || !!d.busy,
      video: !!prev?.video || !!d.video,
    });
  }
  const pool = [...merged.values()];
  for (const cls of PICTURES_CLASS_ORDER) {
    // Inside a class: newer first, then lower day key (keys are unique, so newer decides).
    const eligible = pool.filter((d) => d[cls]).sort((a, b) => (a.dayKey < b.dayKey ? 1 : a.dayKey > b.dayKey ? -1 : 0));
    if (eligible.length === 0) continue;
    // A non-finite rotateK reads as the rules value, so a bad input never throws (an empty set has no index).
    const k = Math.max(1, Math.floor(Number.isFinite(ctx.rotateK) ? (ctx.rotateK as number) : MOMENTS_RULES.rotateK));
    const set = eligible.slice(0, k);
    // Contract two phones share: the text is `localDate|bookId` (CPO-25). Do not reorder it.
    const index = fixedHash(`${ctx.localDate}|${ctx.bookId}`) % set.length;
    return { dayKey: set[index].dayKey, class: cls };
  }
  return null;
}
