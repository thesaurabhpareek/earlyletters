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
import { ageOn, isBeforeBirth, type SelectInput } from '@scribe/core';
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
    seed: `${a.today}:${a.shuffle}`,
    excludeKeys: a.leftKey ? [a.leftKey] : [],
  };
}
