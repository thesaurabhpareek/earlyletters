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
import { authReducer, authUserId, initialAuthState } from '../src/lib/auth/machine.logic';
import { pendingCount, readSetting, SYNC_SETTING } from '../src/lib/sync/outbox';
import { AccountMismatchError, takeOwnership } from '../src/lib/sync/ownership';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';

vi.mock('expo/fetch', () => ({ fetch: vi.fn(() => Promise.reject(new Error('no network in tests'))) }));
// BL-1559: the days and moments files run for real on a disk laid out as the phone has it (as in days-store.test.ts).
const fsh = vi.hoisted(() => ({ disk: null as unknown as Disk, excluded: new Set<string>() }));
vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => fsh.disk);
  const { move } = fs.File.prototype;
  fs.File.prototype.move = async function (this: { uri: string }, to: { uri: string }, o?: { overwrite?: boolean }) {
    await move.call(this, to, o);
    if (fsh.excluded.delete(this.uri)) fsh.excluded.add(to.uri); // a rename keeps the backup attribute on iOS
  };
  return fs;
});
vi.mock('../modules/scribe-files', () => ({
  ScribeFiles: {
    setExcludedFromBackup: (uri: string, on: boolean) => (on ? fsh.excluded.add(uri) : fsh.excluded.delete(uri)),
    isExcludedFromBackup: (uri: string) => fsh.excluded.has(uri),
  },
}));
// The provider's session hook ends reminders after the device-only files; only the notification side is stubbed.
vi.mock('../src/lib/reminders/scheduler', () => ({ forgetReminders: async () => {} }));
// lib/store loads with the binding (moments wipes) and the session hook; as in reminders-session.test.ts, no native module.
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) }, Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

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

/**
 * BL-1559 (NS-47-R7, E73, E-S24; CPO-30, CDO-24): the device-only days and moments files through the whole claim
 * step, with the real auth store, the real owner binding (local-claim.ts), the real stores on a stand-in disk and the
 * provider's session-end hook (settleReminderSession). The provider itself is not rendered: its two steps are run in
 * its order (Keep: adoptDeviceOnlyLocal, then confirmAccountClaim on true; sign-out: the reducer's SIGNED_OUT, then
 * the session hook on the user id going from the account to null). Its source is pinned by the SOURCE test above.
 * Mutant (run by hand, see the PR): readDays or readMoments skipping the owner comparison lets the second account
 * read the first account's file, which the second-account case catches.
 */
describe('[BL-1559] the device-only files through the claim step', () => {
  const DAY = 'seasonal.synthetic-day';
  const MOMENT = '2026-10-03';
  let db: SqlDb;
  beforeEach(() => {
    db = parentsPhone();
    fsh.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-CLAIM0000001'));
    fsh.excluded = new Set();
  });

  async function phone(readers: { owner: () => string | null; hasLocalData: () => boolean }) {
    vi.resetModules();
    const store: Store = await import('../src/lib/auth/auth-store');
    const claim = await import('../src/lib/auth/local-claim');
    const days = await import('../src/lib/days');
    const moments = await import('../src/lib/moments');
    const daysFile = await import('../src/lib/days/store-file');
    const momentsFile = await import('../src/lib/moments/store-file');
    const { settleReminderSession } = await import('../src/lib/reminders/session');
    claim.bindDeviceOnlyOwners(); // mounted with the provider, before any session is released
    store.onSignedIn((userId) => {
      try {
        takeOwnership(db, userId, ctx);
      } catch (e) {
        if (!(e instanceof AccountMismatchError)) throw e;
      }
    });
    store.setClaimReaders(readers);
    let state: AuthState = initialAuthState;
    let sessionUser: string | null = null;
    const send = async (...events: AuthEvent[]) => {
      for (const e of events) {
        state = authReducer(state, e);
        store.publishAuth(state);
        if (state.status === 'restoring') continue; // the provider's hook waits for the Keychain read to settle
        const next = authUserId(state);
        if (next !== sessionUser) {
          const before = sessionUser;
          sessionUser = next;
          await settleReminderSession(before, next); // the provider's hook on the signed-in user id
        }
      }
    };
    const signIn = (userId: string) =>
      send({ type: 'SIGNED_IN', userId, method: 'apple' }, { type: 'GATE_LOADED', gate: CONSENTED, sensitiveDeclined: false });
    const signOut = () => send({ type: 'SIGN_OUT_REQUESTED', reason: 'switch_account', pendingUploads: 0 }, { type: 'SIGNED_OUT' });
    // "Keep in this account", in the provider's order: adopt both files, and confirm only when that resolved true.
    const keep = async (userId: string) => (await claim.adoptDeviceOnlyLocal(userId)) && store.confirmAccountClaim(userId);
    const seedLocal = async () => {
      const ticked = days.createDaysStore(() => daysFile.expoDaysPort(), 'local');
      expect(await ticked.tickDay(DAY)).toEqual({ ok: true });
      const marked = moments.createMomentsStore(() => momentsFile.expoMomentsPort(), 'local');
      expect(await marked.addDayKey(MOMENT)).toEqual({ ok: true });
    };
    const onDisk = () => ({
      days: daysFile.readDays(daysFile.expoDaysPort()!, 'local'),
      moments: momentsFile.readMoments(momentsFile.expoMomentsPort()!, 'local'),
      daysOwner: rawOwner(daysFile.expoDaysPort()!, daysFile.DAYS_FILE),
      momentsOwner: rawOwner(momentsFile.expoMomentsPort()!, momentsFile.MOMENTS_FILE),
    });
    const rawOwner = (port: { exists(n: string): boolean; read(n: string): string }, name: string) =>
      port.exists(name) ? (JSON.parse(port.read(name)) as { owner: string }).owner : null;
    await send({ type: 'RESTORED', userId: null });
    return { store, claim, days, moments, signIn, signOut, keep, seedLocal, onDisk };
  }

  const lettersHere = (d: () => SqlDb) => ({ owner: () => readSetting(d(), SYNC_SETTING.owner), hasLocalData: () => phoneHoldsAnyRow(d()) });

  it('[E73] a first sign-in that is not a claim deletes both local files, and the account starts empty', async () => {
    const p = await phone({ owner: () => null, hasLocalData: () => false }); // no letters here: no claim screen (CPO-30 Q1)
    await p.seedLocal();
    expect(p.onDisk()).toMatchObject({ daysOwner: 'local', momentsOwner: 'local' });
    await p.signIn(PARENT);
    expect(p.store.accountClaimPending()).toBe(false);
    expect(p.onDisk()).toMatchObject({ daysOwner: null, momentsOwner: null, days: { state: 'empty' }, moments: { state: 'empty' } });
    expect(p.days.loadDays()).toEqual({ state: 'empty' });
    expect(p.moments.momentsStore.load()).toEqual({ state: 'empty' });
  });

  it('[E-S24] Keep in this account re-keys both files to the account, unchanged, and the account reads them', async () => {
    const p = await phone(lettersHere(() => db));
    await p.seedLocal();
    await p.signIn(PARENT);
    expect(p.store.accountClaimPending()).toBe(true);
    expect(p.onDisk()).toMatchObject({ daysOwner: 'local', momentsOwner: 'local' }); // waiting on the choice: nothing moved
    await p.keep(PARENT);
    expect(p.store.accountClaimPending()).toBe(false);
    const key = p.claim.ownerKey(PARENT);
    expect(p.onDisk()).toMatchObject({ daysOwner: key, momentsOwner: key });
    expect(p.days.loadDays()).toMatchObject({ state: 'ok', file: { owner: key, ticked: { [DAY]: {} } } });
    expect(p.moments.momentsStore.load()).toMatchObject({ state: 'ok', file: { owner: key, dayKeys: [MOMENT] } });
    expect(owner(db)).toBe(PARENT); // the letters went with the same choice
  });

  it('[CPO-30] Not my account, then sign-out: both local files stay byte for byte, and the phone is as it was', async () => {
    const p = await phone(lettersHere(() => db));
    await p.seedLocal();
    const before = p.onDisk();
    await p.signIn(PARENT);
    expect(p.store.accountClaimPending()).toBe(true);
    await p.signOut(); // notMyAccount(): SIGN_OUT_REQUESTED (switch_account, 0 pending), then the session ends
    expect(p.store.currentAuthUserId()).toBeNull();
    expect(p.onDisk()).toEqual(before);
    expect(p.days.loadDays()).toMatchObject({ state: 'ok', file: { owner: 'local', ticked: { [DAY]: {} } } });
    expect(p.moments.momentsStore.load()).toMatchObject({ state: 'ok', file: { owner: 'local', dayKeys: [MOMENT] } });
    expect(owner(db)).toBeNull();
  });

  it('[NS-47-R7] a second account sees empty: after A keeps and signs out, B signing in reads nothing of A', async () => {
    const p = await phone(lettersHere(() => db));
    await p.seedLocal();
    await p.signIn(PARENT);
    await p.keep(PARENT);
    await p.signOut(); // A's adopted (owner-keyed) files go at sign-out (BL-1598)
    expect(p.onDisk()).toMatchObject({ daysOwner: null, momentsOwner: null });
    const B = '0192f0aa-0000-7000-8000-0000000000c3';
    await p.signIn(B);
    expect(p.days.loadDays()).toEqual({ state: 'empty' });
    expect(p.moments.momentsStore.load()).toEqual({ state: 'empty' });
    expect(p.onDisk()).toMatchObject({ daysOwner: null, momentsOwner: null });
  });
});
