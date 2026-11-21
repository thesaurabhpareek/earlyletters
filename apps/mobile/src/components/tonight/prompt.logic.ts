/**
 * Tonight's question, as pure parts (EXPERIENCE_PASS_2026-10 S09; P3 critics' pass S2 and S4). No React Native import,
 * so they are unit tested in test/draft-card.test.ts. The screen only calls these and renders what they return.
 *
 * Where a book stands comes from one rule, `isBeforeBirth` in @scribe/core, which is also the Book's (`monthFor` in
 * components/book/chapters, pinned equal in test/draft-card.test.ts): a child with no birthday, or one after today, is
 * not born yet, and the Book files that child's letters in Before You. Tonight uses the same rule, so the Book,
 * Review's header ("To Asha", the dot, "Before You"), the dateline and the prompts always agree.
 *
 * Before the birth the dateline reads "Asha", the dot, "Before You" (never a count of weeks, never a gap) and the prompt comes
 * from the set written for it (`before` band, @scribe/core selectPrompt), not from the newborn prompts about hands
 * and the first day home.
 *
 * "Another thought" passes the prompt that was on screen as an exclusion, so a press never shows the same one again.
 */
import { ageOn, isBeforeBirth, selectPrompt, type Prompt, type SelectInput } from '@scribe/core';
import { copy } from '@/lib/copy';
import { ageText } from '@/lib/dates';

export type TonightStage = {
  /** Not born yet: no birthday, or a birthday after today. */
  beforeBirth: boolean;
  /** Whole months of age; 0 before the birth, where it is not read. */
  ageMonths: number;
};

export function tonightStage(birthday: string | null, today: string): TonightStage {
  if (!birthday || isBeforeBirth(birthday, today)) return { beforeBirth: true, ageMonths: 0 };
  return { beforeBirth: false, ageMonths: ageOn(birthday, today).months };
}

/** What the dateline puts after the name: "7 months", or "Before You" for a book whose child is not born yet. */
export function tonightStageLabel(birthday: string | null, today: string): string {
  // ageText is null exactly when the child is not born yet (no birthday, or one after today): isBeforeBirth's rule.
  return ageText({ birthday }, today) ?? copy.book.beforeYouChapter;
}

/**
 * The selection input for Tonight's prompt. `leftKey` is the prompt "Another thought" was pressed on, or null before
 * any press; the seed changes with every press (`shuffle`) and the left prompt is excluded, so a press always shows
 * a different one.
 */
export function tonightPromptInput(a: {
  birthday: string | null;
  today: string;
  daysSinceLastEntry: number | null;
  recentKeys: string[];
  shuffle: number;
  leftKey: string | null;
  /** Every prompt already shown in this sheet (Write), also left out; Tonight passes none. */
  shownKeys?: readonly string[];
  /** Keeps Write's draws apart from Tonight's for the same day and press count. */
  seedTag?: string;
  /** The child's name as stored; blank (NX-31-R3) leaves out the prompts that ask about the name. Absent: a name is known. */
  childName?: string;
}): SelectInput {
  const stage = tonightStage(a.birthday, a.today);
  return {
    ageMonths: stage.ageMonths,
    beforeBirth: stage.beforeBirth,
    daysSinceLastEntry: a.daysSinceLastEntry,
    hardStretch: false,
    role: 'parent',
    together: false,
    recentKeys: a.recentKeys,
    seed: a.seedTag ? `${a.today}:${a.seedTag}:${a.shuffle}` : `${a.today}:${a.shuffle}`,
    excludeKeys: [...new Set([...(a.leftKey ? [a.leftKey] : []), ...(a.shownKeys ?? [])])],
    ...(a.childName !== undefined && !a.childName.trim() ? { childNameBlank: true } : {}),
  };
}

/**
 * "Another thought" on Write (engagement.md section 3, Option A; BL-E1). The same input and the same selectPrompt as
 * Tonight, so the two never disagree about what fits this child; every line comes from the hand-written library.
 *
 * Every prompt already shown in this sheet is left out of the next draw, so nothing comes back until the pool is
 * used up. When every one that fits has been shown, it quietly starts over (nothing ever says "no more"), still never
 * showing the prompt that is on screen. No counter and no limit. `shown` is the keys in the order they were shown,
 * the one on screen last; the result's `shown` is the list to keep for the next press.
 */
export function anotherThought(
  a: { birthday: string | null; today: string; daysSinceLastEntry: number | null; recentKeys: string[]; shown: readonly string[]; press: number; childName?: string },
  library: readonly Prompt[],
): { prompt: Prompt; shown: string[] } {
  const onScreen = a.shown.length ? a.shown[a.shown.length - 1] : null;
  const base = { birthday: a.birthday, today: a.today, daysSinceLastEntry: a.daysSinceLastEntry, recentKeys: a.recentKeys, shuffle: a.press, leftKey: onScreen, seedTag: 'write', childName: a.childName };
  const next = selectPrompt(tonightPromptInput({ ...base, shownKeys: a.shown }), library);
  if (!a.shown.includes(next.key)) return { prompt: next, shown: [...a.shown, next.key] };
  // Every prompt that fits has been shown: start over, leaving out only the one on screen.
  const again = selectPrompt(tonightPromptInput(base), library);
  return { prompt: again, shown: onScreen && onScreen !== again.key ? [onScreen, again.key] : [again.key] };
}

/**
 * Whether Write offers "Another thought" (engagement.md section 3, "Steps aside"): only for a new letter that opened
 * with a prompt, and only while the page is empty. A letter already under way (a draft, or a recording's words being
 * typed from Review) keeps the question it was started with. Hidden, not moved: the screen keeps its space.
 */
export function anotherThoughtShown(a: { hasPrompt: boolean; continuingDraft: boolean; empty: boolean }): boolean {
  return a.hasPrompt && !a.continuingDraft && a.empty;
}
