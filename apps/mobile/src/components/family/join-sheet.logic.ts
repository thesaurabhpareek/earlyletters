/**
 * The join sheet's words and buttons (EXPERIENCE_PASS_2026-10 S59), pure so they are tested in Node
 * (test/join-sheet.test.ts). Which view shows and which server call runs next stay S04's
 * (lib/family/join-flow.logic.ts joinPlan); this file only says what each view puts on screen.
 *
 * The rules it keeps (BL-322, security review H2):
 *  - Before sign-in neither the child's name nor the inviter is shown: the views up to `ask` never take the
 *    child's name, and only `ask` shows the inviter's sign-off.
 *  - The child's name first appears on the opening cover, in the joined view.
 *  - Typed codes are not part of build 2 (link-only invites, the coordinator's ruling of 28 Oct 2026): the paste
 *    field reads a link or a bare token from what the person pasted; anything else, an 8-character code
 *    included, gets "That doesn't look like an invite link." and the field stays, so they can paste the link.
 *  - A failure says what happened plainly. One that can never work again (expired, used, cancelled, not found,
 *    already a member, two parents) drops the link and offers "Paste another link"; any other (offline, a server
 *    that did not answer, a pause) keeps it and offers "Try again".
 */
import { familyCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import { FINAL_INVITE_ERRORS, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { parseInviteInput } from '@/lib/family/invite-link.logic';
import { joinErrorLine, type JoinView } from '@/lib/family/join-flow.logic';

/** Views that come before the join returns: none of them may name the child (BL-322). */
export const BEFORE_JOIN: readonly JoinView[] = ['loading', 'paste', 'signIn', 'peeking', 'ask', 'account', 'joining', 'failed'];

/** The sheet's title for a view; `joined` is the only one with the child's name. */
export function joinTitle(view: JoinView, child: string | null): string {
  const a = familyCopy.accept;
  if (view === 'signIn') return a.invitedTitle;
  if (view === 'ask') return a.askTitle;
  if (view === 'joined' && child) return renderTemplate(a.joinedTitle, { child });
  return a.title;
}

/** The ask's line: the inviter's sign-off set as a letter's signature, or the unnamed line. Never the child. */
export function invitedByLine(inviter: string | null | undefined): { text: string; signature: boolean } {
  const s = (inviter ?? '').trim();
  return s ? { text: renderTemplate(familyCopy.accept.invitedBy, { inviter: s }), signature: true } : { text: familyCopy.accept.invitedByUnknown, signature: false };
}

/** What Continue does with the pasted text: the token, or the not-recognised line (and nothing is sent). */
export function readPasted(text: string, origin: string): { token: string } | { error: string } {
  const token = parseInviteInput(text, origin);
  return token ? { token } : { error: familyCopy.accept.notRecognised };
}

/** The failed view: the line, and the one way on. */
export function joinFailure(kind: InviteErrorKind): { line: string; action: 'pasteAnother' | 'tryAgain' } {
  const a = familyCopy.accept;
  const which = joinErrorLine(kind);
  const line = which === 'needsSync' ? a.needsSync : which === 'tryLater' ? a.tryLater : renderTemplate(familyCopy.errors[which], { child: '' });
  return { line, action: FINAL_INVITE_ERRORS.includes(kind) ? 'pasteAnother' : 'tryAgain' };
}

/** The joined view's line under the title: the flyleaf, in words, with the inviter's sign-off when there is one. */
export function joinedBody(inviter: string | null | undefined): string {
  const s = (inviter ?? '').trim();
  return s ? renderTemplate(familyCopy.accept.joinedBody, { inviter: s }) : familyCopy.accept.joinedBodyUnknown;
}

/**
 * Where "Open the book" lands: the Book, on this book. The second parent's first light there (5.8 row 12) is the
 * one-shot mark the sheet leaves just before (family-notice.ts joinedArrival), not a route param.
 */
export const JOINED_LANDING = '/book' as const;

/**
 * How "Open the book" gets there, from the routes under the sheet and whether first run's welcome step is the one
 * showing. Over the welcome (a fresh install), the sheet only closes: the welcome hands over to the Book itself and
 * leaves the stack (welcome-handoff.logic.ts), so nothing of first run stays under the tabs. Over a later first-run
 * step (an invite link opened part-way through first run), that step never hands over, so the sheet dismisses to
 * the Book, as it does over the tabs (a parent who already has a book).
 */
export function openLanding(routesUnderSheet: readonly string[], welcomeShowing: boolean): 'welcome' | 'book' {
  return routesUnderSheet.includes('onboarding') && welcomeShowing ? 'welcome' : 'book';
}

/**
 * Try again after a failure. A look (peek) that failed looks again, so its old answer is dropped; a join (accept)
 * that failed keeps the answer it had and joins again, without asking the server to look a second time.
 */
export function retryKeepsPreview(failedAt: 'peek' | 'accept'): boolean {
  return failedAt === 'accept';
}
