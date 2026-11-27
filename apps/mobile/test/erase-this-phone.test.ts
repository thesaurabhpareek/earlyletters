/// <reference types="node" />
/**
 * Erase everything on a signed-in phone, the "Erase this phone only" choice (F17-REQ-026, F17-U38; BL-559 part 3):
 * the outbox drains to the server first, then the phone is wiped and signed out, the server is not asked to change
 * anything, and signing in again brings the letters back and the free-letter count reads them again (F14-REQ-023).
 *
 * The phone is the real store over node:sqlite with the app's migrations; the sync engine talks to PGlite with every
 * file in supabase/migrations (helpers/sync-server.ts), as test/account-purge-phone.test.ts does. The sign-out is the
 * session provider's F02 guard as its own reducer runs it (machine.logic.ts authReducer and signOutWouldWait); the
 * provider's React effects are not rendered, so "the upload queue drained" is this test running the engine's sync and
 * then UPLOADS_DRAINED, as the provider's drained listener does. The wipe is store.eraseThisPhoneLocal and
 * finishEraseEverything; the device files and Keychain steps around it (lib/erase-everything.ts) are proven for the
 * signed-out erase in erase-all.test.ts and are the same calls.
 *
 * Mutants each test was checked against (each one turned a test here red when it was made):
 *  M1 store.ts eraseThisPhoneLocal: the drained check removed (wipes whatever is queued);
 *  M2 erase-this-phone.logic.ts: the wipe started without waiting for the sign-out (the drain);
 *  M3 erase-this-phone.logic.ts: the blockers check removed (signs out and refuses later);
 *  M4 wipe.ts onlyOnThisPhone: a letter's own sync state not read (a letter the server refused counted as on it);
 *  M5 wipe.ts onlyOnThisPhone: the drafts clause removed;
 *  M6 erase-this-phone.logic.ts: 'stayed' read as signed out;
 *  M7 store.ts eraseEverythingLocal: a signed-in phone let through (the signed-out flow changed);
 *  M8 store.ts eraseThisPhoneAllowed: the outbox-empty check removed (a queued delete wiped unsent);
 *  M9 wipe.ts onlyOnThisPhone: the conflict-copy clause removed;
 *  M10 store.ts eraseThisPhoneBlockers: the term for queued ops the drain does not send removed;
 *  M11 wipe.ts onlyOnThisPhone: the recordings and pictures clause removed.
 * The lib/erase-everything.ts eraseThisPhone wrapper (Keychain, reminders) is held in erase-all.test.ts.
 * Not seen on a phone: real Supabase Auth, the Keychain, the React provider. Fictional family "Asha" only (CLAUDE.md).
 */
import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { authReducer, signOutWouldWait, type AuthState, type AuthEvent } from '../src/lib/auth/machine.logic';
import { authOutcome, eraseThisPhoneOnly, type EraseThisPhoneDeps } from '../src/lib/erase-this-phone.logic';
import type { RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { startSyncServer, type SyncServer } from './helpers/sync-server';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.setConfig({ testTimeout: 60_000 });

const clock = { t: Date.parse('2026-11-20T09:00:00.000Z') };
const iso = () => new Date(clock.t).toISOString();

function uuid7(ms = clock.t): string {
  const b = randomBytes(16);
  let t = BigInt(ms);
  for (let i = 5; i >= 0; i--) {
    b[i] = Number(t & 0xffn);
    t >>= 8n;
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type Store = typeof import('../src/lib/store');
let server: SyncServer;
let users: string[] = [];
let store: Store;
let db: SqlDb;
let uid = '';
let calls: string[] = [];

const newUser = () => `0192f0aa-0000-7000-8000-${String(users.length + 1).padStart(12, '0')}`;

function engine() {
  const inner = server.serverFor(uid);
  const supabase: SupabaseLike = {
    rpc(fn: string, args?: Record<string, unknown>): PromiseLike<RpcResult> {
      calls.push(fn);
      return inner.rpc(fn, args);
    },
  };
  return import('../src/lib/sync/engine').then(({ createSyncEngine }) =>
    createSyncEngine({
      db: store.localSqlDb(), supabase, userId: uid, newId: () => uuid7(), now: () => clock.t, random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
    }),
  );
}

async function signIn(): Promise<void> {
  const e = await engine();
  expect(e.start()).not.toBeNull();
  await e.sync();
}

function writeLetter(childId: string, text: string): string {
  clock.t += 5_000;
  const d = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  const child = store.getChild(childId)!;
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true,
    soundsLikeMe: null, childId, authorSignsAs: child.signsAs, audioUri: null,
  });
  return d.id;
}

const outboxRows = () => db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n;
const localLetters = () => db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')!.n;
const serverLetters = async () =>
  Number((await server.sys('select count(*)::int n from entries where author_id = $1', [uid])).rows[0].n);
const serverRows = async () =>
  (await server.sys('select id, child_id, final_text, deleted_at from entries where author_id = $1 order by id', [uid])).rows;
/** Every row of every table on the phone. */
function phoneRows(): number {
  const tables = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").map((r) => r.name);
  return tables.reduce((n, t) => n + db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM "${t}"`)!.n, 0);
}

/**
 * The session provider's sign-out, over its own reducer: `signOut` reads the queue and asks the reducer; the drain is
 * the engine's sync, then UPLOADS_DRAINED; then the local Supabase sign-out and SIGNED_OUT. `drain: false` is a guard
 * that does not wait (or a session lost mid-wait): the session ends with the queue as it is.
 */
function provider(opts: { drain: boolean; stayWhileWaiting?: boolean }) {
  let state: AuthState = { status: 'ready', userId: uid, sync: 'on' };
  const listeners = new Set<(s: AuthState) => void>();
  const dispatch = (e: AuthEvent) => {
    state = authReducer(state, e);
    listeners.forEach((l) => l(state));
  };
  const log: string[] = [];
  const pending = () => ({ kind: 'count' as const, n: store.localSqlDb().get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n });
  return {
    log,
    whenSignedOut: () => authOutcome((l) => (listeners.add(l), () => listeners.delete(l)), () => state),
    async signOut(): Promise<'done' | 'waiting'> {
      const waits = signOutWouldWait(state, pending());
      dispatch({ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: pending() });
      void (async () => {
        if (opts.stayWhileWaiting && waits) {
          dispatch({ type: 'SIGN_OUT_WAIT_CANCELLED' });
          return;
        }
        if (opts.drain && waits) {
          await (await engine()).sync();
          log.push('drained');
          dispatch({ type: 'UPLOADS_DRAINED' });
        }
        if (!opts.drain) dispatch({ type: 'SESSION_LOST' });
        else {
          log.push('session removed');
          dispatch({ type: 'SIGNED_OUT' });
        }
      })();
      return waits ? 'waiting' : 'done';
    },
  };
}

function deps(p: ReturnType<typeof provider>, over: Partial<EraseThisPhoneDeps> = {}): EraseThisPhoneDeps & { erased: number } {
  const d = {
    erased: 0,
    signedIn: () => true,
    blockers: () => store.eraseThisPhoneBlockers(),
    signOut: () => p.signOut(),
    onWaiting: () => p.log.push('waiting'),
    whenSignedOut: () => p.whenSignedOut(),
    erase: async () => {
      d.erased++;
      p.log.push('erase');
      const r = store.eraseThisPhoneLocal(() => {}, () => {});
      if (r === 'erased') store.finishEraseEverything();
      return r;
    },
    ...over,
  };
  return d;
}

beforeAll(async () => {
  server = await startSyncServer({ users: Array.from({ length: 18 }, (_, i) => `0192f0aa-0000-7000-8000-${String(i + 1).padStart(12, '0')}`), protocol: 'v1' });
  await server.consent(...Array.from({ length: 18 }, (_, i) => `0192f0aa-0000-7000-8000-${String(i + 1).padStart(12, '0')}`));
}, 180_000);

let ASHA = '';

beforeEach(async () => {
  await server.sys('delete from sync_rate_windows');
  uid = newUser();
  users.push(uid);
  calls = [];
  vi.resetModules();
  store = (await import('../src/lib/store')) as Store;
  (await import('../src/lib/capabilities')).setServerFeaturesForTests(true);
  db = nodeDb().db;
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: iso, newId: (at?: number) => uuid7(at ?? clock.t) }).ok).toBe(true);
});

/** A signed-in phone with 5 of Asha's letters on the server and 2 more written since, still queued. */
async function phoneWithTwoQueued(): Promise<string[]> {
  ASHA = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  for (let i = 0; i < 5; i++) writeLetter(ASHA, `Asha letter ${i + 1}.`);
  await signIn();
  expect(await serverLetters()).toBe(5);
  expect(outboxRows()).toBe(0);
  const queued = [writeLetter(ASHA, 'You found the moon tonight.'), writeLetter(ASHA, 'You said dog twice.')];
  expect(outboxRows()).toBe(2);
  return queued;
}

describe('[F17-REQ-026] Erase this phone only on a signed-in phone', () => {
  it('[F17-U38] both queued ops reach the server first, then the phone is empty and signed out, the server unchanged, and signing in again brings the letters back with the count at least 5', async () => {
    const queued = await phoneWithTwoQueued();
    const p = provider({ drain: true });
    const d = deps(p);

    expect(await eraseThisPhoneOnly(d)).toBe('erased');

    // Both ops reached the server before anything was erased, and the guard said it was sending them.
    expect(p.log).toEqual(['waiting', 'drained', 'session removed', 'erase']);
    expect(await serverLetters()).toBe(7);
    const onServer = (await serverRows()).map((r) => r.id);
    for (const id of queued) expect(onServer).toContain(id);
    // The local store is empty: every row of every table, settings included (the erase mark too).
    expect(phoneRows()).toBe(0);
    expect(store.eraseEverythingPending()).toBe(false);
    // The wipe asked the server for nothing, and the server rows are as the drain left them.
    const after = await serverRows();
    const callsAtWipe = calls.length;
    expect(after).toHaveLength(7);
    expect(after.every((r) => r.deleted_at === null)).toBe(true);

    // Signing in again: the letters return and the free-letter count reads them (healed, never 0).
    await signIn();
    expect(calls.length).toBeGreaterThan(callsAtWipe);
    expect(localLetters()).toBe(7);
    expect(store.ledgerDb().counts().present).toBeGreaterThanOrEqual(5);
    expect(await serverRows()).toEqual(after);
  });

  it('a sign-out that ends with the queue not drained (session lost, or a guard that did not wait) erases nothing', async () => {
    await phoneWithTwoQueued();
    const p = provider({ drain: false });
    expect(await eraseThisPhoneOnly(deps(p))).toBe('not_drained');
    expect(outboxRows()).toBe(2);
    expect(localLetters()).toBe(7);
    expect(store.eraseEverythingPending()).toBe(false);
    expect(await serverLetters()).toBe(5);
  });

  it('Stay signed in while the outbox drains: nothing is erased and the wipe is never started', async () => {
    await phoneWithTwoQueued();
    const p = provider({ drain: true, stayWhileWaiting: true });
    const d = deps(p);
    expect(await eraseThisPhoneOnly(d)).toBe('stayed');
    expect(d.erased).toBe(0);
    expect(localLetters()).toBe(7);
    expect(outboxRows()).toBe(2);
  });

  it('a book the server refused holds letters only here: stops before signing out, nothing changed', async () => {
    await phoneWithTwoQueued();
    const nova = store.addChild({ name: 'Nova', birthday: '2026-05-01', dueDate: null, signsAs: 'Mama' }).id;
    writeLetter(nova, 'Nova kicked all night.');
    db.run("UPDATE children SET server_state = 'refused' WHERE id = ?", nova);
    const p = provider({ drain: true });
    const signOut = vi.fn(p.signOut);
    expect(await eraseThisPhoneOnly(deps(p, { signOut }))).toBe('only_here');
    expect(signOut).not.toHaveBeenCalled();
    expect(localLetters()).toBe(8);
  });

  it('a letter the server refused (its op is gone from the queue, its words only here): stops before signing out', async () => {
    const queued = await phoneWithTwoQueued();
    await (await engine()).sync();
    expect(outboxRows()).toBe(0);
    db.run("UPDATE entries SET sync_state = 'rejected' WHERE id = ?", queued[0]);
    const p = provider({ drain: true });
    const signOut = vi.fn(p.signOut);
    expect(await eraseThisPhoneOnly(deps(p, { signOut }))).toBe('only_here');
    expect(signOut).not.toHaveBeenCalled();
    expect(store.eraseThisPhoneLocal(() => {}, () => {})).toBe('not_drained');
    expect(localLetters()).toBe(7);
  });

  it('a draft never held (its words are on this phone only): stops before signing out, and the wipe refuses it too', async () => {
    await phoneWithTwoQueued();
    store.createDraft({ childId: ASHA, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Half a letter' });
    const p = provider({ drain: true });
    const signOut = vi.fn(p.signOut);
    expect(await eraseThisPhoneOnly(deps(p, { signOut }))).toBe('only_here');
    expect(signOut).not.toHaveBeenCalled();
    await (await engine()).sync();
    expect(outboxRows()).toBe(0);
    expect(store.eraseThisPhoneLocal(() => {}, () => {})).toBe('not_drained');
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM drafts')!.n).toBe(1);
  });
});

/** A signed-in phone with every letter on the server and nothing queued. */
async function drainedPhone(): Promise<string[]> {
  const queued = await phoneWithTwoQueued();
  await (await engine()).sync();
  expect(outboxRows()).toBe(0);
  expect(store.eraseThisPhoneBlockers()).toBe(0);
  return queued;
}

/** Stops before signing out (only_here), and the wipe after a sign-out refuses it too; nothing is erased. */
async function expectOnlyHere(): Promise<void> {
  const p = provider({ drain: true });
  const signOut = vi.fn(p.signOut);
  const audio = vi.fn();
  expect(await eraseThisPhoneOnly(deps(p, { signOut }))).toBe('only_here');
  expect(signOut).not.toHaveBeenCalled();
  expect(store.eraseThisPhoneLocal(audio, () => {})).toBe('not_drained');
  expect(audio).not.toHaveBeenCalled();
  expect(localLetters()).toBe(7);
}

describe('[F17-REQ-026] what the server never holds stops Erase this phone only', () => {
  it('a recording of a synced letter (the server holds the words, never the recording)', async () => {
    const [id] = await drainedPhone();
    db.run('UPDATE entries SET audio_uri = ? WHERE id = ?', 'file:///phone/Documents/recording-asha.m4a', id);
    await expectOnlyHere();
  });

  it('a picture kept with a synced letter (pictures never leave the phone, ADR 0028)', async () => {
    const [id] = await drainedPhone();
    db.run(
      "INSERT INTO entry_media (id, entry_id, kind, ext, bytes, sha256, added_at) VALUES (?, ?, 'photo', 'jpg', 1000, ?, ?)",
      uuid7(), id, 'ab'.repeat(32), iso(),
    );
    await expectOnlyHere();
  });

  it('a held draft\'s recording, and a recording found with no row', async () => {
    await drainedPhone();
    const d = store.createDraft({ childId: ASHA, captureMode: 'spoken', promptKey: null, audioUri: 'file:///phone/Documents/recording-held.m4a', audioDurationMs: 4000 });
    db.run('UPDATE drafts SET held_v = 1 WHERE id = ?', d.id);
    await expectOnlyHere();
    db.run('DELETE FROM drafts');
    expect(store.eraseThisPhoneBlockers()).toBe(0);
    db.run("INSERT INTO orphan_audio (file_name, found_at) VALUES ('recording-found.m4a', ?)", iso());
    await expectOnlyHere();
  });

  it('a conflict copy (this phone\'s words the server did not take)', async () => {
    const [id] = await drainedPhone();
    db.run(
      "INSERT INTO rejected_writes (op_id, type, entity_id, payload, code, rejected_at) VALUES (?, 'entry.upsert', ?, '{}', 'conflict', ?)",
      uuid7(), id, iso(),
    );
    await expectOnlyHere();
  });

  it('a queued op the drain does not send (an erase waiting for a server that can erase)', async () => {
    await drainedPhone();
    db.run(
      "INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at, next_attempt_at) VALUES (?, 2, 'entry.erase', ?, '{}', ?, '2999-01-01T00:00:00.000Z')",
      uuid7(), uuid7(), iso(),
    );
    await expectOnlyHere();
    expect(outboxRows()).toBe(1);
  });

  it('a queued delete of a synced letter (no live row shows it) with a sign-out that does not drain: nothing is erased', async () => {
    const [id] = await drainedPhone();
    expect(store.deleteEntry(id)).toBe(true);
    expect(outboxRows()).toBe(1);
    expect(store.eraseThisPhoneBlockers()).toBe(0);
    expect(await eraseThisPhoneOnly(deps(provider({ drain: false })))).toBe('not_drained');
    expect(outboxRows()).toBe(1);
    expect(localLetters()).toBe(7);
  });
});

describe('[DATA-REQ-024] a phone that never signed in behaves as before', () => {
  it('Erase this phone only is not its flow; Erase everything still erases it and still refuses a signed-in phone', async () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    writeLetter(asha, 'Asha letter.');
    const erase = vi.fn(async () => 'erased' as const);
    const signOut = vi.fn(async () => 'done' as const);
    expect(await eraseThisPhoneOnly({ signedIn: () => false, blockers: () => 0, signOut, whenSignedOut: async () => 'signed_out', erase })).toBe('not_signed_in');
    expect(erase).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
    expect(store.localDeletionAllowed()).toBe(true);
    expect(store.eraseEverythingLocal(() => {}, () => {})).toBe('erased');
    store.finishEraseEverything();
    expect(phoneRows()).toBe(0);
  });

  it('a phone that signed in and drained is still refused by the signed-out Erase everything', async () => {
    await phoneWithTwoQueued();
    await (await engine()).sync();
    expect(outboxRows()).toBe(0);
    expect(store.localDeletionAllowed()).toBe(false);
    expect(store.eraseEverythingLocal(() => {}, () => {})).toBe('signed_in');
    expect(localLetters()).toBe(7);
  });
});

describe('authOutcome', () => {
  const states = (seq: AuthState[]) => {
    let l: ((s: AuthState) => void) | null = null;
    const out = authOutcome((x) => ((l = x), () => (l = null)), () => ({ status: 'ready', userId: 'u', sync: 'on' }));
    seq.forEach((s) => l?.(s));
    return out;
  };
  const waiting: AuthState = { status: 'signingOut', userId: 'u', reason: 'user', waitingForUploads: true, sync: 'on' };
  it('signed out at the first signed-out state; stayed only after a sign-out began', async () => {
    expect(await states([waiting, { status: 'signedOut' }])).toBe('signed_out');
    expect(await states([waiting, { status: 'ready', userId: 'u', sync: 'on' }])).toBe('stayed');
    expect(await states([{ status: 'ready', userId: 'u', sync: 'on' }, waiting, { status: 'signedOut', error: 'session_expired' }])).toBe('signed_out');
  });
});
