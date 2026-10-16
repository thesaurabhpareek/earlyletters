/**
 * "I was invited": what the join sheet shows and the one server call it may make next (BL-322,
 * security review H2; PRD V2 F11 6.2 B; F11-REQ-006). Pure, tested in test/invite-link.test.ts;
 * app/invite/index.tsx renders the view and runs the action.
 *
 * The rules this encodes:
 *  - Before sign-in, nothing is asked of the server and nothing about the invite is shown: a
 *    generic "You were invited to a book" and Sign in (peek_invite needs an account).
 *  - Signed in, the sheet looks first (`peek`): the inviter's sign-off only.
 *  - It joins (`accept`) only after the person tapped Join, and only once consent and sync are
 *    on (accept needs them, SCCON); until then the account step shows. The one exception is an
 *    invite this person already accepted (a second phone, a lost answer): accepting again only
 *    returns the book, it adds no one.
 *  - Joining never opens the book by itself; the joined view has "Open the book".
 */
import type { InviteErrorKind } from './invite-errors.logic';
import type { InvitePreview } from './invite-preview.logic';

export interface JoinInputs {
  /** The stored token has been read (it may be absent). */
  loaded: boolean;
  token: string | null;
  signedIn: boolean;
  /** Signed in, consent complete and sync on: accept_child_invite can succeed. */
  canSync: boolean;
  preview: InvitePreview | null;
  /** A peek or accept call is in flight. */
  busy: 'peek' | 'accept' | null;
  /** The person tapped Join for this token. */
  wantsJoin: boolean;
  joinedChildId: string | null;
  error: InviteErrorKind | null;
}

export type JoinView = 'loading' | 'paste' | 'signIn' | 'peeking' | 'ask' | 'account' | 'joining' | 'joined' | 'failed';
export type JoinAction = 'none' | 'peek' | 'accept';

export function joinPlan(i: JoinInputs): { view: JoinView; next: JoinAction } {
  if (!i.loaded) return { view: 'loading', next: 'none' };
  if (i.joinedChildId) return { view: 'joined', next: 'none' };
  if (i.error) return { view: 'failed', next: 'none' };
  if (i.busy === 'accept') return { view: 'joining', next: 'none' };
  if (!i.token) return { view: 'paste', next: 'none' };
  if (!i.signedIn) return { view: 'signIn', next: 'none' };
  if (!i.preview) return { view: 'peeking', next: i.busy === 'peek' ? 'none' : 'peek' };
  if (i.preview.joined) return { view: 'joining', next: 'accept' };
  if (!i.wantsJoin) return { view: 'ask', next: 'none' };
  if (!i.canSync) return { view: 'account', next: 'none' };
  return { view: 'joining', next: 'accept' };
}
