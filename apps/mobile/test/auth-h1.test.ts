/// <reference types="node" />
/**
 * Security review H1 (docs/reviews/2026-10-04-security-privacy.md, "Login CSRF
 * through the email sign-in link exfiltrates local letters") as a regression
 * test: the five steps of the failure scenario, run against the real auth
 * store, the real link logic and the real re-ownership step (lib/sync
 * ownership.ts over node:sqlite). BL-347; F02-REQ-018, F02-REQ-019,
 * F02-REQ-020.
 *
 * On develop at 4183844 (before BL-347) the "step 4" test fails: publishAuth
 * fires onSignedIn at SIGNED_IN, so takeOwnership hands the phone's letters
 * to whichever account just signed in (see the PR for the run). The link
 * tests fail there too, since the link was verified with verifyOtp on open.
 *
 * Fictional family "Asha" only; the two accounts are ids, never people.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { brand } from '@scribe/brand';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import type { AuthEvent, AuthState, SyncGate } from '../src/lib/auth/machine.logic';
import { authReducer, initialAuthState } from '../src/lib/auth/machine.logic';
import { classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { pendingCount, readSetting, SYNC_SETTING } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { nodeDb } from './helpers/node-db';

// email.ts reaches Supabase through expo/fetch; every test here hands in its own fetch.
vi.mock('expo/fetch', () => ({ fetch: vi.fn(() => Promise.reject(new Error('no network in tests'))) }));

const ATTACKER = '0192f0aa-0000-7000-8000-0000000000a1';
const PARENT = '0192f0aa-0000-7000-8000-0000000000b2';
/** The attacker's own account has Terms and sensitive-data consent (H1 step 1). */
const CONSENTED: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const NOW = Date.parse('2026-10-15T20:00:00.000Z');
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: new Date(NOW).toISOString(), newId: id7 };

/** A parent's phone: local-first, never signed in, one book and one letter (H1 step 2). */
function parentsPhone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, { now: ctx.now, newId: id7 });
  const child = id7();
  db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at) VALUES (?, 'Asha', '2025-04-12', 'Mama', ?, ?)", child, ctx.now, ctx.now);
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id) VALUES (?, 'letter', '2026-10-14', ?, 'typed', 'verbatim', 2, ?, '[]', ?, 1, ?, ?, NULL)`,
    id7(), ctx.now, 'Asha laughed at the rain.', 'Asha laughed at the rain.', ctx.now, child,
  );
  return db;
}

type Store = typeof import('../src/lib/auth/auth-store');

/** The auth store in a fresh module, wired the way lib/sync/index.ts wires it: onSignedIn claims the phone. */
async function wiredStore(db: SqlDb) {
  vi.resetModules();
  const store: Store = await import('../src/lib/auth/auth-store');
  const claimedFor: string[] = [];
  store.onSignedIn((userId) => {
    claimedFor.push(userId);
    takeOwnership(db, userId, ctx);
  });
  let state: AuthState = initialAuthState;
  const send = (...events: AuthEvent[]) => {
    for (const e of events) {
      state = authReducer(state, e);
      store.publishAuth(state);
    }
    return state;
  };
  return { store, claimedFor, send, state: () => state };
}

const owner = (db: SqlDb) => readSetting(db, SYNC_SETTING.owner);

describe('[F02-REQ-018] H1 steps 1 to 3: the attacker\'s link never signs this phone in', () => {
  const link = () => classifyIncomingUrl(`https://earlyletters.com/auth/callback#token_hash=${HASH}&type=email`, { origin: brand.web.origin, scheme: brand.scheme });

  it('step 1: the copied link is an ordinary sign-in link on the real domain', () => {
    expect(link()).toEqual({ kind: 'auth-link', tokenHash: HASH, type: 'email' });
  });

  it('step 3, layer 1: a phone that never asked for an email refuses it before any request', async () => {
    const { openEmailLink } = await import('../src/lib/auth/email-link.logic');
    const exchange = vi.fn(async () => ATTACKER);
    const r = await openEmailLink({ tokenHash: HASH, type: 'email' }, { readPending: async () => null, signedIn: () => false, exchange, clearPending: async () => {} });
    expect(r).toEqual({ ok: false, error: 'other_phone' });
    expect(exchange).not.toHaveBeenCalled();
  });

  it('step 3, layer 2: even when this phone asked for its own email, the attacker\'s link cannot finish here (PKCE)', async () => {
    const { setServerFeaturesForTests } = await import('../src/lib/capabilities');
    setServerFeaturesForTests(true);
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://asha-fixture.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_asha_fixture';
    try {
      const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
      const { authErrorKind } = await import('../src/lib/auth/errors.logic');
      // A fake GoTrue: the token belongs to the attacker's flow, and this phone holds the verifier of another flow.
      const fetchFn = vi.fn(async () => ({ status: 303, headers: { get: () => 'https://earlyletters.com/auth/callback?code=attacker-flow-code-0001' } }));
      const exchangeCodeForSession = vi.fn(async (code: string) =>
        code === 'attacker-flow-code-0001'
          ? { data: { user: null, session: null }, error: Object.assign(new Error('bad_code_verifier'), { code: 'bad_code_verifier', status: 400 }) }
          : { data: { user: { id: PARENT }, session: null }, error: null },
      );
      const sb = { auth: { exchangeCodeForSession } } as never;
      const err = await verifyEmailLinkPkce(sb, HASH, 'email', fetchFn).catch((e: unknown) => e);
      expect(authErrorKind(err, 'link')).toBe('other_phone');
      expect(exchangeCodeForSession).toHaveBeenCalledTimes(1);
    } finally {
      setServerFeaturesForTests(null);
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    }
  });

  it('[F02-REQ-020] a link is refused while an account is signed in, whatever the pending note says', async () => {
    const { openEmailLink } = await import('../src/lib/auth/email-link.logic');
    const exchange = vi.fn(async () => ATTACKER);
    const r = await openEmailLink({ tokenHash: HASH, type: 'email' }, { readPending: async () => ({ at: NOW }), signedIn: () => true, exchange, clearPending: async () => {} });
    expect(r).toEqual({ ok: false, error: 'already_signed_in' });
    expect(exchange).not.toHaveBeenCalled();
  });
});

describe('[F02-REQ-019] H1 step 4: a session alone never claims or uploads this phone\'s letters', () => {
  let db: SqlDb;
  beforeEach(() => {
    db = parentsPhone();
  });

  it('even if the attacker\'s session appeared and consent is already done, takeOwnership does not run and nothing is queued', async () => {
    // Uses only what auth-store had before BL-347 (publishAuth, onSignedIn, currentAuthUserId, syncAllowed),
    // so this test runs unchanged against develop, where it fails.
    const { store, claimedFor, send } = await wiredStore(db);
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: ATTACKER, method: 'email' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(claimedFor).toEqual([]);
    expect(owner(db)).toBeNull();
    expect(pendingCount(db)).toBe(0);
    expect(store.currentAuthUserId()).toBeNull();
    expect(store.syncAllowed()).toBe(false);
  });

  it('the claim screen is pending until a tap; "Not my account" ends the session and the phone is as it was', async () => {
    const { store, claimedFor, send } = await wiredStore(db);
    store.setClaimReaders({ owner: () => owner(db), hasLocalData: () => phoneHoldsAnyRow(db) });
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: ATTACKER, method: 'email' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(store.accountClaimPending()).toBe(true);
    send({ type: 'SIGN_OUT_REQUESTED', reason: 'switch_account', pendingUploads: 0 }, { type: 'SIGNED_OUT' });
    expect(store.accountClaimPending()).toBe(false);
    expect(claimedFor).toEqual([]);
    expect(owner(db)).toBeNull();
    expect(pendingCount(db)).toBe(0);
  });
});

describe('[F02-REQ-019] H1 step 5: the parent\'s own account still gets the letters, once, after consent and the tap', () => {
  it('consent screens first, then the claim, then one takeOwnership; no account mismatch afterwards', async () => {
    const db = parentsPhone();
    const { store, claimedFor, send } = await wiredStore(db);
    store.setClaimReaders({ owner: () => owner(db), hasLocalData: () => phoneHoldsAnyRow(db) });
    // An existing account without sensitive-data consent: the consent sheet comes first (R4 PT-20).
    const needs = send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'apple' }, {
      type: 'GATE_LOADED',
      gate: { termsCurrent: true, ageAttested: true, sensitiveData: false, contentAllowed: false },
      sensitiveDeclined: false,
    });
    expect(needs.status).toBe('needsConsent');
    expect(claimedFor).toEqual([]);
    send({ type: 'CONSENT_RECORDED', step: 'sensitive', accepted: true });
    expect(store.accountClaimPending()).toBe(true);
    expect(claimedFor).toEqual([]);
    store.confirmAccountClaim(PARENT);
    expect(claimedFor).toEqual([PARENT]);
    expect(owner(db)).toBe(PARENT);
    expect(pendingCount(db)).toBeGreaterThan(0);
    expect(store.syncAllowed()).toBe(true);
    // A repeat SIGNED_IN (foreground refresh) never claims again.
    send({ type: 'SIGNED_IN', userId: PARENT, method: null });
    expect(claimedFor).toEqual([PARENT]);
  });

  it('a confirm for an account that is not the signed-in one does nothing', async () => {
    const db = parentsPhone();
    const { store, claimedFor, send } = await wiredStore(db);
    store.setClaimReaders({ owner: () => owner(db), hasLocalData: () => phoneHoldsAnyRow(db) });
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'apple' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    store.confirmAccountClaim(ATTACKER);
    expect(claimedFor).toEqual([]);
    expect(store.accountClaimPending()).toBe(true);
  });
});

describe('[F02-REQ-019] the real "anything to claim?" reader errs towards asking', () => {
  const empty = (): SqlDb => {
    const { db } = nodeDb();
    migrate(db, { now: ctx.now, newId: id7 });
    return db;
  };

  it('a fresh phone holds nothing; a book or a letter in any state counts', () => {
    const db = empty();
    expect(phoneHoldsAnyRow(db)).toBe(false);
    db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at, hidden_at) VALUES (?, 'Asha', '2025-04-12', 'Mama', ?, ?, ?)", id7(), ctx.now, ctx.now, ctx.now);
    expect(phoneHoldsAnyRow(db)).toBe(true);
  });

  it('a phone holding only a hidden book still shows the claim screen, and nothing is claimed before the tap', async () => {
    const db = empty();
    const child = id7();
    db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at, hidden_at) VALUES (?, 'Asha', '2025-04-12', 'Mama', ?, ?, ?)", child, ctx.now, ctx.now, ctx.now);
    const { store, claimedFor, send } = await wiredStore(db);
    store.setClaimReaders({ owner: () => owner(db), hasLocalData: () => phoneHoldsAnyRow(db) });
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: ATTACKER, method: 'email' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(store.accountClaimPending()).toBe(true);
    expect(claimedFor).toEqual([]);
    expect(pendingCount(db)).toBe(0);
  });

  it('a phone with nothing on it needs no claim screen: the session is released after consent', async () => {
    const db = empty();
    const { store, claimedFor, send } = await wiredStore(db);
    store.setClaimReaders({ owner: () => owner(db), hasLocalData: () => phoneHoldsAnyRow(db) });
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'apple' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(store.accountClaimPending()).toBe(false);
    expect(claimedFor).toEqual([PARENT]);
  });
});

afterEach(() => {
  vi.resetModules();
});
