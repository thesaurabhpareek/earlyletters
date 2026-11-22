/**
 * Day collage: which candidates become the tiles of a day card, and how they
 * are laid out (NS-53-R41, R44; MT-P6-R14 to R18; PRD 28 section 7.3).
 *
 * Pure and deterministic. The only inputs are capture time, session, the
 * parent's heart, the parent's earlier attach, and media kind. No pixel, no
 * place, no person, no score, no clock, no random source. A burst or a
 * near-duplicate group arrives already collapsed to ONE candidate whose time
 * range is its first to last frame (PR 2); this module never sees frames.
 *
 * PR 2 owns `Candidate` (`columns.ts`); `toTileCandidate` is the one place that maps a grouped candidate
 * onto a tile (id is its first frame, kind comes from `video`).
 *
 * ASSUMED lines below are choices no spec line states; each is ruled in docs/agents/exec/RULINGS.md
 * (Batch 3) and may change at the G4 card sort or the PR 3b harness. `tiles` and `rotateK` are PROPOSED
 * rules fields (CPO-25).
 */
import type { Candidate } from './columns';
import type { MediaKind } from './domain';
import { MOMENTS_RULES } from './rules';

export interface TileCandidate {
  /** Opaque local identifier. Memory only; never stored (R247). */
  readonly id: string;
  /** First frame, UTC ms. */
  readonly startMs: number;
  /** Last frame, UTC ms (equal to `startMs` for a single picture). */
  readonly endMs: number;
  readonly kind: MediaKind;
  /** Session index inside the day (sessions split at SESSION_GAP, PR 2). */
  readonly session: number;
  /** The parent's own heart (`isFavorite`); the name PR 2's `Candidate` uses. */
  readonly favourite: boolean;
  /** The parent already attached it to a letter for this day. */
  readonly attached: boolean;
  /** Panoramas are never tiles. */
  readonly panorama?: boolean;
}

export type CollageLayout = 'none' | 'single-4x3' | 'two-squares' | 'tall-plus-two' | 'two-by-two';

export interface Collage {
  readonly layout: CollageLayout;
  /** Lead tile first, the others in time order. */
  readonly tiles: readonly string[];
  /** The same order continued, for an iCloud-only tile to take the next one (MT-P6-R17). */
  readonly fallbacks: readonly string[];
}

export interface CollageOptions {
  /** Defaults to `MOMENTS_RULES.tiles` (PROPOSED 4, CPO-25), so there is one definition (CODE-R13). */
  readonly tiles?: number;
}

/** One grouped candidate onto a tile: id is its first frame, kind comes from `video`. */
export function toTileCandidate(c: Pick<Candidate, 'ids' | 'startMs' | 'endMs' | 'video' | 'favourite'>, session: number, attached: boolean): TileCandidate {
  return {
    id: c.ids[0],
    startMs: c.startMs,
    endMs: c.endMs,
    kind: c.video ? 'video' : 'image',
    session,
    favourite: c.favourite,
    attached,
  };
}

/** 1 picture 4:3; 2 two squares; 3 one tall plus two; 4 or more a fixed 2 by 2. */
export function collageLayout(count: number): CollageLayout {
  if (count <= 0) return 'none';
  if (count === 1) return 'single-4x3';
  if (count === 2) return 'two-squares';
  if (count === 3) return 'tall-plus-two';
  return 'two-by-two';
}

const mid = (c: TileCandidate): number => (c.startMs + c.endMs) / 2;

/** Earlier time, then lower identifier (the tie rule of R15). */
function byTimeThenId(a: TileCandidate, b: TileCandidate): number {
  const d = mid(a) - mid(b);
  if (d !== 0) return d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Nearest to `target`; ties to the earlier time, then the lower identifier. */
function nearest(pool: readonly TileCandidate[], target: number): TileCandidate | undefined {
  let best: TileCandidate | undefined;
  let bestD = Infinity;
  for (const c of pool) {
    const d = Math.abs(mid(c) - target);
    if (d < bestD || (d === bestD && best !== undefined && byTimeThenId(c, best) < 0)) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

function middleOf(group: readonly TileCandidate[]): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of group) {
    lo = Math.min(lo, c.startMs);
    hi = Math.max(hi, c.endMs);
  }
  return (lo + hi) / 2;
}

/** The full precedence order of every usable candidate (tiles are its head). */
function precedence(input: readonly TileCandidate[]): TileCandidate[] {
  const all = input.filter((c) => !c.panorama).sort(byTimeThenId);
  const order: TileCandidate[] = [];
  const taken = new Set<string>();
  let hasVideo = false;
  const take = (c: TileCandidate | undefined): boolean => {
    if (!c || taken.has(c.id)) return false;
    // ASSUMED (CPO-20): never two videos on a card, fallbacks included; if only videos remain the card has fewer tiles.
    if (c.kind === 'video' && hasVideo) return false;
    taken.add(c.id);
    if (c.kind === 'video') hasVideo = true;
    order.push(c);
    return true;
  };
  const remaining = (): TileCandidate[] =>
    all.filter((c) => !taken.has(c.id) && !(c.kind === 'video' && hasVideo));

  // (1) attached to a letter, (2) hearted, both by capture time. ASSUMED (CPO-22): attached leads over
  // hearted (the order of 7.3); R281(c) reads as "among pictures not already attached".
  for (const c of all) if (c.attached) take(c);
  for (const c of all) if (c.favourite) take(c);

  // (3) the rest by the spread. Tile 1 (when nothing is chosen yet) is the
  // candidate nearest the middle of the day's middle session.
  if (order.length === 0 && all.length > 0) {
    const sessions = groupBySession(all);
    // ASSUMED (CPO-19): an even number of sessions has two middle ones; take the earlier. A pure function of the input.
    const middle = sessions[Math.floor((sessions.length - 1) / 2)];
    take(nearest(middle, middleOf(middle)));
  }

  // One from each session that has no tile yet, in time order.
  for (const session of groupBySession(all)) {
    if (session.some((c) => taken.has(c.id))) continue;
    take(nearest(session.filter((c) => !(c.kind === 'video' && hasVideo)), middleOf(session)));
  }

  // Then the candidate at the middle of the longest remaining gap, repeating. ASSUMED (CPO-21): the edges
  // of the first and last gap are the day's earliest candidate start and latest candidate end (never
  // midnight), so a one-session day still gets a spread tile. Ties: longer gap, earlier time, lower id.
  const dayStart = all.length ? Math.min(...all.map((c) => c.startMs)) : 0;
  const dayEnd = all.length ? Math.max(...all.map((c) => c.endMs)) : 0;
  for (;;) {
    const pool = remaining();
    if (pool.length === 0) break;
    const points = order.map(mid).sort((a, b) => a - b);
    const bounds = [dayStart, ...points, dayEnd];
    const gaps = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      gaps.push({ lo: bounds[i], hi: bounds[i + 1], loEdge: i === 0, hiEdge: i === bounds.length - 2 });
    }
    gaps.sort((a, b) => b.hi - b.lo - (a.hi - a.lo) || a.lo - b.lo);
    let picked = false;
    for (const g of gaps) {
      const inside = pool.filter((c) => {
        const t = mid(c);
        return (g.loEdge ? t >= g.lo : t > g.lo) && (g.hiEdge ? t <= g.hi : t < g.hi);
      });
      const c = nearest(inside, (g.lo + g.hi) / 2);
      if (c) {
        take(c);
        picked = true;
        break;
      }
    }
    if (!picked) {
      for (const c of pool) take(c); // same-time leftovers: time, then id
      break;
    }
  }
  return order;
}

/** Sessions in time order; each holds its candidates in time order. */
function groupBySession(all: readonly TileCandidate[]): TileCandidate[][] {
  const map = new Map<number, TileCandidate[]>();
  for (const c of all) {
    const list = map.get(c.session);
    if (list) list.push(c);
    else map.set(c.session, [c]);
  }
  return [...map.values()].sort((a, b) => byTimeThenId(a[0], b[0]));
}

export function chooseTiles(candidates: readonly TileCandidate[], opts: CollageOptions = {}): Collage {
  // A missing or non-finite count reads as the rules value, so a bad input never silently empties the card.
  const want = Number.isFinite(opts.tiles) ? (opts.tiles as number) : MOMENTS_RULES.tiles;
  const n = Math.max(0, Math.floor(want));
  const order = precedence(candidates);
  const head = order.slice(0, n);
  const tiles = head.length ? [head[0].id, ...head.slice(1).sort(byTimeThenId).map((c) => c.id)] : [];
  return {
    layout: collageLayout(tiles.length),
    tiles,
    fallbacks: order.slice(n).map((c) => c.id),
  };
}
