/**
 * `buildMoments` (NS-53 row 3c, CPO-28): the whole plan for For you from plain inputs. Pure, total and deterministic:
 * no clock, no random source, no platform, no storage, no log. It holds ids, day keys and closed reasons only: no
 * child name, no entry text, no coordinate, no machine-written line.
 *
 * Order of work (CDO-22): the exclude list FIRST, then everything else. A candidate whose day cannot be worked out
 * is dropped (fail closed). `momentsFor` then checks any dated candidate again, so a missed call here cannot show a
 * hidden day. Today hits are checked here too, because `momentsFor` does not carry a date for them.
 */
import { isBeforeBirth, parseIsoDate } from '../age';
import { SLOTS, type Slot } from './domain';
import { groupByDay, type OffsetAt } from './group';
import { occasionsOn, reasonFor, type OccasionReason } from './occasions';
import { placeForCell, placeLine, windowPlaces, dayPlace, type PlaceId, type PlaceIndex } from './place';
import { qualifyDay } from './qualify';
import { selectPicturesDay, type PicturesClass, type RankDay } from './rank';
import type { Reason } from './reasons';
import { MOMENTS_RULES, type MomentsRules } from './rules';
import { momentsFor, type MomentCard, type MomentsInput } from './slots';
import type { LibraryWindow } from './types';

/** One planned card: the slot's card, the ONE reason it shows (R42), the local day it sits on and the place id if any. */
export interface PlannedCard {
  readonly slot: Slot;
  readonly card: MomentCard;
  readonly reason: Reason;
  /** Null for the question, which belongs to no day. */
  readonly dayKey: string | null;
  /** An id from the injected table, or null. Never a name or a coordinate (R229). */
  readonly placeId: PlaceId | null;
}

export interface BuildLibrary {
  readonly window: LibraryWindow;
  readonly offsetAt: OffsetAt;
  /** The book the rotation is seeded with (`localDate|bookId`, CPO-25). */
  readonly bookId: string;
  readonly rules?: MomentsRules;
  /** An opened table (`openPlaceTable`), or null for date-only cards. */
  readonly places?: PlaceIndex | null;
  readonly hiddenPlaces?: readonly PlaceId[];
  readonly homeCorrection?: PlaceId | null;
  /** Kill switch K5. Default true. */
  readonly machineLabels?: boolean;
}

export interface BuildInput extends Omit<MomentsInput, 'pictures'> {
  /** A pictures candidate already chosen elsewhere. `source` is checked at run time (CDO-22). Wins over `library`. */
  pictures?: { readonly source: string; readonly ref: string; readonly day: string } | null;
  /** The library window for S7. Used only when `libraryReadable` and no phone in a hard stretch or quiet book (CPO-27). */
  library?: BuildLibrary | null;
  /** Any visible book on this phone is in a hard stretch or quiet (CPO-27, R253): no library picture card. */
  phoneCalm?: boolean;
}

const validDay = (d: unknown): d is string => {
  try {
    parseIsoDate(d as string);
    return true;
  } catch {
    return false;
  }
};

const CLASS_REASON: Record<PicturesClass, Reason> = { occasion: 'RSN-MARKED', yearAgo: 'RSN-YEAR', heart: 'RSN-HEART', busy: 'RSN-DAY', video: 'RSN-VIDEO' };

interface Pick {
  readonly ref: string;
  readonly day: string;
  readonly reason: Reason;
  readonly placeId: PlaceId | null;
}

/** The S7 day: qualifying days not on the exclude list, ranked and rotated by `selectPicturesDay`. */
function libraryPick(input: BuildInput, lib: BuildLibrary, excluded: ReadonlySet<string>): Pick | null {
  const rules = lib.rules ?? MOMENTS_RULES;
  const table = lib.places ?? null;
  const days = groupByDay(lib.window, lib.offsetAt, rules);
  const cell = new Map<string, string | null>();
  lib.window.ids.forEach((id, i) => cell.set(id, lib.window.placeCell[i] ?? null));
  const placeOf = (ids: readonly string[]) => placeForCell(table, cell.get(ids[0]) ?? null);
  const places = new Map(days.map((d) => [d.dayKey, dayPlace(d.candidates.map((c) => placeOf(c.ids)), rules)]));
  const win = windowPlaces(days.flatMap((d) => d.candidates.map((c) => placeOf(c.ids))));
  const t = parseIsoDate(input.today);
  const ranked: RankDay[] = [];
  for (const d of days) {
    if (excluded.has(d.dayKey)) continue;
    const hits = occasionsOn(d.dayKey, input);
    const by = qualifyDay(d, rules, { occasion: hits.length > 0 });
    if (by.length === 0) continue;
    const p = parseIsoDate(d.dayKey);
    const yearAgo = p.y < t.y && p.m === t.m && p.d === t.d && !isBeforeBirth(input.birth, d.dayKey);
    ranked.push({
      dayKey: d.dayKey,
      occasion: hits.length > 0,
      yearAgo,
      heart: by.includes('heart'),
      busy: by.some((b) => b !== 'heart' && b !== 'video' && b !== 'occasion'),
      video: by.includes('video'),
    });
  }
  const pick = selectPicturesDay(ranked, { bookId: lib.bookId, localDate: input.today, excludeDayKeys: [...excluded] });
  if (!pick) return null;
  const placeId = places.get(pick.dayKey) ?? null;
  const line = placeLine({
    table,
    placeId,
    window: win,
    homeCorrection: lib.homeCorrection ?? null,
    hidden: new Set(lib.hiddenPlaces ?? []),
    rules,
    isBirthDay: occasionsOn(pick.dayKey, input).some((h) => h.reason === 'RSN-BIRTHDAY'),
    machineLabels: lib.machineLabels !== false,
  });
  let reason = CLASS_REASON[pick.class];
  if (pick.class === 'occasion') reason = reasonFor(occasionsOn(pick.dayKey, input).map((h) => h.reason)) ?? 'RSN-DAY';
  else if (line && pick.class !== 'yearAgo') reason = 'RSN-PLACE';
  return { ref: pick.dayKey, day: pick.dayKey, reason, placeId: line ? line.id : null };
}

export function buildMoments(input: BuildInput): PlannedCard[] {
  // 1. The exclude list, before anything else (CDO-22).
  const excluded = new Set((input.excludedDays ?? []).filter((d): d is string => typeof d === 'string'));
  if (!validDay(input.today)) return [];
  const today = input.today;
  const shows = (d: unknown): d is string => validDay(d) && !excluded.has(d);

  // 2. Fail closed on every dated candidate; a bad mark or birth never throws.
  const marked = (input.marked ?? []).filter((m) => m && validDay(m.date) && typeof m.ref === 'string');
  const birth = validDay(input.birth) ? input.birth : null;
  const back = input.lookBack && typeof input.lookBack.ref === 'string' && shows(input.lookBack.date) ? input.lookBack : null;
  const given = input.pictures;
  let pic: Pick | null = null;
  let source: 'S5' | 'S7' | null = null;
  if (given && (given.source === 'S5' || given.source === 'S7') && typeof given.ref === 'string' && shows(given.day)) {
    source = given.source;
    pic = { ref: given.ref, day: given.day, reason: source === 'S5' ? 'RSN-PICKED' : 'RSN-DAY', placeId: null };
  }
  const calm = input.state !== 'normal';
  const libraryOk = input.libraryReadable === true && !calm && input.phoneCalm !== true;
  if (!pic && input.library && libraryOk) {
    pic = libraryPick({ ...input, birth, marked }, input.library, excluded);
    source = pic ? 'S7' : null;
  }

  // 3. momentsFor takes the filtered candidates and checks each date again.
  const cards = momentsFor({
    ...input,
    birth,
    marked,
    lookBack: back,
    pictures: pic && source ? { source, ref: pic.ref, day: pic.day } : null,
    libraryReadable: libraryOk,
    excludedDays: [...excluded],
  });

  const out: PlannedCard[] = [];
  for (const card of cards) {
    if (card.slot === 'today') {
      // A hidden or excluded today shows no Today card, whatever the hits (Review A of #1447).
      const reason = excluded.has(today) ? null : reasonFor(card.hits.map((h) => h.reason as OccasionReason));
      if (reason) out.push({ slot: 'today', card, reason, dayKey: today, placeId: null });
    } else if (card.slot === 'lookBack') out.push({ slot: 'lookBack', card, reason: 'RSN-LETTER', dayKey: card.date, placeId: null });
    else if (card.slot === 'pictures' && pic) out.push({ slot: 'pictures', card, reason: pic.reason, dayKey: pic.day, placeId: pic.placeId });
    else if (card.slot === 'question') out.push({ slot: 'question', card, reason: 'RSN-QUESTION', dayKey: null, placeId: null });
  }
  return out;
}

/** Does the plan hold a card on this local day? A closed yes or no, never a count (R42). */
export function signalForDay(plan: readonly PlannedCard[], dayKey: string): { has: boolean } {
  return { has: plan.some((c) => c.dayKey !== null && c.dayKey === dayKey) };
}

/** The analytics slot names (R251 `look_back`). One place, one both-ways test (E-4-3). */
export const SLOT_EVENT_NAMES = { today: 'today', lookBack: 'look_back', pictures: 'pictures', question: 'question' } as const satisfies Record<Slot, string>;
export type SlotEventName = (typeof SLOT_EVENT_NAMES)[Slot];
export const slotToEventName = (s: Slot): SlotEventName => SLOT_EVENT_NAMES[s];
export const eventNameToSlot = (n: string): Slot | null => SLOTS.find((s) => SLOT_EVENT_NAMES[s] === n) ?? null;
