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

/**
 * What the sheet does once the system share sheet closes (S58; critics' pass S1). `shareInviteLink` tells the two
 * apart (lib/family/share.ts):
 *  - `shared`: the link went out. One success tick, the sheet closes, and the Family tab says the invite waits there;
 *    the next invite from this sheet is a new one.
 *  - `dismissed`: nothing was sent. The sheet stays at "Share invite link" with the same draft, with no tick and no
 *    toast, so a second tap shares the same invite again (the server takes a repeat of one draft as one invite)
 *    instead of making a second one. Chosen over closing quietly because the person is still in the act of sending.
 */
export function afterShare(outcome: 'shared' | 'dismissed'): { close: boolean; tick: boolean; notice: boolean; keepDraft: boolean } {
  return outcome === 'shared' ? { close: true, tick: true, notice: true, keepDraft: false } : { close: false, tick: false, notice: false, keepDraft: true };
}
