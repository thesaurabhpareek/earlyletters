/**
 * The first-run child step, pure (NX-31-R3): the name may stay empty, the date is required. onboarding.tsx draws it,
 * test/first-run-child-name.test.ts runs it in Node.
 *
 * - One row, empty name: the book is made with an empty stored name. The words "your child" (onboarding.childFallback)
 *   are shown in its place and are never stored.
 * - Twins or more: each row needs its own name, so the books can be told apart (needNameMany).
 * - Later books (add-child-form.logic.ts) keep their rule: NX-31-R28 says first run only until the founder says more.
 */
import { CHILD_NAME_MAX, checkBirthday, checkDueDate, checkFirstRunChildName } from '@scribe/core';
import { copy, fill } from '@/lib/copy';

export type FirstRunChildInput = { names: string[]; expecting: boolean; birthday: string | null; dueDate: string | null; today: string };

/** Why Continue is waiting, in words; null when the books can be made. */
export function firstRunChildBlock({ names, expecting, birthday, dueDate, today }: FirstRunChildInput): string | null {
  const o = copy.onboarding;
  const checked = names.map((n) => checkFirstRunChildName(n));
  if (checked.some((c) => !c.ok)) return fill(copy.childrenExtra.edit.nameLimit, { n: CHILD_NAME_MAX });
  if (names.length > 1 && checked.some((c) => c.ok && !c.value)) return o.child.needNameMany;
  if (expecting) {
    if (!dueDate) return o.child.needDueDate;
    return checkDueDate(dueDate, today).ok ? null : copy.childrenExtra.edit.dueDateRange;
  }
  const typed = checked.filter((c) => c.ok && c.value).length;
  if (!birthday) return fill(o.child.needBirthday, { child: typed ? checked.flatMap((c) => (c.ok ? [c.value] : [])).join(', ') : o.childFallback });
  return checkBirthday(birthday, today).ok ? null : copy.childrenExtra.edit.birthdayFuture;
}

/** The names to make books for: as checked, an empty one kept empty. Nothing to make while a row is over the limit. */
export function firstRunBookNames(names: string[]): string[] {
  const out: string[] = [];
  for (const n of names) {
    const c = checkFirstRunChildName(n);
    if (!c.ok) return [];
    out.push(c.value);
  }
  return out;
}
