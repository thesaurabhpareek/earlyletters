/**
 * The day a letter is about (NS-15, rescoped 20 Nov). The about-day is the letter's `occurred_on` with its
 * `occurred_precision`, already stored, synced in its own field group and exported; the said-on day is `captured_at`,
 * which never changes. Review files a draft by its about-day, and the letter page tells the two apart. Pure; tested in
 * test/ns15-letter-another-day.test.ts.
 *
 * The date rule that protects the constitution (NS-15-R4, NS-15-R18): the about-day moves only by the parent's pick in
 * DateSheet. Nothing here takes a letter's words or a picture, so "last Thursday" in a letter, or a photo's file date,
 * can never move it. Keep it that way: a parameter that carries words or a picture here would break the rule.
 */
import { monthFor } from '@/components/book/chapters';
import type { Child, Draft, Entry, OccurredPrecision } from '@/lib/store';

export type AboutDay = { occurredOn: string; occurredPrecision: OccurredPrecision };

/**
 * Review's about-day: the parent's pick stored on the draft (setDraftOccurred), else the local day it was said
 * (`saidOn`, the caller's local calendar day of `createdAt`). The same rule as the store's withDraftChoices, so what
 * Review shows is what Keep files.
 */
export function reviewAboutDay(draft: Pick<Draft, 'occurredOn' | 'occurredPrecision'>, saidOn: string): AboutDay {
  return draft.occurredOn
    ? { occurredOn: draft.occurredOn, occurredPrecision: draft.occurredPrecision ?? 'day' }
    : { occurredOn: saidOn, occurredPrecision: 'day' };
}

/**
 * Whether the letter page shows both days (NS-15-R3): the about-day names another day than the one it was said
 * (`saidOn`, the local calendar day of `capturedAt`), or, for a letter dated to a month, another month of the child's
 * age. A letter said on the day it is about shows one day.
 */
export function showsBothDays(child: Pick<Child, 'birthday'>, e: Pick<Entry, 'occurredOn' | 'occurredPrecision'>, saidOn: string): boolean {
  if (e.occurredPrecision === 'month') return monthFor(child, e.occurredOn) !== monthFor(child, saidOn);
  return e.occurredOn !== saidOn;
}
