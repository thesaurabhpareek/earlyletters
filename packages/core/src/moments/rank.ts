/**
 * For you, pictures slot: the class order and the seeded rotation
 * (NS-53-R51; MT-P6-R30 to R33, R39; PRD 28 section 7.3).
 *
 * Ranking is never from a score, a heart count, a tap or a dwell. Only
 * explicit teaching counts, and it arrives as `excludeDayKeys`. No random
 * source and no clock: the same library, book and local date give the same
 * day on every open and on two phones.
 */

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
  /** ROTATE_K from `rules.ts`: the newest days the rotation draws from. */
  readonly rotateK: number;
  /** Day keys under "Not this one" or "Hide this day". */
  readonly excludeDayKeys?: readonly string[];
}

export interface PicturesPick {
  readonly dayKey: string;
  readonly class: PicturesClass;
}

/** FNV-1a, 32 bit, over UTF-16 code units. Fixed so two phones agree. */
export function fixedHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

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
    const k = Math.max(1, Math.floor(ctx.rotateK));
    const set = eligible.slice(0, k);
    const index = fixedHash(`${ctx.localDate}|${ctx.bookId}`) % set.length;
    return { dayKey: set[index].dayKey, class: cls };
  }
  return null;
}
