/**
 * One child's book settings (EXPERIENCE_PASS_2026-10 S46, package P6): the rules app/settings/children/[id].tsx draws,
 * pure so test/children-settings.test.ts runs them in Node.
 *
 * The due-date card. Once the due date has passed, a quiet card offers to set the birthday. A passed due date can be
 * hard news, so the card never presumes a birth and never celebrates: no "was born", no drawing, no count of days,
 * never a notification and never on Tonight. "Hide" puts it away on this phone until the person opens the Due date
 * row again.
 *
 * Hiding the book. "Hide this book" is not destructive (nothing is deleted), and in a book with two parents its footer
 * says hiding is only for you (`children.settings.hideShared`, with the other parent's own signature).
 *
 * "Write this book together". With server features off, the coming-soon row as today. With them on, one parent: the
 * row opens the invite sheet; two parents: its value is the other parent's signature ("Papa") and it opens the Family
 * tab. The label is `familyCopy.soon.settingsRow` until P8 adds `familyCopy.bookRow.label` (the same words) and asks
 * for the one-line switch.
 */
import { dueDatePassed } from '@scribe/core';
import { familyCopy } from '@scribe/content';
import { copy, fill } from '@/lib/copy';

/** Per-book setting on this phone: the due-date card was put away with "Hide". Holds the due date it was hidden for. */
export const BORN_CARD_HIDDEN_PREFIX = 'child.bornCardHidden.';
export const bornCardHiddenKey = (childId: string) => `${BORN_CARD_HIDDEN_PREFIX}${childId}`;

/**
 * Whether the due-date card shows: no birthday yet, the due date has gone by, and the person has not put it away for
 * this due date (`hiddenFor` is the due date it was hidden for, so a new due date brings it back on its own day).
 */
export function bornCardShown(input: { birthday: string | null; dueDate: string | null; today: string; hiddenFor: string | null }): boolean {
  if (input.birthday || !input.dueDate) return false;
  if (!dueDatePassed(input.dueDate, input.today)) return false;
  return input.hiddenFor !== input.dueDate;
}

/** The card's words: a title naming the child's birthday, and one gentle line. Never "was born", never a number. */
export function bornCard(childName: string): { title: string; body: string; setButton: string; hideButton: string } {
  const b = copy.childrenExtra.edit.born;
  return { title: fill(b.title, { child: childName }), body: b.offerBody, setButton: b.confirm, hideButton: b.hideButton };
}

/** The other parents of a book, as the last pull listed them (store.listMembers). */
export type CoParentLike = { role: 'parent' | 'contributor'; signsAs: string };

/** The first other parent with a signature, or null for a book with one parent (or only on this phone). */
export function coParentOf(members: readonly CoParentLike[]): string | null {
  const other = members.find((m) => m.role === 'parent' && m.signsAs.trim().length > 0);
  return other ? other.signsAs.trim() : null;
}

/** "Hide this book"'s footer: what hiding does, and, with a co-parent, that it is only for you. */
export function hideFooter(childName: string, coParent: string | null): string {
  const s = copy.children.settings;
  const body = fill(s.hideBody, { child: childName });
  return coParent ? `${body} ${fill(s.hideShared, { coParent, child: childName })}` : body;
}

export type BookRow = { value?: string; footer?: string; href: string };

/** The Family tab, where a book's two parents are shown (S57). */
export const FAMILY_TAB_HREF = '/family';

/**
 * "Write this book together": coming soon (server features off), the invite (one parent) or the Family tab (two).
 * `invite` is where the invite entry leads in this build (lib/family/entry.logic.ts inviteHref).
 */
export function bookRow(input: { serverFeatures: boolean; coParent: string | null; invite: string }): BookRow {
  const soon = familyCopy.soon;
  if (!input.serverFeatures) return { value: soon.status, footer: soon.settingsRowHelp, href: input.invite };
  if (input.coParent) return { value: input.coParent, href: FAMILY_TAB_HREF };
  return { href: input.invite };
}
