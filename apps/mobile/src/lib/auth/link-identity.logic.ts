/**
 * Adding a second way to sign in to the account that is signed in (BL-1893; NS-54-R18, R20, R21; A-REQ-019).
 * The data half only: no screen calls this yet. BL-1894 adds Me, Ways to sign in, and turns on
 * `enable_manual_linking` in the same change (NS-54-R19); until then Supabase refuses every link with
 * `manual_linking_disabled`, and this returns `linking_off`.
 *
 * The rule this holds (NS-54-R18): a method that already belongs to another account is refused, and nothing moves.
 * Supabase Auth refuses it on the server: auth-js 2.117.2 `linkIdentity` with a token posts
 * `/token?grant_type=id_token` with `link_identity: true` and this session's access token
 * (node_modules/@supabase/auth-js/dist/main/GoTrueClient.js `linkIdentityIdToken`, read 25 Nov 2026), and the
 * Identity Linking guide says the call fails when the identity is linked to this or another user. Which error code the
 * server sends for "another user" is UNVERIFIED (auth-js 2.117.2 declares `identity_already_exists`; the auth server
 * source was not read), so that code or an HTTP 409 reads as `belongs_to_another_account`, and any other refusal reads
 * as `failed`: either way nothing is linked. The answer is checked too: a link must come back as the same account
 * now holding the method. An answer for any other account is `account_changed`, never a success.
 *
 * NS-54-R20, R21: the outcome carries a provider name and a reason, never an identity id, an email, a token or the
 * other account's id, so nothing here can reach a log, an event or a hint about another account.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { errorCode, errorStatus, isNetworkError } from '../supabase/errors.logic';

/** The methods that link by an ID token from the phone's own sheet (D-054). Email is linked another way (BL-1894). */
export type LinkProvider = 'apple' | 'google';

export interface LinkRequest {
  provider: LinkProvider;
  /** The provider's ID token from its native sheet. */
  token: string;
  /** Apple only: the raw nonce whose hash went to the Apple sheet. */
  nonce?: string;
}

/** Why a link did not happen. Words for each are BL-1894's (content). */
export type LinkRefusal =
  | 'not_signed_in' // no session on this phone, or not the person who asked
  | 'already_linked' // this account already has this method
  | 'belongs_to_another_account' // NS-54-R18: refused, nothing moves
  | 'account_changed' // the server answered with another account: the caller ends this session (BL-1894), never shows it
  | 'linking_off' // enable_manual_linking is off (it is, until BL-1894)
  | 'network'
  | 'rate_limited'
  | 'failed';

export type LinkOutcome = { ok: true; provider: LinkProvider } | { ok: false; provider: LinkProvider; reason: LinkRefusal };

/** The part of the Supabase client this uses, so a test can stand in for it. */
export type LinkAuth = Pick<SupabaseClient['auth'], 'getSession' | 'getUserIdentities' | 'linkIdentity'>;

/** Supabase's refusal mapped to a reason. Pure. Network first: a request that never got an answer is not a refusal. */
export function linkRefusalOf(e: unknown): LinkRefusal {
  const code = errorCode(e);
  const status = errorStatus(e);
  if (isNetworkError(e) && (status === null || status < 500)) return 'network';
  if (code === 'manual_linking_disabled') return 'linking_off';
  if (code === 'over_request_rate_limit' || status === 429) return 'rate_limited';
  if (code === 'session_not_found' || code === 'session_expired' || code === 'refresh_token_not_found' || code === 'bad_jwt') return 'not_signed_in';
  if (code === 'identity_already_exists' || status === 409) return 'belongs_to_another_account';
  return 'failed';
}

/**
 * Links `req` to the account `userId` is signed in to. Never throws: every path ends in an outcome.
 * `userId` is the signed-in person the screen shows; a session for anyone else refuses before any request.
 */
export async function linkMethod(auth: LinkAuth, userId: string, req: LinkRequest): Promise<LinkOutcome> {
  const refuse = (reason: LinkRefusal): LinkOutcome => ({ ok: false, provider: req.provider, reason });
  try {
    const { data: s, error: se } = await auth.getSession();
    if (se) return refuse(linkRefusalOf(se));
    if (!s.session || s.session.user.id !== userId) return refuse('not_signed_in');

    // This account already has the method: nothing to add, and no request whose refusal could read as another account's.
    const ids = await auth.getUserIdentities();
    if (ids.error) return refuse(linkRefusalOf(ids.error));
    if (ids.data.identities.some((i) => i.provider === req.provider)) return refuse('already_linked');

    const { data, error } = await auth.linkIdentity({ provider: req.provider, token: req.token, ...(req.nonce ? { nonce: req.nonce } : {}) });
    if (error) return refuse(linkRefusalOf(error));
    // Nothing moves: the answer must be this same account, now holding the method. Anything else is not a link.
    const user = data.user;
    if (!user) return refuse('failed');
    if (user.id !== userId) return refuse('account_changed');
    if (!(user.identities ?? []).some((i) => i.provider === req.provider)) return refuse('failed');
    return { ok: true, provider: req.provider };
  } catch (e) {
    return refuse(linkRefusalOf(e));
  }
}
