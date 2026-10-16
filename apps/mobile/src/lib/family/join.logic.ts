/**
 * Joining a co-parent's book: an invite asks before it joins, and never
 * switches the open book by itself (BL-322 app part; security review H2;
 * gap G-02; F11 6.2 B step 6; F11-REQ-006).
 *
 * The order is fixed: the 18+ gate (root layout, before any route), a token
 * (from the link, kept in the Keychain, or pasted), sign-in with Terms and
 * age, sensitive-data consent (AccountGate), then `peek_invite`, then the
 * question "Join this book as a parent? Invited by {signsAs}" with two equal
 * buttons and nothing chosen. `accept_child_invite` runs only after the Join
 * tap. After joining, the book opens only when the person taps Open; the
 * screen never calls setActiveChildId on its own.
 *
 * Pure reducer plus the effect each phase asks for, so the whole flow is
 * tested in Node with a fake RPC (join.test.ts). The screen
 * (app/invite/index.tsx) only renders the phase and runs the effect.
 */
import { FINAL_INVITE_ERRORS, type InviteErrorKind } from './invite-errors.logic';
import type { InvitePeek } from './family-rpc.logic';

export type JoinState =
  /** Reading the Keychain for a token the link left. */
  | { phase: 'loading' }
  /** No token yet: "Paste the invite link". */
  | { phase: 'paste'; notRecognised: boolean }
  /** A token, waiting for sign-in, Terms and consent (AccountGate shows the one next step). */
  | { phase: 'account' }
  /** Asking the server what the invite says. Joins nothing. */
  | { phase: 'peeking' }
  /** The question. Nothing is chosen; only a tap moves on. */
  | { phase: 'ask'; inviter: string | null }
  /** The Join tap happened (or this person had already joined with this invite): accepting. */
  | { phase: 'joining'; inviter: string | null }
  /** Joined. The book opens only on the Open tap. */
  | { phase: 'joined'; childId: string }
  /** The person chose Not now: nothing joined, the token is dropped. */
  | { phase: 'declined' }
  | { phase: 'failed'; error: InviteErrorKind; stage: 'peek' | 'accept'; inviter: string | null };

export type JoinEvent =
  | { type: 'loaded'; hasToken: boolean; accountReady: boolean }
  | { type: 'pasted'; ok: boolean; accountReady: boolean }
  | { type: 'account'; ready: boolean }
  | { type: 'peeked'; peek: InvitePeek }
  | { type: 'peek_failed'; error: InviteErrorKind }
  | { type: 'join_tapped' }
  | { type: 'not_now_tapped' }
  | { type: 'accepted'; childId: string }
  | { type: 'accept_failed'; error: InviteErrorKind }
  | { type: 'try_again_tapped' }
  | { type: 'paste_again_tapped' };

export const JOIN_START: JoinState = { phase: 'loading' };

function withToken(accountReady: boolean): JoinState {
  return accountReady ? { phase: 'peeking' } : { phase: 'account' };
}

export function joinReducer(s: JoinState, e: JoinEvent): JoinState {
  switch (e.type) {
    case 'loaded':
      return s.phase === 'loading' ? (e.hasToken ? withToken(e.accountReady) : { phase: 'paste', notRecognised: false }) : s;
    case 'pasted':
      if (s.phase !== 'paste') return s;
      return e.ok ? withToken(e.accountReady) : { phase: 'paste', notRecognised: true };
    case 'account':
      // Signing in or finishing consent moves on to the peek; losing the session goes back to the gate.
      if (s.phase === 'account' && e.ready) return { phase: 'peeking' };
      if (!e.ready && (s.phase === 'peeking' || s.phase === 'ask')) return { phase: 'account' };
      return s;
    case 'peeked':
      if (s.phase !== 'peeking') return s;
      // Already a member through this very invite (another device, or a lost answer): accepting again
      // adds nothing and only returns the book id (accept is idempotent for this person). No new join.
      if (e.peek.state === 'joined') return { phase: 'joining', inviter: e.peek.inviterSignsAs };
      return { phase: 'ask', inviter: e.peek.inviterSignsAs };
    case 'peek_failed':
      return s.phase === 'peeking' ? { phase: 'failed', error: e.error, stage: 'peek', inviter: null } : s;
    case 'join_tapped':
      return s.phase === 'ask' ? { phase: 'joining', inviter: s.inviter } : s;
    case 'not_now_tapped':
      return s.phase === 'ask' ? { phase: 'declined' } : s;
    case 'accepted':
      return s.phase === 'joining' ? { phase: 'joined', childId: e.childId } : s;
    case 'accept_failed':
      return s.phase === 'joining' ? { phase: 'failed', error: e.error, stage: 'accept', inviter: s.inviter } : s;
    case 'try_again_tapped':
      if (s.phase !== 'failed' || FINAL_INVITE_ERRORS.includes(s.error)) return s;
      // A peek is asked again; an accept the person already chose is tried again with the same key (G-07).
      return s.stage === 'peek' ? { phase: 'peeking' } : { phase: 'joining', inviter: s.inviter };
    case 'paste_again_tapped':
      return s.phase === 'failed' && FINAL_INVITE_ERRORS.includes(s.error) ? { phase: 'paste', notRecognised: false } : s;
    default:
      return s;
  }
}

/** The one call a phase asks the screen to make. Nothing else talks to the server. */
export type JoinEffect = 'read_token' | 'peek' | 'accept' | 'clear_token' | null;

export function joinEffect(s: JoinState): JoinEffect {
  switch (s.phase) {
    case 'loading':
      return 'read_token';
    case 'peeking':
      return 'peek';
    case 'joining':
      return 'accept';
    case 'declined':
      return 'clear_token';
    case 'failed':
      return FINAL_INVITE_ERRORS.includes(s.error) ? 'clear_token' : null;
    default:
      return null;
  }
}

/** Final errors offer pasting another invite; the rest offer Try again. */
export function failedAction(error: InviteErrorKind): 'paste_again' | 'try_again' {
  return FINAL_INVITE_ERRORS.includes(error) ? 'paste_again' : 'try_again';
}

/**
 * Whether the joined book may become the open book: only on the person's tap,
 * and only once the book is on this phone. Never on its own (BL-322).
 */
export function canOpenJoinedBook(s: JoinState, bookOnPhone: boolean, tapped: boolean): boolean {
  return s.phase === 'joined' && bookOnPhone && tapped;
}

/**
 * F11-REQ-006: what joining still needs, in the only order allowed: the 18+
 * gate, a token, sign-in (with Terms and the age line), sensitive-data
 * consent. 'ready' means the peek may run. An under-18 answer at the gate
 * deletes the stored token (lib/age-gate.ts calls clearPendingInvite).
 */
export type JoinNeed = 'gate' | 'token' | 'sign_in' | 'consent' | 'ready';

export function joinNeeds(s: { gatePassed: boolean; hasToken: boolean; signedIn: boolean; canSync: boolean }): JoinNeed {
  if (!s.gatePassed) return 'gate';
  if (!s.hasToken) return 'token';
  if (!s.signedIn) return 'sign_in';
  if (!s.canSync) return 'consent';
  return 'ready';
}
