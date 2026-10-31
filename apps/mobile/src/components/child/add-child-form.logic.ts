/**
 * Add a child (EXPERIENCE_PASS_2026-10 S47, package P6): the same rules as the first-run child step (S05), pure so
 * test/children-settings.test.ts runs them in Node. add-child-form.tsx draws them.
 *
 * - No date is ever chosen for the person: the birthday and the due date start empty, so a seven-month-old is never
 *   saved as a newborn by a default nobody saw ("Born today" is a chip, one tap).
 * - The primary waits, with its reason in words above it, until the name and the date are right (packages/core
 *   checkChildName, checkBirthday, checkDueDate). The reason names the child only once a name is typed, so no
 *   placeholder ever sits inside a sentence.
 * - The primary reads "Add Asha's book", or "Add this book" before a name is typed or when the filled label passes
 *   22 characters (the button budget of packages/content/test/rules.test.ts).
 * Free, with no Plus gate (D-082, D-083): the free letters are one pool across every book.
 */
import { checkBirthday, checkChildName, checkDueDate } from '@scribe/core';
import { copy, fill } from '@/lib/copy';

/** Button labels are 22 characters or fewer (packages/content rules); counted as the rules test counts them. */
export const ADD_BUTTON_MAX = 22;

export type AddChildInput = { name: string; expecting: boolean; birthday: string | null; dueDate: string | null; today: string };

/** Why the primary is waiting, in words; null when the book can be added. */
export function addChildBlock({ name, expecting, birthday, dueDate, today }: AddChildInput): string | null {
  const o = copy.onboarding.child;
  const named = checkChildName(name);
  if (!named.ok) return copy.childrenExtra.nameRequired;
  if (expecting) {
    if (!dueDate) return o.needDueDate;
    return checkDueDate(dueDate, today).ok ? null : copy.childrenExtra.edit.dueDateRange;
  }
  if (!birthday) return fill(o.needBirthday, { child: named.value });
  return checkBirthday(birthday, today).ok ? null : copy.childrenExtra.edit.birthdayFuture;
}

/** "Add Asha's book", or "Add this book" before a name or when the filled label would pass the button budget. */
export function addChildCta(name: string): string {
  const a = copy.children.add;
  const named = checkChildName(name);
  if (!named.ok) return a.ctaShort;
  const full = fill(a.cta, { child: named.value });
  return full.length <= ADD_BUTTON_MAX ? full : a.ctaShort;
}

/** The child to add, once nothing blocks it: the name as checked, and only the date for the chosen state. */
export function addChildValues(input: AddChildInput): { name: string; birthday: string | null; dueDate: string | null } | null {
  if (addChildBlock(input) !== null) return null;
  const named = checkChildName(input.name);
  if (!named.ok) return null;
  return { name: named.value, birthday: input.expecting ? null : input.birthday, dueDate: input.expecting ? input.dueDate : null };
}
