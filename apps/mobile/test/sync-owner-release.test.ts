/// <reference types="node" />
/**
 * An empty phone forgets its owner at the final sign-out (CTO ruling, option 1 tightened).
 *
 * The hole: the first account to sign in on a phone becomes its sticky owner (sync.ownerId), even
 * when the phone held nothing. After "Use another account", the next account's local book is queued
 * with created_by = the old owner, and when the old owner signs in again their engine uploads it.
 * releaseOwnerIfEmpty (lib/sync/ownership.ts), called from startSync on the final signedOut, lets
 * the next account claim an empty phone instead. A phone that holds ANY row (phoneHoldsAnyRow) or
 * any queued op keeps the sticky owner: that path is still open until the F16 section 6 screen.
 *
 * Real modules over node:sqlite; only natives and the network are stubbed. The accounts are ids,
 * the family is the fictional family "Asha" (CLAUDE.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { authReducer, type AuthEvent, type AuthState } from '../src/lib/auth/machine.logic';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const h = vi.hoisted(() => ({
  noRelease: false,
  releases: [] as boolean[],
  rpc: vi.fn(),
  createSyncEngine: vi.fn(),
  failRun: null as ((sql: string, params: unknown[]) => boolean) | null,
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { startAutoRefresh: () => {}, stopAutoRefresh: () => {} }, rpc: h.rpc }),
}));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: vi.fn(() => ({ remove: vi.fn() })) }, Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('expo-crypto', async () => {
  const { randomBytes } = await import('node:crypto');
  return { getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) };
});
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/sync/engine', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/sync/engine')>();
  h.createSyncEngine.mockImplementation(real.createSyncEngine);
  return { ...real, createSyncEngine: h.createSyncEngine };
});
// The control run switches the release off; every call and its answer is recorded.
vi.mock('../src/lib/sync/ownership', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/sync/ownership')>();
  return {
    ...real,
    releaseOwnerIfEmpty: (db: SqlDb) => {
      if (h.noRelease) return false;
      const r = real.releaseOwnerIfEmpty(db);
      h.releases.push(r);
      return r;
    },
  };
});

const store = await import('../src/lib/store');
const caps = await import('../src/lib/capabilities');
const auth = await import('../src/lib/auth/auth-store');
const sync = await import('../src/lib/sync');
const { releaseOwnerIfEmpty, takeOwnership } = await vi.importActual<typeof import('../src/lib/sync/ownership')>('../src/lib/sync/ownership');
const { phoneHoldsAnyRow } = await import('../src/lib/auth/account-claim.logic');
const { SYNC_SETTING, readSetting, writeSetting, appendOp } = await import('../src/lib/sync/outbox');

const A = '11111111-1111-1111-1111-111111111111'; // Mama
const B = '22222222-2222-2222-2222-222222222222'; // Papa, signs in on the same phone later
const OWNER = SYNC_SETTING.owner;
const CURSOR = SYNC_SETTING.heldCursor;
const AT = '2026-10-15T09:00:00.000Z';
let seq = 0;
const now = () => AT;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
const ctx = () => ({ now: AT, newId });

let raw: SqlDb;
let close: () => void = () => {};

beforeEach(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
  vi.clearAllMocks();
  h.noRelease = false;
  h.releases = [];
  h.failRun = null;
  auth.resetAuthStoreForTests();
  store.closeStore();
  const n = nodeDb();
  const wrapped: SqlDb = {
    ...n.db,
    run: (sql, ...params) => {
      if (h.failRun?.(sql, params)) throw new Error('injected_failure');
      n.db.run(sql, ...params);
    },
  };
  raw = wrapped;
  close = n.close;
  expect(store.openStore({ open: () => ({ db: wrapped, close: () => {} }), now, newId }).ok).toBe(true);
  // As the session provider registers them: the owner, and whether the phone holds anything.
  auth.setClaimReaders({ owner: () => store.currentUserId(), hasLocalData: () => phoneHoldsAnyRow(raw) });
  caps.setServerFeaturesForTests(true);
  sync.setSyncKillSourceForTests({ killed: () => false, subscribe: () => () => {} });
});
afterEach(() => {
  caps.setServerFeaturesForTests(null);
  store.closeStore();
  close();
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

// ── The account store, driven by the real reducer ─────────────────────────
let state: AuthState = { status: 'restoring' };
function send(...events: AuthEvent[]): AuthState {
  for (const e of events) {
    state = authReducer(state, e);
    auth.publishAuth(state);
  }
  return state;
}
const GATE = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
/** Restored or fresh sign-in, consent complete: `ready` with sync on. */
function signIn(userId: string): void {
  if (state.status === 'restoring') send({ type: 'RESTORED', userId: null });
  send({ type: 'SIGNED_IN', userId, method: 'apple' }, { type: 'GATE_LOADED', gate: GATE, sensitiveDeclined: false });
}
const signOut = (reason: 'user' | 'force_reauth' | 'apple_revoked' = 'user') =>
  send({ type: 'SIGN_OUT_REQUESTED', reason, pendingUploads: 0 }, { type: 'SIGNED_OUT' });
beforeEach(() => {
  state = { status: 'restoring' };
});

// ── The network: every call tagged with the account that was signed in ────
interface Call { user: string | null; fn: string; args: Record<string, unknown> }
let calls: Call[] = [];
beforeEach(() => {
  calls = [];
  h.rpc.mockImplementation((fn: string, args: Record<string, unknown> = {}) => {
    const user = state.status === 'ready' || state.status === 'signingOut' ? state.userId : null;
    calls.push({ user, fn, args: JSON.parse(JSON.stringify(args)) });
    return Promise.resolve(fn === 'sync_push'
      ? { data: { results: (args.p_ops as { op: string }[]).map((o) => ({ op: o.op, ok: true })), paused: false, stopped: false }, error: null, status: 200 }
      : { data: { reset: false, epoch: 1, epoch_started_at: AT, books: [], gone: [], more: false }, error: null, status: 200 });
  });
});
const pushesBy = (user: string, from = 0) => calls.slice(from).filter((c) => c.user === user && c.fn === 'sync_push');
const opsOf = (cs: Call[]) => cs.flatMap((c) => c.args.p_ops as { type: string; id: string }[]);
async function until(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 100 && !cond(); i++) await new Promise((r) => setTimeout(r, 10));
}
const owner = () => readSetting(raw, OWNER);
const outbox = () => raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n;

// ── The full scenario ─────────────────────────────────────────────────────
/** A claims an empty phone, signs out, B signs in and starts a book, B signs out, A signs in again. */
async function runScenario(): Promise<{ bookId: string; fromA: number }> {
  const stop = sync.startSync();
  try {
    signIn(A); // nothing on the phone: no claim screen; the phone becomes A's
    expect(owner()).toBe(A);
    signOut();
    const afterA = calls.length;
    signIn(B);
    const bookId = store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Papa' }).id;
    await until(() => pushesBy(B, afterA).length > 0 || owner() !== B);
    signOut();
    const fromA = calls.length;
    signIn(A);
    await until(() => pushesBy(A, fromA).length > 0 || sync.getSyncStatus().phase === 'account_mismatch');
    await new Promise((r) => setTimeout(r, 30));
    return { bookId, fromA };
  } finally {
    stop();
  }
}

describe('a consent pause does not follow the phone to the next account', () => {
  it('A paused for consent, signs out of an empty phone; B signs in and B\'s engine is not paused_consent', async () => {
    const stop = sync.startSync();
    try {
      signIn(A);
      writeSetting(raw, SYNC_SETTING.pausedFor, 'terms'); // the server told A's engine to wait for consent
      expect(sync.getSyncStatus().phase).toBe('paused_consent');
      signOut();
      expect(owner()).toBeNull();
      signIn(B);
      await until(() => calls.some((c) => c.user === B));
      expect(readSetting(raw, SYNC_SETTING.pausedFor)).toBeNull();
      expect(sync.getSyncStatus().phase).not.toBe('paused_consent');
    } finally {
      stop();
    }
  });
});

describe('the full scenario: A claims an empty phone, "Use another account", B claims, A comes back', () => {
  it('with the release: B owns the phone, B\'s book is B\'s and goes up under B, A is refused and sends nothing', async () => {
    const { bookId, fromA } = await runScenario();
    expect(h.releases).toEqual([true, false]); // A's sign-out released; B's sign-out found B's book and kept
    expect(owner()).toBe(B);
    expect(raw.get<{ created_by: string; server_state: string }>('SELECT created_by, server_state FROM children WHERE id = ?', bookId))
      .toMatchObject({ created_by: B });
    const bPushes = pushesBy(B);
    expect(opsOf(bPushes).map((o) => [o.type, o.id])).toContainEqual(['book.create', bookId]);
    // A signing in again meets B's phone: sync_account_mismatch, no engine, no sync_push for A.
    expect(sync.getSyncStatus().phase).toBe('account_mismatch');
    expect(pushesBy(A, fromA)).toEqual([]);
    expect(calls.slice(fromA).filter((c) => c.user === A)).toEqual([]);
    // (An engine object may be built for A before the claim runs; its start() refuses on the owner, so it never calls.)
  });

  it('control, without the release: B\'s book is queued as A\'s and A\'s engine uploads it (the bug)', async () => {
    h.noRelease = true;
    const { bookId, fromA } = await runScenario();
    expect(owner()).toBe(A); // the sticky owner outlived A's sign-out
    expect(raw.get<{ created_by: string }>('SELECT created_by FROM children WHERE id = ?', bookId)).toMatchObject({ created_by: A });
    expect(pushesBy(B)).toEqual([]); // B never claimed, so B's engine never ran
    expect(opsOf(pushesBy(A, fromA)).map((o) => [o.type, o.id])).toContainEqual(['book.create', bookId]);
  });

  it('the existing mismatch assertion holds: a phone owned by one account refuses another at takeOwnership', () => {
    takeOwnership(raw, A, ctx());
    expect(() => takeOwnership(raw, B, ctx())).toThrow('sync_account_mismatch');
  });
});

// ── releaseOwnerIfEmpty on its own ────────────────────────────────────────
describe('releaseOwnerIfEmpty: only a phone with nothing on it forgets its owner', () => {
  const CHILD = '0199a5b0-1111-7000-8000-000000000001';
  const LETTER = '0199a5b0-2222-7000-8000-000000000001';
  function letter(deletedAt: string | null = null): void {
    raw.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id, deleted_at)
       VALUES (?, 'letter', '2026-10-14', ?, 'typed', 'verbatim', 2, 'Asha laughed.', '[]', 'Asha laughed.', 1, ?, NULL, ?, ?)`,
      LETTER, AT, AT, A, deletedAt,
    );
  }
  beforeEach(() => {
    writeSetting(raw, OWNER, A);
    writeSetting(raw, CURSOR, '42');
    writeSetting(raw, SYNC_SETTING.pausedFor, 'terms');
  });

  it('an empty phone also forgets the restore marker of the account that left', () => {
    writeSetting(raw, SYNC_SETTING.restoreAt, AT);
    expect(releaseOwnerIfEmpty(raw)).toBe(true);
    expect(readSetting(raw, SYNC_SETTING.restoreAt)).toBeNull();
  });

  it('a phone that keeps its owner keeps the restore marker too', () => {
    writeSetting(raw, SYNC_SETTING.restoreAt, AT);
    letter();
    expect(releaseOwnerIfEmpty(raw)).toBe(false);
    expect(readSetting(raw, SYNC_SETTING.restoreAt)).toBe(AT);
  });

  it('no owner: false, nothing written', () => {
    writeSetting(raw, OWNER, null);
    expect(releaseOwnerIfEmpty(raw)).toBe(false);
    expect(readSetting(raw, CURSOR)).toBe('42');
  });

  it('an empty phone: true, the owner and the held cursor are gone', () => {
    expect(releaseOwnerIfEmpty(raw)).toBe(true);
    expect(owner()).toBeNull();
    expect(readSetting(raw, CURSOR)).toBeNull();
    expect(readSetting(raw, SYNC_SETTING.pausedFor)).toBeNull(); // A's consent pause does not follow to B
    expect(releaseOwnerIfEmpty(raw)).toBe(false); // nothing left to release
  });

  const keeps: [string, () => void][] = [
    ['a live book', () => insertBook(raw, { id: CHILD, serverState: 'synced' })],
    ['a hidden book', () => {
      insertBook(raw, { id: CHILD, serverState: 'synced' });
      raw.run('UPDATE child_member_prefs SET hidden_at = ? WHERE child_id = ?', AT, CHILD);
    }],
    ['a book deleted on this phone (no live row, but a row)', () => {
      insertBook(raw, { id: CHILD, serverState: 'synced' });
      raw.run('UPDATE children SET hidden_at = ? WHERE id = ?', AT, CHILD);
    }],
    ['a letter only', () => letter()],
    ['a deleted letter only', () => letter(AT)],
    ['a refused book', () => insertBook(raw, { id: CHILD, serverState: 'refused' })],
    ['a held draft only', () => {
      raw.run(
        "INSERT INTO drafts (id, child_id, capture_mode, created_at, typed_text, state, held_kind) VALUES (?, ?, 'typed', ?, 'Asha found the big puddle.', 'ready', 'held_letter')",
        LETTER, CHILD, AT,
      );
    }],
  ];
  for (const [name, arrange] of keeps) {
    it(`keeps the owner and the cursor: ${name}`, () => {
      arrange();
      expect(phoneHoldsAnyRow(raw)).toBe(true);
      expect(releaseOwnerIfEmpty(raw)).toBe(false);
      expect(owner()).toBe(A);
      expect(readSetting(raw, CURSOR)).toBe('42');
      expect(readSetting(raw, SYNC_SETTING.pausedFor)).toBe('terms');
    });
  }

  it('keeps the owner with a queued upload and no rows at all', () => {
    appendOp(raw, { type: 'book.create', id: CHILD, data: { name: 'Asha' } }, ctx(), { bookId: CHILD });
    expect(phoneHoldsAnyRow(raw)).toBe(false);
    expect(outbox()).toBe(1);
    expect(releaseOwnerIfEmpty(raw)).toBe(false);
    expect(owner()).toBe(A);
    expect(readSetting(raw, CURSOR)).toBe('42');
  });

  it('is atomic: a write that fails after the owner is deleted leaves both settings as they were', () => {
    h.failRun = (sql, params) => sql.startsWith('DELETE FROM settings') && params[0] === CURSOR;
    expect(() => releaseOwnerIfEmpty(raw)).toThrow('injected_failure');
    expect(owner()).toBe(A);
    expect(readSetting(raw, CURSOR)).toBe('42');
  });
});

// ── Where the hook fires ──────────────────────────────────────────────────
describe('startSync releases only on the final signedOut after a session', () => {
  let stop: () => void = () => {};
  afterEach(() => stop());

  /** The phone is A's (an earlier session claimed it) and the auth machine is in `state`. */
  function ownedByA(): void {
    writeSetting(raw, OWNER, A);
  }

  it('a sign-out the person asked for', () => {
    ownedByA();
    stop = sync.startSync();
    signIn(A);
    signOut('user');
    expect(owner()).toBeNull();
    expect(h.releases).toEqual([true]);
  });

  it('forced re-authentication', () => {
    ownedByA();
    stop = sync.startSync();
    signIn(A);
    signOut('force_reauth');
    expect(owner()).toBeNull();
  });

  it('a session revoked elsewhere (refresh token rejected)', () => {
    ownedByA();
    stop = sync.startSync();
    signIn(A);
    send({ type: 'SESSION_LOST' });
    expect(state.status).toBe('signedOut');
    expect(owner()).toBeNull();
  });

  it('an Apple revocation', () => {
    ownedByA();
    stop = sync.startSync();
    signIn(A);
    signOut('apple_revoked');
    expect(owner()).toBeNull();
  });

  it('an under-18 answer at the age sheet', () => {
    ownedByA();
    stop = sync.startSync();
    send({ type: 'RESTORED', userId: null }, { type: 'SIGNED_IN', userId: A, method: 'apple' });
    send({
      type: 'GATE_LOADED',
      gate: { termsCurrent: true, ageAttested: false, sensitiveData: false, contentAllowed: false },
      sensitiveDeclined: false,
    });
    expect(state.status).toBe('needsConsent');
    send({ type: 'CONSENT_RECORDED', step: 'age', accepted: false });
    expect(state).toMatchObject({ status: 'signedOut', error: 'under_18' });
    expect(owner()).toBeNull();
  });

  it('a phone with a row keeps its owner through the same sign-out', () => {
    ownedByA();
    stop = sync.startSync();
    signIn(A);
    store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Mama' });
    signOut();
    expect(owner()).toBe(A);
    expect(h.releases).toEqual([false]);
  });

  it('restoring: the first answer "no session" at launch releases nothing', () => {
    ownedByA();
    stop = sync.startSync();
    expect(state.status).toBe('restoring');
    send({ type: 'RESTORED', userId: null });
    expect(state.status).toBe('signedOut');
    expect(owner()).toBe(A);
    expect(h.releases).toEqual([]);
  });

  it('cold start already signed out: later signedOut publishes release nothing', () => {
    ownedByA();
    state = { status: 'signedOut' };
    auth.publishAuth(state);
    stop = sync.startSync();
    auth.publishAuth({ status: 'signedOut' });
    auth.publishAuth({ status: 'signedOut', error: 'cancelled' as never });
    expect(owner()).toBe(A);
    expect(h.releases).toEqual([]);
  });

  it('cold start with a restored session, then a sign-out: that is a transition, and releases', () => {
    ownedByA();
    send({ type: 'RESTORED', userId: A });
    stop = sync.startSync();
    expect(state.status).toBe('checkingConsent');
    send({ type: 'GATE_LOADED', gate: GATE, sensitiveDeclined: false });
    signOut();
    expect(owner()).toBeNull();
  });

  it('fails closed: a store that throws keeps the owner and the listener keeps working', () => {
    ownedByA();
    stop = sync.startSync();
    signIn(A);
    h.failRun = (sql) => sql.startsWith('DELETE FROM settings');
    expect(() => signOut()).not.toThrow();
    expect(owner()).toBe(A);
    h.failRun = null;
    signIn(A);
    signOut();
    expect(owner()).toBeNull();
  });

  it('servers off: startSync wires nothing, and a sign-out releases nothing', () => {
    caps.setServerFeaturesForTests(false);
    ownedByA();
    const listeners = vi.spyOn(auth, 'subscribeAuth');
    stop = sync.startSync();
    expect(listeners).not.toHaveBeenCalled();
    signIn(A);
    signOut();
    expect(owner()).toBe(A);
    expect(h.releases).toEqual([]);
    listeners.mockRestore();
  });
});

describe('a sign-out that waits for uploads', () => {
  let stop: () => void = () => {};
  afterEach(() => stop());

  function waiting(): void {
    writeSetting(raw, OWNER, A);
    stop = sync.startSync();
    signIn(A);
    send({ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    expect(state).toMatchObject({ status: 'signingOut', waitingForUploads: true });
  }

  it('ready -> signingOut (waiting) -> signedOut: keeps the owner while it waits, and releases once when the uploads drain and the session ends', () => {
    waiting();
    expect(owner()).toBe(A);
    expect(h.releases).toEqual([]);
    send({ type: 'UPLOADS_DRAINED' });
    expect(state).toMatchObject({ status: 'signingOut', waitingForUploads: false });
    expect(owner()).toBe(A); // the machine is still signing out
    expect(h.releases).toEqual([]);
    send({ type: 'SIGNED_OUT' });
    expect(owner()).toBeNull();
    expect(h.releases).toEqual([true]);
  });

  it('keeps the owner when the person taps "Stay signed in"', () => {
    waiting();
    send({ type: 'SIGN_OUT_WAIT_CANCELLED' });
    expect(state.status).toBe('ready');
    expect(owner()).toBe(A);
    expect(h.releases).toEqual([]);
  });
});

// ── A page still on its way when the person signs out ─────────────────────
describe('a pull that lands after sign-out writes nothing', () => {
  const BOOK = '0199a5b0-3333-7000-8000-000000000001';
  const page = (id = BOOK) => ({
    data: {
      reset: false, epoch: 1, epoch_started_at: AT, more: false, gone: [],
      books: [{
        id, access: 'parent', repull: false, meta_hash: 'h1', cursor: 'c1', more: false, rows: [],
        meta: {
          role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2025-04-12', birthday_md: '04-12', due_date: null,
          family_can_read: false, created_by_me: true, my_signs_as: 'Mama', include_in_reminders: false, members: [],
        },
      }],
    },
    error: null, status: 200,
  });
  /** sync_pull waits until the test lets it answer; everything else answers at once. */
  function holdPull(): { release: () => void; started: () => boolean } {
    let go: () => void = () => {};
    let started = false;
    const gate = new Promise<void>((r) => { go = r; });
    const base = h.rpc.getMockImplementation()!;
    h.rpc.mockImplementation((fn: string, args: Record<string, unknown> = {}) => {
      if (fn !== 'sync_pull' || started) return base(fn, args); // only A's first pull is held
      started = true;
      return gate.then(() => page());
    });
    return { release: go, started: () => started };
  }
  const books = () => raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM children')!.n;

  it('A signs out of an empty phone with a pull in flight: the page is dropped, the phone stays empty and B claims it', async () => {
    const pull = holdPull();
    const stop = sync.startSync();
    try {
      signIn(A);
      await until(pull.started);
      expect(pull.started()).toBe(true);
      signOut();
      expect(owner()).toBeNull(); // the empty phone was released
      pull.release(); // A's answer lands now
      await new Promise((r) => setTimeout(r, 50));
      expect(books()).toBe(0); // A's book never reached the phone
      expect(phoneHoldsAnyRow(raw)).toBe(false);
      expect(owner()).toBeNull();
      signIn(B);
      await until(() => owner() === B);
      expect(owner()).toBe(B);
      expect(books()).toBe(0); // B sees nothing of A's
    } finally {
      stop();
    }
  });

  it('the page is dropped when another account is signed in by the time it lands (engine not yet stopped)', async () => {
    const pull = holdPull();
    const stop = sync.startSync();
    try {
      signIn(A);
      await until(pull.started);
      signOut();
      signIn(B);
      pull.release();
      await new Promise((r) => setTimeout(r, 50));
      expect(books()).toBe(0);
    } finally {
      stop();
    }
  });
});
