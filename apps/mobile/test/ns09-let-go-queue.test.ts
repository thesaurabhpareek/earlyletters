/// <reference types="node" />
/**
 * NS-09 Let it go, the half that talks to the server (BL-977, P-4b): a synced held draft that is let go
 * queues one held.discard that stays queued until the server answers (R7), is never sent under another
 * account (R11), is held for its account across a sign-out (R12), and waits out a kill switch while the
 * local delete still completes (R10). Real store facade and real engine over node:sqlite; the server is a fake
 * that records what is sent. This proves the stand-in only: whether production runs held sync is `sync`'s
 * answer (design U3, OQ-11). Fictional Asha family only.
 *
 * Mutants these tests were written to catch (each one failed a test here when it was made):
 *  R7  remove the op when it is sent, not when the answer comes (outbox.ts markSent deletes the row);
 *  R10 refuse the local let-go while serverFeaturesEnabled() is off (store.ts beginDiscard);
 *  R11 start() without the owner check (engine.ts start() does not set mismatch);
 *  R12 leave held.discard out of pendingCount (outbox.ts sendable() excludes it).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signOutWouldWait, type AuthState } from '../src/lib/auth/machine.logic';
import { setServerFeaturesForTests } from '../src/lib/capabilities';
import { createSyncEngine, type SyncEngine } from '../src/lib/sync/engine';
import { SYNC_SETTING, pendingCount, writeSetting } from '../src/lib/sync/outbox';
import type { PushOp, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } }));
vi.mock('expo-crypto', async () => {
  const { randomBytes } = await import('node:crypto');
  return { getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) };
});
vi.mock('expo-file-system', () => ({}));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const NOW = '2026-11-10T09:00:00.000Z';
let n = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++n).padStart(12, '0')}`;

let db: ReturnType<typeof nodeDb>['db'];
let closeDb: () => void;
let engine: SyncEngine | null = null;
let clock = Date.parse(NOW);

beforeEach(() => {
  clock = Date.parse(NOW);
  setServerFeaturesForTests(true);
  const h = nodeDb();
  db = h.db;
  closeDb = h.close;
  store.closeStore();
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => NOW, newId }).ok).toBe(true);
  insertBook(db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
  writeSetting(db, SYNC_SETTING.owner, MAMA);
  writeSetting(db, SYNC_SETTING.heldServer, '1'); // a server whose pull carried a held section
});
afterEach(() => {
  engine?.stop();
  engine = null;
  setServerFeaturesForTests(null);
  store.closeStore();
  closeDb();
});

/** A draft Mama held at the Keep gate, already on the server at version 800. */
function syncedHeldDraft(): string {
  const d = store.createDraft({ childId: 'c1', captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'You found the cat asleep.' });
  expect(store.holdDraft(d.id, { inBookChoice: true })).toBeTruthy();
  db.run('UPDATE drafts SET held_v = ? WHERE id = ?', '800', d.id);
  db.run('DELETE FROM sync_outbox'); // its upload went and was answered: only the let-go is left to send
  return d.id;
}

/** The fake server: records each push; `answers` decides what comes back, in order (a missing answer is a lost one). */
function server(answers: ('ok' | 'lost')[] = []) {
  const pushed: PushOp[][] = [];
  let pushes = 0;
  const calls: string[] = [];
  const supabase: SupabaseLike = {
    async rpc(fn, args = {}): Promise<RpcResult> {
      calls.push(fn);
      if (fn === 'sync_pull') {
        return { data: { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false, held: { rows: [], cursor: null, more: false } }, error: null, status: 200 };
      }
      const ops = (args as { p_ops: PushOp[] }).p_ops;
      pushed.push(ops);
      const how = answers[pushes++] ?? 'ok';
      if (how === 'lost') return { data: null, error: { message: 'network', code: '' } as never, status: 0 };
      return { data: { results: ops.map((o) => ({ op: o.op, ok: true })) }, error: null, status: 200 };
    },
  };
  return { supabase, pushed, calls };
}

function start(supabase: SupabaseLike, userId: string, paused?: () => boolean): SyncEngine {
  engine?.stop();
  engine = createSyncEngine({ db, supabase, userId, newId, now: () => clock, random: () => 1, setTimer: () => 0, clearTimer: () => {}, isActive: () => false, paused });
  return engine;
}

const outbox = () => db.all<{ type: string; entity_id: string }>('SELECT type, entity_id FROM sync_outbox ORDER BY lane, seq');
const draftState = (id: string) => db.get<{ state: string }>('SELECT state FROM drafts WHERE id = ?', id)?.state;

describe('[NS-09-R7] a let-go of a synced held draft is queued until the server answers', () => {
  it('[NS-09-R7] the discard reaches the server', async () => {
    const id = syncedHeldDraft();
    expect(store.beginDiscard(id)).toBe(true);
    expect(draftState(id)).toBe('discarding'); // hidden at once
    expect(outbox()).toEqual([{ type: 'held.discard', entity_id: id }]); // arrange: it can fail here if nothing was queued

    const s = server(['lost', 'ok']); // the first answer never comes back
    await start(s.supabase, MAMA).sync();
    expect(s.pushed).toHaveLength(1);
    expect(outbox()).toHaveLength(1); // sent, not acknowledged: still queued (mutant: removed on send)

    clock += 60 * 60_000; // past the retry wait
    await engine!.sync();
    expect(s.pushed).toHaveLength(2);
    expect(s.pushed[1][0].op).toBe(s.pushed[0][0].op); // the same op id again, so applying twice is harmless
    expect(s.pushed[1][0]).toMatchObject({ type: 'held.discard', id, base: '800' });
    expect(outbox()).toEqual([]); // gone only after the answer
  });
});

describe('[NS-09-R10] the local let-go does not wait for sync', () => {
  it('[NS-09-R10] kill switch queues the discard', async () => {
    const id = syncedHeldDraft();
    setServerFeaturesForTests(false); // the build switch is off
    expect(store.beginDiscard(id)).toBe(true); // the local let-go completes (mutant: gated on the switch)
    expect(store.finishDiscard(id)).toBe(true);
    expect(store.getDraft(id)).toBeNull();
    expect(outbox()).toEqual([{ type: 'held.discard', entity_id: id }]);
    setServerFeaturesForTests(true);

    const s = server();
    let killed = true; // killSwitches.sync on
    await start(s.supabase, MAMA, () => killed).sync();
    expect(s.calls).toEqual([]); // no request leaves while the switch is on
    expect(outbox()).toHaveLength(1);

    killed = false;
    await engine!.sync();
    expect(s.pushed.flat().map((o) => o.type)).toEqual(['held.discard']); // sent when sync is allowed
    expect(outbox()).toEqual([]);
  });
});

describe('[NS-09-R11] a discard is never sent as another account', () => {
  it('[NS-09-R11] a discard is never sent as another account', async () => {
    const id = syncedHeldDraft();
    expect(store.beginDiscard(id)).toBe(true);
    expect(outbox()).toHaveLength(1);

    const asPapa = server();
    const papa = start(asPapa.supabase, PAPA);
    expect(papa.start()).toBeNull(); // the phone belongs to Mama
    expect(papa.status().phase).toBe('account_mismatch');
    await papa.sync();
    expect(asPapa.calls).toEqual([]); // nothing under Papa's session (mutant: drained without the owner check)
    expect(outbox()).toEqual([{ type: 'held.discard', entity_id: id }]); // held for Mama

    const asMama = server();
    await start(asMama.supabase, MAMA).sync();
    expect(asMama.pushed.flat().map((o) => [o.type, o.id])).toEqual([['held.discard', id]]);
  });
});

describe('[NS-09-R12] sign out does not drop a discard', () => {
  const ready: AuthState = { status: 'ready', userId: MAMA, sync: 'on' };

  it('[NS-09-R12] sign out does not drop a discard', async () => {
    const id = syncedHeldDraft();
    expect(pendingCount(db)).toBe(0); // arrange: nothing queued, so Sign out would not wait
    expect(signOutWouldWait(ready, pendingCount(db))).toBe(false);
    expect(store.beginDiscard(id)).toBe(true);
    expect(pendingCount(db)).toBe(1); // the discard counts as work to wait for (mutant: not counted)
    expect(signOutWouldWait(ready, pendingCount(db))).toBe(true);

    // Signed out anyway: the engine stops, the op stays, and Mama's next sign-in sends it.
    start(server().supabase, MAMA).stop();
    expect(outbox()).toEqual([{ type: 'held.discard', entity_id: id }]);
    const s = server();
    await start(s.supabase, MAMA).sync();
    expect(s.pushed.flat().map((o) => o.type)).toEqual(['held.discard']);
    expect(signOutWouldWait(ready, pendingCount(db))).toBe(false); // drained: nothing left to wait for
  });
});
