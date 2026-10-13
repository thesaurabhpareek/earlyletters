/**
 * Regression tests for security review H1 (gap G-01): an email sign-in link
 * from someone else must never sign this phone into their account, and no
 * local letter may join an account before the person confirms it.
 *
 * The attack path from the review, step by step:
 *  1. Attacker requests a sign-in email for their own address.
 *  2. Attacker sends the link to a parent who uses the app without an account.
 *  3. The parent taps it: the app used to verify it at once.
 *  4. SIGNED_IN used to claim every local letter for the attacker and upload it.
 * Each layer below breaks that chain on its own.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { needsAccountConfirm } from '../src/lib/auth/account-confirm.logic';
import {
  accountConfirmPending,
  confirmAccount,
  currentAuthUserId,
  onSignedIn,
  publishAuth,
  setOwnerReader,
  syncAllowed,
} from '../src/lib/auth/auth-store';
import { codeReadiness, emailCodeLength } from '../src/lib/auth/code-length.logic';
import {
  PENDING_REQUEST_TTL_MS,
  decideEmailLink,
  decodePendingRequest,
  encodePendingRequest,
  parseVerifyRedirect,
  verifyType,
  verifyUrl,
} from '../src/lib/auth/email-link.logic';
import { authErrorKind } from '../src/lib/auth/errors.logic';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { SYNC_SETTING, pendingCount, readSetting } from '../src/lib/sync/outbox';
import { AccountMismatchError, takeOwnership } from '../src/lib/sync/ownership';
import { nodeDb } from './helpers/node-db';

const VICTIM = '0192f0aa-0000-7000-8000-00000000000a';
const ATTACKER = '0192f0aa-0000-7000-8000-00000000000b';
const NOW = Date.parse('2026-10-05T09:00:00.000Z');
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: new Date(NOW).toISOString(), newId: id7 };

const ready = (userId: string): AuthState => ({ status: 'ready', userId, sync: 'on' });
const SIGNED_OUT: AuthState = { status: 'signedOut' };

/** A phone used without an account: one book (fictional Asha) and two letters with no author yet. */
function localOnlyPhone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: ctx.now, newId: id7 });
  const child = id7();
  db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at) VALUES (?, 'Asha', '2025-05-20', 'Mama', ?, ?)", child, ctx.now, ctx.now);
  for (const text of ['Asha laughed at the rain.', 'First steps today.']) {
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id) VALUES (?, 'letter', '2026-09-29', ?, 'typed', 'verbatim', 2, ?, '[]', ?, 1, ?, ?, NULL)`,
      id7(), ctx.now, text, text, ctx.now, child,
    );
  }
  return db;
}

describe('H1 layer 1: a link opens only on the phone that asked for it', () => {
  it('step 3 of the attack: the victim never asked, so the link is not verified at all', () => {
    expect(decideEmailLink({ pending: null, signedIn: false })).toBe('not_this_phone');
  });

  it('a link is opened when this phone asked within the hour', () => {
    const pending = decodePendingRequest(encodePendingRequest({ at: NOW - 5 * 60_000 }), NOW);
    expect(pending).toEqual({ at: NOW - 5 * 60_000 });
    expect(decideEmailLink({ pending, signedIn: false })).toBe('verify');
  });

  it('the request record expires, and damaged or future records count as none', () => {
    expect(decodePendingRequest(encodePendingRequest({ at: NOW - PENDING_REQUEST_TTL_MS - 1 }), NOW)).toBeNull();
    expect(decodePendingRequest(encodePendingRequest({ at: NOW + 5 * 60_000 }), NOW)).toBeNull();
    expect(decodePendingRequest('{"at":"soon"}', NOW)).toBeNull();
    expect(decodePendingRequest('not json', NOW)).toBeNull();
    expect(decodePendingRequest(null, NOW)).toBeNull();
  });

  it('the record holds a time only, never the email address (PRD A F6.2)', () => {
    expect(JSON.parse(encodePendingRequest({ at: NOW }))).toEqual({ at: NOW });
  });

  it('variant from the review: a link never replaces a signed-in session', () => {
    const pending = { at: NOW };
    expect(decideEmailLink({ pending, signedIn: true })).toBe('signed_in');
    expect(decideEmailLink({ pending: null, signedIn: true })).toBe('signed_in');
  });
});

describe('H1 layer 2: PKCE, so a link asked for elsewhere cannot finish here', () => {
  it('opens the link with GET /verify on Supabase, never on our website', () => {
    const url = verifyUrl('https://ref.supabase.co/', HASH, 'email', 'https://earlyletters.com/auth/callback');
    expect(url).toBe(
      `https://ref.supabase.co/auth/v1/verify?token=${HASH}&type=magiclink&redirect_to=${encodeURIComponent('https://earlyletters.com/auth/callback')}`,
    );
    expect(verifyType('signup')).toBe('signup');
    expect(verifyType('magiclink')).toBe('magiclink');
  });

  it('takes only an auth code from the redirect', () => {
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?code=3b0a4d6e-1f2a-4c5d-9e8f-7a6b5c4d3e2f')).toEqual({
      kind: 'code',
      code: '3b0a4d6e-1f2a-4c5d-9e8f-7a6b5c4d3e2f',
    });
  });

  it('refuses a redirect that carries tokens (the implicit-flow shape the attack used)', () => {
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback#access_token=eyJ.a.b&refresh_token=r&type=magiclink')).toEqual({ kind: 'refused' });
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?code=abcdefgh123#access_token=x')).toEqual({ kind: 'refused' });
  });

  it('maps an expired or used link to the expiry message, and anything else to unknown', () => {
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback#error=access_denied&error_code=otp_expired')).toEqual({ kind: 'error', error: 'expired' });
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?error=server_error')).toEqual({ kind: 'error', error: 'unknown' });
    expect(parseVerifyRedirect(null)).toEqual({ kind: 'error', error: 'unknown' });
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?code=<script>')).toEqual({ kind: 'error', error: 'unknown' });
  });

  it("the exchange without this phone's code verifier says the link belongs to another phone", () => {
    expect(authErrorKind({ name: 'AuthPKCECodeVerifierMissingError', code: 'pkce_code_verifier_not_found', status: 400 }, 'link')).toBe('other_phone');
    expect(authErrorKind({ code: 'bad_code_verifier', status: 400 }, 'link')).toBe('other_phone');
    expect(authErrorKind({ code: 'flow_state_not_found', status: 404 }, 'link')).toBe('other_phone');
  });
});

describe('H1 layer 3: no letter joins an account before "Yes, this is me"', () => {
  let owner: string | null;
  let claimed: string[];
  let db: SqlDb;
  let off: () => void;

  beforeEach(() => {
    publishAuth(SIGNED_OUT);
    off?.();
    db = localOnlyPhone();
    owner = null;
    claimed = [];
    setOwnerReader(() => readSetting(db, SYNC_SETTING.owner));
    // What lib/sync does on onSignedIn: claim the phone's letters for the account (a mismatch is caught there too).
    off = onSignedIn((userId) => {
      claimed.push(userId);
      try {
        takeOwnership(db, userId, ctx);
      } catch (e) {
        if (!(e instanceof AccountMismatchError)) throw e;
      }
    });
  });

  it('step 4 of the attack: a session for an unconfirmed account claims nothing and syncs nothing', () => {
    publishAuth(ready(ATTACKER));
    expect(accountConfirmPending()).toBe(true);
    expect(currentAuthUserId()).toBeNull();
    expect(syncAllowed()).toBe(false);
    expect(claimed).toEqual([]);
    expect(readSetting(db, SYNC_SETTING.owner)).toBeNull();
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE author_id IS NULL')!.n).toBe(2);
    expect(pendingCount(db)).toBe(0);
  });

  it('"No, sign out": the session ends and the phone is exactly as it was', () => {
    publishAuth(ready(ATTACKER));
    publishAuth({ status: 'signingOut', userId: ATTACKER, reason: 'switch_account', waitingForUploads: false, sync: 'on' });
    expect(syncAllowed()).toBe(false);
    publishAuth(SIGNED_OUT);
    expect(claimed).toEqual([]);
    expect(readSetting(db, SYNC_SETTING.owner)).toBeNull();
    expect(pendingCount(db)).toBe(0);
  });

  it('"Yes, this is me": only then are the letters claimed and queued', () => {
    publishAuth(ready(VICTIM));
    confirmAccount(ATTACKER); // a confirmation for anyone but the signed-in account does nothing
    expect(claimed).toEqual([]);
    confirmAccount(VICTIM);
    expect(claimed).toEqual([VICTIM]);
    expect(currentAuthUserId()).toBe(VICTIM);
    expect(syncAllowed()).toBe(true);
    expect(readSetting(db, SYNC_SETTING.owner)).toBe(VICTIM);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE author_id = ?', VICTIM)!.n).toBe(2);
    expect(pendingCount(db)).toBeGreaterThan(0);
  });

  it('a phone already owned by this account needs no question (next launch, token refresh)', () => {
    takeOwnership(db, VICTIM, ctx);
    publishAuth(ready(VICTIM));
    expect(accountConfirmPending()).toBe(false);
    expect(syncAllowed()).toBe(true);
    expect(claimed).toEqual([VICTIM]); // the listener runs; takeOwnership is a no-op for the owner
  });

  it('a phone owned by another account: nothing can move, so nothing is asked (sync stops with a mismatch)', () => {
    takeOwnership(db, VICTIM, ctx);
    publishAuth(ready(ATTACKER));
    expect(accountConfirmPending()).toBe(false);
    expect(() => takeOwnership(db, ATTACKER, ctx)).toThrow(AccountMismatchError);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE author_id = ?', ATTACKER)!.n).toBe(0);
  });

  it('a confirmation lasts for that session only', () => {
    owner = null;
    expect(needsAccountConfirm(VICTIM, owner, new Set([VICTIM]))).toBe(false);
    publishAuth(ready(VICTIM));
    confirmAccount(VICTIM);
    publishAuth(SIGNED_OUT);
    // The claim set the owner, so the same account is recognised next time without asking.
    publishAuth(ready(VICTIM));
    expect(accountConfirmPending()).toBe(false);
  });

  it('pure rule', () => {
    expect(needsAccountConfirm(null, null, new Set())).toBe(false);
    expect(needsAccountConfirm(VICTIM, null, new Set())).toBe(true);
    expect(needsAccountConfirm(VICTIM, ATTACKER, new Set())).toBe(false);
    expect(needsAccountConfirm(VICTIM, VICTIM, new Set())).toBe(false);
  });
});

describe('email code length (security review M4, G-05)', () => {
  it('defaults to 8 digits and accepts a configured 6 to 10', () => {
    expect(emailCodeLength(undefined)).toBe(8);
    expect(emailCodeLength('')).toBe(8);
    expect(emailCodeLength('6')).toBe(6);
    expect(emailCodeLength('10')).toBe(10);
    expect(emailCodeLength('5')).toBe(8);
    expect(emailCodeLength('eight')).toBe(8);
  });

  it('submits an 8-digit code on its own, and offers Continue for another allowed length', () => {
    expect(codeReadiness('12345678', 8)).toBe('auto');
    expect(codeReadiness('123456', 8)).toBe('manual');
    expect(codeReadiness('1234567890', 8)).toBe('manual');
    expect(codeReadiness('12345', 8)).toBe('wait');
    expect(codeReadiness('', 8)).toBe('wait');
  });
});
