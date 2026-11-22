/**
 * `momentsFor`: the four slots of For you in one order (NS-53 6.3, R10, R27). Pure: the same inputs give the same
 * list on every call and on every phone holding the same book. Today comes from `occasions`; the question from
 * `selectPrompt` (an opening, seeded by the local day). A look-back letter (S4, which follows the NS-23 filters) and a
 * pictures candidate (S7 from the ranker, S5 from a letter) arrive already chosen as plain references, so this file
 * never sees a picture, a place or a word. A slot with nothing is absent: no placeholder, no gap, no count.
 */
import { ageOn, isBeforeBirth, parseIsoDate } from '../age';
import { selectPrompt, type Prompt } from '../prompts';
import { BRIGHT_REASONS, occasionsOn, type MarkedDay, type OccasionHit } from './occasions';
import type { HolidayKey, HolidayRegion } from './holidays';
import { type Slot } from './domain';
import type { RegistryId } from './registry';

export type SlotName = Slot; // the four slots in order are `SLOTS` of domain.ts (6.3)

export type MomentCard =
  | { slot: 'today'; hits: OccasionHit[] }
  | { slot: 'lookBack'; source: 'S4'; ref: string; date: string }
  | { slot: 'pictures'; source: 'S5' | 'S7'; ref: string }
  | { slot: 'question'; promptKey: string };

export interface MomentsInput {
  /** The local calendar day, YYYY-MM-DD. */
  today: string;
  birth: string | null;
  marked: readonly MarkedDay[];
  holidayRegion: HolidayRegion | null;
  holidaysOff?: readonly HolidayKey[];
  /** 'hard': a hard stretch on this phone. 'quiet': a quiet book. Both: no look back, no bright Today hit (R24). */
  state: 'normal' | 'hard' | 'quiet';
  /** A letter from this day in an earlier year that already passed the NS-23 filters. Its date is checked again here. */
  lookBack?: { ref: string; date: string } | null;
  /** The best pictures candidate the caller has: a library day (S7) or pictures already picked (S5). */
  pictures?: { source: 'S5' | 'S7'; ref: string; day: string } | null;
  /** Local day keys the parent sent away (Not this one, Hide this day). A candidate on one never shows (CDO-22). */
  excludedDays?: readonly string[];
  /** Library read allowed right now (Limited counts). Default false, so a library day never shows by accident. */
  libraryReadable?: boolean;
  /** Sources the parent switched off in Me. */
  off?: readonly RegistryId[];
  /** Slots the parent sent away with Not today; they stay away until the next local day. */
  notToday?: readonly SlotName[];
  /** The prompt key Home shows today; the question never repeats it while another exists. */
  homeKey?: string;
  childNameBlank?: boolean;
  /** The 111 prompts, from packages/content. */
  prompts: readonly Prompt[];
}

/** Fail closed (CDO-22): a day that cannot be worked out is not a day. */
function validDay(day: unknown): day is string {
  try {
    parseIsoDate(day as string); // throws on anything that is not a real calendar day, a non-string included
    return true;
  } catch {
    return false;
  }
}

export function momentsFor(input: MomentsInput): MomentCard[] {
  const off = new Set<RegistryId>(input.off ?? []);
  const away = new Set<SlotName>(input.notToday ?? []);
  const calm = input.state !== 'normal';
  const excluded = new Set(input.excludedDays ?? []);
  const shows = (day: unknown) => validDay(day) && !excluded.has(day);
  const cards: MomentCard[] = [];

  const hits = occasionsOn(input.today, input).filter((h) => !off.has(h.source) && !(calm && BRIGHT_REASONS.includes(h.reason)));
  if (hits.length > 0 && !away.has('today')) cards.push({ slot: 'today', hits });

  const back = input.lookBack;
  if (back && shows(back.date) && !calm && !off.has('S4') && !away.has('lookBack')) cards.push({ slot: 'lookBack', source: 'S4', ref: back.ref, date: back.date });

  const pic = input.pictures;
  // CPO-27: library-derived pictures (S7) never show in a hard stretch or a quiet book; pictures the parent picked (S5) do.
  const libraryOk = input.libraryReadable === true && !calm;
  if (pic && shows(pic.day) && !off.has(pic.source) && (pic.source === 'S5' || (pic.source === 'S7' && libraryOk)) && !away.has('pictures')) {
    cards.push({ slot: 'pictures', source: pic.source, ref: pic.ref });
  }

  if (!off.has('S6') && !away.has('question') && input.prompts.some((p) => !p.retired && p.kind !== 'together')) {
    const before = isBeforeBirth(input.birth, input.today);
    const prompt = selectPrompt(
      {
        ageMonths: before || !input.birth ? 0 : ageOn(input.birth, input.today).months,
        beforeBirth: before,
        daysSinceLastEntry: null,
        hardStretch: input.state === 'hard',
        role: 'parent',
        together: false,
        recentKeys: [],
        seed: input.today,
        excludeKeys: input.homeKey ? [input.homeKey] : [],
        childNameBlank: input.childNameBlank === true,
      },
      input.prompts,
    );
    cards.push({ slot: 'question', promptKey: prompt.key });
  }
  return cards;
}
