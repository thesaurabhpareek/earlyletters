/**
 * The first-run child step, pure (NX-31-R3): the name may stay empty, the date is required. onboarding.tsx draws it,
 * test/first-run-child-name.test.ts runs it in Node.
 *
 * - One row, empty name: the book is made with an empty stored name. The words "your child" (onboarding.childFallback)
 *   are shown in its place and are never stored.
 * - Twins or more: each row needs its own name, so the books can be told apart (needNameMany).
 * - Later books (add-child-form.logic.ts) keep their rule: NX-31-R28 says first run only until the founder says more.
 */
import { CHILD_NAME_MAX, SIGNS_AS_MAX, checkBirthday, checkDueDate, checkFirstRunChildName, checkSignsAs } from '@scribe/core';
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
  // NS-43-R3: a day that is not real, or before 1900-01-01, gets its own line; only a day after today is "the future".
  const born = checkBirthday(birthday, today);
  if (born.ok) return null;
  return born.reason === 'invalid' ? copy.childrenExtra.edit.dateInvalid : copy.childrenExtra.edit.birthdayFuture;
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

/** Why Continue is waiting on the signs-as step, in words; null when the signature can sign the first letter. */
export function firstRunSignsAsBlock({ signsAs, child, many }: { signsAs: string; child: string; many: boolean }): string | null {
  const o = copy.onboarding;
  const checked = checkSignsAs(signsAs);
  if (checked.ok) return null;
  // NS-43-R7: over the limit says the limit; "add what they call you" would tell someone who typed a signature to type one.
  if (checked.reason === 'tooLong') return fill(copy.childrenExtra.edit.signsAsLimit, { n: SIGNS_AS_MAX });
  return fill(many ? o.signsAs.needSignsAsMany : o.signsAs.needSignsAs, { child });
}
