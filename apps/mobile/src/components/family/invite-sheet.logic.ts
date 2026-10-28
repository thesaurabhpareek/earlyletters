/**
 * Which view the invite sheet shows (EXPERIENCE_PASS_2026-10 S58), pure so it is tested in Node
 * (test/invite-sheet.test.ts). Who may invite and whether the book is full stay S04's
 * (lib/family/members.logic.ts familyTabState, and the server's SCCAP).
 *
 *  - `missing`: no such book on this phone (a stale link to the sheet): nothing to invite to.
 *  - `full`: the book already has two parents (D-069): the full line and no Share.
 *  - `form`: the cover, the sign-off field with its chips, the one-book and link lines, and Share, behind the
 *    account step when sign-in, consent or sync is missing.
 */
export type InviteSheetView = 'missing' | 'full' | 'form';

export function inviteSheetView(i: { hasBook: boolean; full: boolean }): InviteSheetView {
  if (!i.hasBook) return 'missing';
  return i.full ? 'full' : 'form';
}
