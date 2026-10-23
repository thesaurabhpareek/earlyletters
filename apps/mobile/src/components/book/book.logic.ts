/**
 * The Book's moments of arrival and leaving (EXPERIENCE_PASS S26, S36; 5.8 rows 5 and 7). Pure and tested
 * (test/book-logic.test.ts). Nothing here reads the store or React Native.
 *
 *   arrival     after a save, P4 sets `arrived=<entry id>` on the Book route (5.8 row 5). The Book finds that card,
 *               positions the list on it before its first frame, washes it once, and clears the param, so Back and
 *               tab taps never replay it.
 *   leaving     a letter deleted from its page (S36). The delete is committed at once (the tombstone, and with sync
 *               on the outbox op); the card stays in its row while the page goes back into it, then collapses out
 *               of its row when the Book is on screen again, and the Book shows "Letter deleted." with Undo.
 *   first seen  the other parent's letter, the first time this phone shows it (option B): the same wash, once.
 */
import type { Entry } from '@/lib/store';

/* ------------------------------------------------------------------ */
/* Arrival (5.8 row 5)                                                 */
/* ------------------------------------------------------------------ */

type Section = { data: readonly { id: string }[] };

/** Where the arrived card is: its chapter and its row, or null when the param names no card in this book. */
export function arrivalOf(param: string | string[] | undefined, sections: readonly Section[]): { id: string; sectionIndex: number; itemIndex: number } | null {
  const id = Array.isArray(param) ? param[0] : param;
  if (!id) return null;
  for (let s = 0; s < sections.length; s++) {
    const i = sections[s].data.findIndex((e) => e.id === id);
    if (i >= 0) return { id, sectionIndex: s, itemIndex: i };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Leaving (S36)                                                       */
/* ------------------------------------------------------------------ */

/** The deleted letter on its way back to the Book, held until the Book is on screen again. */
export function createBookHandoff() {
  let leaving: Entry | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => leaving,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    /** The letter page has deleted this letter (already committed) and is going back to the Book. */
    deleted(entry: Entry) {
      leaving = entry;
      emit();
    },
    /** The Book is on screen again: the deleted letter, once (then the card leaves its row and the toast shows). */
    take(): Entry | null {
      const e = leaving;
      leaving = null;
      if (e) emit();
      return e;
    },
  };
}

/** The app's one handoff from a letter page to the Book. */
export const bookHandoff = createBookHandoff();

/** The part of a navigator's state the letter page reads: its routes, and the tabs' own state under them. */
export type NavState = { index?: number; routes?: readonly { name: string; state?: NavState }[] } | undefined;

/** Whether the screen under the letter page is the Book: the root stack's previous route is the tabs, on `book`. */
export function belowIsBook(state: NavState): boolean {
  const routes = state?.routes ?? [];
  const i = state?.index ?? routes.length - 1;
  const below = routes[i - 1];
  if (!below || below.name !== '(tabs)') return false;
  const tabs = below.state;
  const tab = tabs?.routes?.[tabs.index ?? 0];
  return tab?.name === 'book';
}

const newestFirst = (a: Entry, b: Entry) =>
  a.occurredOn !== b.occurredOn ? (a.occurredOn < b.occurredOn ? 1 : -1) : a.capturedAt !== b.capturedAt ? (a.capturedAt < b.capturedAt ? 1 : -1) : a.id < b.id ? 1 : -1;

/**
 * The Book's entries while a deleted letter's page is still closing: the card stays where it was (the store's order:
 * newest day first, then newest capture, then id), so the page can go back into it before it leaves.
 */
export function withLeaving(entries: readonly Entry[], leaving: Entry | null, childId: string): Entry[] {
  if (!leaving || leaving.childId !== childId || entries.some((e) => e.id === leaving.id)) return [...entries];
  return [...entries, leaving].sort(newestFirst);
}

/* ------------------------------------------------------------------ */
/* First seen (option B)                                               */
/* ------------------------------------------------------------------ */

/** How many seen ids this phone keeps (ids only, never words). */
export const SEEN_MAX = 500;

/**
 * Which of the other parent's letters to wash, and the seen list to keep. The first time the Book looks (no list
 * yet), everything already there is taken as seen, so a new phone or a joined parent does not wash a whole book at
 * once; after that, a letter of theirs this phone has not shown before washes once.
 */
export function firstSeen(entries: readonly Pick<Entry, 'id'>[], isOwn: (e: Pick<Entry, 'id'>) => boolean, seen: readonly string[] | null): { wash: string[]; seen: string[] } {
  const theirs = entries.filter((e) => !isOwn(e)).map((e) => e.id);
  if (seen === null) return { wash: [], seen: theirs.slice(0, SEEN_MAX) };
  const known = new Set(seen);
  const wash = theirs.filter((id) => !known.has(id));
  if (wash.length === 0) return { wash, seen: [...seen] };
  return { wash, seen: [...wash, ...seen].slice(0, SEEN_MAX) };
}

/** Reads the stored seen list; anything unreadable counts as no list yet. */
export function parseSeen(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* The letter page while its words travel (MOTION 5f)                  */
/* ------------------------------------------------------------------ */

type Spring = { stiffness: number; damping: number; mass: number };

/**
 * When a spring from 0 to 1 first comes within `withinPt` of home over a journey of `travelPt` points, in ms (a
 * plain integration at 1 ms steps, the same spring as springConfig). Used for the letter page: the rest of the page
 * (the signature, the player, the actions) waits until the carried words are home, so no line of it ever sits
 * under words still on their way. Never more than `capMs`.
 */
export function springArrivalMs(spring: Spring, travelPt: number, withinPt: number, capMs = 1200): number {
  if (travelPt <= withinPt) return 0;
  const limit = withinPt / travelPt;
  let x = 0;
  let v = 0;
  for (let t = 1; t <= capMs; t++) {
    const a = (-spring.stiffness * (x - 1) - spring.damping * v) / spring.mass;
    v += a / 1000;
    x += v / 1000;
    if (Math.abs(1 - x) <= limit) return t;
  }
  return capMs;
}

/**
 * The page's own timeline for its rest while the card's words are carried in: it shows from `showAtMs` (the measuring
 * frames, the card's hold and the words' arrival) over `fadeMs`. Without a carry (no card, another column, Reduce
 * Motion) the rest is simply part of the page, which CardToPage fades in whole: `showAtMs` 0 and nothing extra.
 */
export function pageRestPlan(o: { carried: boolean; holdMs: number; measureMs: number; spring: Spring; travelPt: number; withinPt: number; fadeMs: number }) {
  if (!o.carried) return { showAtMs: 0, fadeMs: 0 };
  return { showAtMs: o.measureMs + o.holdMs + springArrivalMs(o.spring, o.travelPt, o.withinPt), fadeMs: o.fadeMs };
}

/* ------------------------------------------------------------------ */
/* The Book's header settle (MOTION 5a)                                */
/* ------------------------------------------------------------------ */

let settledThisSession = false;
/** True the first time it is asked in a session (the Book's first view), then false: content never re-enters on a return. */
export function firstBookViewThisSession(): boolean {
  if (settledThisSession) return false;
  settledThisSession = true;
  return true;
}
