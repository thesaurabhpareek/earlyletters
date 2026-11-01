/**
 * The Family tab's presentation (EXPERIENCE_PASS_2026-10 S57), pure so it is tested in Node
 * (test/family-tab.test.ts). Which people the tab shows and how each is written; the book's states
 * (who is a parent, whether inviting is offered) stay S04's, in lib/family/members.logic.ts.
 *
 * - People are signatures, not accounts: "From Mama" with "You" or "Co-parent" under it. No avatar,
 *   no initials, no email address, for anyone.
 * - Never more than two parents (D-069): you and at most one co-parent, whatever the pull holds.
 * - Nothing is counted: no "1 of 2", no number of letters, no number of invites.
 * - Build 2 has no Leave row (D-113, lib/family/entry.logic.ts LEAVE_BOOK_OFFERED): the tab offers the invite
 *   card while `familyTabState(...).showInviteCard`, and nothing more with two parents.
 */
import { en, familyCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import type { MemberLike, SeenCoParent } from '@/lib/family/members.logic';

/** D-069: a book has at most two parents, so the tab shows you and at most one co-parent. */
export const MAX_PARENTS_SHOWN = 2;

/** One person on the tab, as a signature. */
export interface PersonRow {
  /** A stable key: "you", or the co-parent's profile id. */
  key: string;
  /** "From Mama", or the role word when there is no sign-off. */
  signature: string;
  /** "You" or "Co-parent", under the signature. */
  role: string;
  /** What VoiceOver reads for the row, without the visual order's line break. */
  label: string;
}

/** "From Mama"; the fallback when a person set no sign-off. Never an email address or an account name. */
export function signatureLine(signsAs: string | null | undefined, fallback: string): string {
  const s = (signsAs ?? '').trim();
  return s ? renderTemplate(en.common.signature, { signsAs: s }) : fallback;
}

/** What VoiceOver reads for a row: the signature, then the line under it ("From Mama, You"); one word once. */
export function rowLabel(signature: string, line: string): string {
  return signature === line ? line : `${signature}, ${line}`;
}

/**
 * The line under a row's signature, or none when it would only repeat the signature: a parent with no sign-off yet
 * (a joined book before they set one) reads "You" once, not "You" over "You".
 */
export function rowLine(signature: string, line: string): string | null {
  return line && line !== signature ? line : null;
}

/** You, then the other parent the last pull listed (at most one, D-069). */
export function peopleRows(you: { signsAs: string }, coParents: readonly MemberLike[]): PersonRow[] {
  const m = familyCopy.members;
  const rows: Omit<PersonRow, 'label'>[] = [{ key: 'you', signature: signatureLine(you.signsAs, m.you), role: m.you }];
  for (const p of coParents.filter((c) => c.role === 'parent').slice(0, MAX_PARENTS_SHOWN - 1)) {
    rows.push({ key: p.id, signature: signatureLine(p.signsAs, m.invitedName), role: m.coParent });
  }
  return rows.map((r) => ({ ...r, label: rowLabel(r.signature, r.role) }));
}

/**
 * A pending invite's line: "Your co-parent", because nobody has signed anything yet. The sign-off the inviter
 * suggested is their guess, not the other parent's own signature, so the row does not write it as theirs.
 */
export const pendingSignature = (): string => familyCopy.members.invitedName;

/**
 * Co-parents this phone has not shown before: their row enters once with the 1.6 s wash (S57 Motion). The seen
 * list is S04's (members.logic.ts seenCoParentsKey), read before it is replaced. Only for a book the server lists
 * for this person, as `leftSince` reads it.
 */
export function arrivedSince(seen: readonly SeenCoParent[], current: readonly MemberLike[], onServer: boolean): string[] {
  if (!onServer) return [];
  const before = new Set(seen.map((s) => s.id));
  return current.filter((m) => m.role === 'parent' && !before.has(m.id)).map((m) => m.id);
}

/**
 * The invite card's quiet note, when there is one (S57 States, "consent missing"): signed in, with the account's
 * setting-up step not answered yet. Signed out the card says nothing more: the sign-in sheet's title says it
 * (`card.signedOutNote` is retired).
 */
export function inviteCardNote(i: { needsConsent: boolean }): string | null {
  return i.needsConsent ? familyCopy.card.finishSetup : null;
}
