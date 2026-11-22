/**
 * `momentsFor`: the four slots of For you in one order (NS-53 6.3, R10, R27). Pure: the same inputs give the same
 * list on every call and on every phone holding the same book. Today comes from `occasions`; the question from
 * `selectPrompt` (an opening, seeded by the local day). A look-back letter (S4, which follows the NS-23 filters) and a
 * pictures candidate (S7 from the ranker, S5 from a letter) arrive already chosen as plain references, so this file
 * never sees a picture, a place or a word. A slot with nothing is absent: no placeholder, no gap, no count.
 */
import { isBeforeBirth, ageOn } from '../age';
import { selectPrompt, type Prompt } from '../prompts';
import { BRIGHT_REASONS, occasionsOn, type MarkedDay, type OccasionHit } from './occasions';
import type { HolidayKey, HolidayRegion } from './holidays';
import { type Slot } from './domain';
import type { RegistryId } from './registry';

/** The four slots in order are the shared `SLOTS` of domain.ts (6.3). */
export type SlotName = Slot;

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
  /** A letter from this day in an earlier year that already passed the NS-23 filters. */
  lookBack?: { ref: string; date: string } | null;
  /** The best pictures candidate the caller has: a library day (S7) or pictures already picked (S5). */
  pictures?: { source: 'S5' | 'S7'; ref: string } | null;
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

export function momentsFor(input: MomentsInput): MomentCard[] {
  const off = new Set<RegistryId>(input.off ?? []);
  const away = new Set<SlotName>(input.notToday ?? []);
  const calm = input.state !== 'normal';
  const cards: MomentCard[] = [];

  const hits = occasionsOn(input.today, input).filter((h) => !off.has(h.source) && !(calm && BRIGHT_REASONS.includes(h.reason)));
  if (hits.length > 0 && !away.has('today')) cards.push({ slot: 'today', hits });

  const back = input.lookBack;
  if (back && !calm && !off.has('S4') && !away.has('lookBack')) cards.push({ slot: 'lookBack', source: 'S4', ref: back.ref, date: back.date });

  const pic = input.pictures;
  if (pic && !off.has(pic.source) && (pic.source === 'S5' || input.libraryReadable === true) && !away.has('pictures')) {
    cards.push({ slot: 'pictures', source: pic.source, ref: pic.ref });
  }

  if (!off.has('S6') && !away.has('question') && input.prompts.length > 0) {
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
