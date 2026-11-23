/// <reference types="node" />
/**
 * BL-1532 (CISO-3, audit F11): `accountClaimPending` leads to a claim only after
 * the person chooses it ("Keep in this account"). Nothing in the app may claim
 * this phone's letters for a signed-in account on its own: not a consent step,
 * not a foreground refresh, not a second sign-in, not a re-read of the store.
 *
 * Behaviour is run against the real auth store, with the same wiring as
 * auth-h1.test.ts (onSignedIn runs takeOwnership over node:sqlite). The one
 * assertion that needs the source text (who may call confirmAccountClaim, and
 * from where) is marked SOURCE; it is what turns a planted automatic claim red.
 *
 * Covers (BL-1532, after B6a #1529): the explicit choice in the auth store, the owner-already-set case, and the
 * call graph of the claim: keepLettersHere -> adoptDeviceOnlyLocal (local-claim.ts) -> confirmAccountClaim only after
 * adopt resolves true, adoptLocal only from local-claim.ts, takeOwnership only from the sync wiring.
 *
 * NOT covered (do not read this as the whole guarantee): an app restart with a session already stored (the
 * RESTORED path with consent done), native Apple and Google callbacks reaching the provider, and the rendered
 * provider and claim sheet (only their source is checked), names built at run time (computed strings), and code
 * outside apps/mobile/src. Those need device or e2e tests.
 *
 * Fictional family "Asha" only; the accounts are ids, never people.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import type { AuthEvent, AuthState, SyncGate } from '../src/lib/auth/machine.logic';
import { authReducer, initialAuthState } from '../src/lib/auth/machine.logic';
import { pendingCount, readSetting, SYNC_SETTING } from '../src/lib/sync/outbox';
import { AccountMismatchError, takeOwnership } from '../src/lib/sync/ownership';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { nodeDb } from './helpers/node-db';

vi.mock('expo/fetch', () => ({ fetch: vi.fn(() => Promise.reject(new Error('no network in tests'))) }));

const PARENT = '0192f0aa-0000-7000-8000-0000000000b2';
const CONSENTED: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const NOW = Date.parse('2026-10-15T20:00:00.000Z');
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: new Date(NOW).toISOString(), newId: id7 };

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

async function wiredStore(db: SqlDb) {
  vi.resetModules();
  const store: Store = await import('../src/lib/auth/auth-store');
  const claimedFor: string[] = [];
  store.onSignedIn((userId) => {
    claimedFor.push(userId);
    takeOwnership(db, userId, ctx);
  });
  store.setClaimReaders({ owner: () => readSetting(db, SYNC_SETTING.owner), hasLocalData: () => phoneHoldsAnyRow(db) });
  let state: AuthState = initialAuthState;
  const send = (...events: AuthEvent[]) => {
    for (const e of events) {
      state = authReducer(state, e);
      store.publishAuth(state);
    }
    return state;
  };
  return { store, claimedFor, send };
}

const owner = (db: SqlDb) => readSetting(db, SYNC_SETTING.owner);

describe('[BL-1532] a pending claim becomes a claim only when the person chooses it', () => {
  let db: SqlDb;
  beforeEach(() => {
    db = parentsPhone();
  });

  it('a signed-in, consented account on a phone with letters waits, and keeps waiting through everything but the choice', async () => {
    const { store, claimedFor, send } = await wiredStore(db);
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'apple' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(store.accountClaimPending()).toBe(true);
    // Time, repeated sign-in events, a foreground refresh, a fresh gate load, readers re-read: still no claim.
    send({ type: 'SIGNED_IN', userId: PARENT, method: null }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    store.accountClaimPending();
    store.accountClaimPending();
    expect(store.accountClaimPending()).toBe(true);
    expect(claimedFor).toEqual([]);
    expect(owner(db)).toBeNull();
    expect(pendingCount(db)).toBe(0);
    expect(store.currentAuthUserId()).toBeNull();
    expect(store.syncAllowed()).toBe(false);
  });

  it('the choice is the only thing that claims: exactly once, for that account, and only then does sync open', async () => {
    const { store, claimedFor, send } = await wiredStore(db);
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'google' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(claimedFor).toEqual([]);
    store.confirmAccountClaim(PARENT);
    expect(claimedFor).toEqual([PARENT]);
    expect(owner(db)).toBe(PARENT);
    expect(store.accountClaimPending()).toBe(false);
    expect(store.syncAllowed()).toBe(true);
  });

  it('leaving without choosing claims nothing, and the next account to sign in on the phone is asked too', async () => {
    const { store, claimedFor, send } = await wiredStore(db);
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'apple' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(store.accountClaimPending()).toBe(true);
    send({ type: 'SIGN_OUT_REQUESTED', reason: 'switch_account', pendingUploads: 0 }, { type: 'SIGNED_OUT' });
    const other = '0192f0aa-0000-7000-8000-0000000000c3';
    send({ type: 'SIGNED_IN', userId: other, method: 'email' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    expect(store.accountClaimPending()).toBe(true);
    expect(claimedFor).toEqual([]);
    expect(owner(db)).toBeNull();
    expect(pendingCount(db)).toBe(0);
  });

  it('a phone that already belongs to account A: account B signing in claims and adopts nothing of A\'s', async () => {
    const A = '0192f0aa-0000-7000-8000-0000000000a9';
    takeOwnership(db, A, ctx);
    const queued = pendingCount(db);
    vi.resetModules();
    const store: Store = await import('../src/lib/auth/auth-store');
    const adopted: string[] = [];
    const fired: string[] = [];
    store.onSignedIn((userId) => {
      fired.push(userId);
      try {
        takeOwnership(db, userId, ctx);
        adopted.push(userId);
      } catch (e) {
        if (!(e instanceof AccountMismatchError)) throw e;
      }
    });
    store.setClaimReaders({ owner: () => readSetting(db, SYNC_SETTING.owner), hasLocalData: () => phoneHoldsAnyRow(db) });
    let state: AuthState = initialAuthState;
    for (const e of [{ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: PARENT, method: 'email' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false }] as AuthEvent[]) {
      state = authReducer(state, e);
      store.publishAuth(state);
    }
    store.confirmAccountClaim('0192f0aa-0000-7000-8000-0000000000d4'); // a tap for any other id does nothing
    expect(fired).toEqual([PARENT]); // B's session was released and the engine tried: the refusal is real, not a silent no-show
    expect(adopted).toEqual([]);
    expect(owner(db)).toBe(A);
    expect(pendingCount(db)).toBe(queued);
    expect(db.get<{ n: number }>("SELECT COUNT(*) AS n FROM entries WHERE author_id = ?", PARENT)?.n ?? 0).toBe(0);
  });

  it('SOURCE: every reference to confirmAccountClaim, keepLettersHere and takeOwnership is on the short allowed list', () => {
    const src = join(__dirname, '..', 'src');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) files.push(p);
      }
    };
    walk(src);
    const code = (p: string) => readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
    // Any identifier reference counts (calls, aliases, bare passes, re-exports), comments excluded.
    const refs = (word: string, except: string[] = []) => {
      const out: Record<string, number> = {};
      for (const p of files) {
        const f = p.slice(src.length + 1);
        if (except.includes(f)) continue;
        const k = (code(p).match(new RegExp(`\\b${word}\\b`, 'g')) ?? []).length;
        if (k) out[f] = k;
      }
      return out;
    };
    const provider = join('lib', 'auth', 'session-provider.tsx');
    const consent = join('app', '(auth)', 'sign-in', 'consent.tsx');
    // (c) confirmAccountClaim: the provider's import and its one call, nothing else, in any form (string names included).
    expect(refs('confirmAccountClaim', [join('lib', 'auth', 'auth-store.ts')])).toEqual({ [provider]: 2 });
    expect(refs('confirmAccountClaim')[join('lib', 'auth', 'auth-store.ts')]).toBe(1); // auth-store only defines it
    expect(refs('takeOwnership')[join('lib', 'auth', 'auth-store.ts')]).toBeUndefined();
    const providerCode = code(join(src, provider));
    // The body of keepLettersHere() found by matching braces, so indentation does not matter.
    const open = providerCode.search(/keepLettersHere\(\)\s*\{/);
    expect(open).toBeGreaterThan(-1);
    let depth = 0;
    let end = providerCode.indexOf('{', open);
    for (let i = end; i < providerCode.length; i++) {
      if (providerCode[i] === '{') depth++;
      if (providerCode[i] === '}' && --depth === 0) {
        end = i;
        break;
      }
    }
    const handlerText = providerCode.slice(open, end + 1);
    // Claim only after adopt resolves true: confirm sits in the .then of adoptDeviceOnlyLocal, guarded by its result.
    expect(handlerText).toMatch(/adoptDeviceOnlyLocal\([^)]*\)\s*\.then\(\s*\(?(\w+)\)?\s*=>\s*\1\s*&&\s*confirmAccountClaim\(/);
    expect(providerCode.replace(handlerText, '')).not.toMatch(/confirmAccountClaim\b(?!,)/);
    // adoptDeviceOnlyLocal is used only by that handler (import + one call); adoptLocal only by local-claim.ts, on the two device-only stores.
    expect(refs('adoptDeviceOnlyLocal', [join('lib', 'auth', 'local-claim.ts')])).toEqual({ [provider]: 2 });
    expect(handlerText).toMatch(/adoptDeviceOnlyLocal\(/);
    expect(refs('adoptLocal')).toEqual({ [join('lib', 'auth', 'local-claim.ts')]: 2, [join('lib', 'days', 'index.ts')]: 1, [join('lib', 'moments', 'store.ts')]: 1 });
    // (a) keepLettersHere: the interface line and the handler in the provider, one use in the claim sheet; no effect, alias or pass-through.
    expect(refs('keepLettersHere')).toEqual({ [provider]: 2, [consent]: 1 });
    expect(code(join(src, consent))).toMatch(/onPress=\{\(\) => \{\s*haptic\('tap'\);\s*auth\.keepLettersHere\(\);\s*\}\}/);
    // (b) takeOwnership runs only from the sync wiring (the released-session listener and the engine start), each import plus one call.
    expect(refs('takeOwnership', [join('lib', 'sync', 'ownership.ts')])).toEqual({ [join('lib', 'sync', 'index.ts')]: 2, [join('lib', 'sync', 'engine.ts')]: 2 });
  });
});
