/// <reference types="node" />
/**
 * The kill path (D-100: the switch in lib/capabilities.ts stays as the kill path;
 * 08-delivery.md section 8.3 item 1): a build made with EXPO_PUBLIC_SERVER_FEATURES
 * off runs none of sync. startSync() wires no listener, starts no engine, builds no
 * Supabase client, sends no request and never reads the remote kill switch; the
 * whole local flow (books, letters, edits, delete, restore, the protocol v1 conflict
 * and v6 capture paths) works and queues nothing. The same build with the switch
 * on wires sync (the contrast). Real modules; only natives and the network are
 * stubbed. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

const spies = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: { startAutoRefresh: () => {}, stopAutoRefresh: () => {} }, rpc: vi.fn() })),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  createSyncEngine: vi.fn(),
  killed: vi.fn(() => false),
  killSubscribe: vi.fn(() => () => {}),
  rpc: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => ({ ...(spies.createClient as (...a: unknown[]) => object)(...args), rpc: spies.rpc }) }));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: spies.addEventListener }, Platform: { OS: 'ios' } }));
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
  spies.createSyncEngine.mockImplementation(real.createSyncEngine);
  return { ...real, createSyncEngine: spies.createSyncEngine };
});
vi.mock('../src/lib/auth/auth-store', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/lib/auth/auth-store')>();
  return {
    ...real,
    onSignedIn: vi.fn(real.onSignedIn),
    subscribeAuth: vi.fn(real.subscribeAuth),
    onInviteAccepted: vi.fn(real.onInviteAccepted),
    registerUploadQueue: vi.fn(real.registerUploadQueue),
  };
});

const store = await import('../src/lib/store');
const caps = await import('../src/lib/capabilities');
const auth = await import('../src/lib/auth/auth-store');
const sync = await import('../src/lib/sync');
const signal = await import('../src/lib/sync/signal');
// The kill-switch reader the running engine consults (in the app: the signed remote config).
sync.setSyncKillSourceForTests({ killed: spies.killed, subscribe: spies.killSubscribe });

const MAMA = '11111111-1111-1111-1111-111111111111';
let close: () => void = () => {};
let seq = 0;
const now = () => '2026-10-15T09:00:00.000Z';
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let raw: ReturnType<typeof nodeDb>['db'];

beforeEach(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
  vi.clearAllMocks();
  store.closeStore();
  const h = nodeDb();
  raw = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
});
afterEach(() => {
  caps.setServerFeaturesForTests(null);
  store.closeStore();
  close();
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

const queued = () => raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n;
const nothingWired = () => {
  expect(auth.onSignedIn).not.toHaveBeenCalled();
  expect(auth.subscribeAuth).not.toHaveBeenCalled();
  expect(auth.onInviteAccepted).not.toHaveBeenCalled();
  expect(auth.registerUploadQueue).not.toHaveBeenCalled();
  expect(spies.addEventListener).not.toHaveBeenCalled();
  expect(spies.createSyncEngine).not.toHaveBeenCalled();
  expect(spies.createClient).not.toHaveBeenCalled();
  expect(spies.rpc).not.toHaveBeenCalled();
  expect(spies.killed).not.toHaveBeenCalled();
  expect(spies.killSubscribe).not.toHaveBeenCalled();
};

/** Everything a parent does on the phone, through the store as screens call it. */
function wholeLocalFlow(): string {
  const c = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  const d = store.createDraft({ childId: c, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Hi.' });
  store.setDraftKind(d.id, 'letter');
  store.setDraftOccurred(d.id, '2026-10-14', 'day');
  store.setDraftLanguage(d.id, 'en-GB');
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: '2026-10-15', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim', promptKey: null,
    engineVersion: 5, rawTranscript: 'Hi, Asha.', machineEdits: [], finalText: 'Hi, Asha.', inBook: true, soundsLikeMe: null, childId: c,
    authorSignsAs: 'Mama', audioUri: null,
  });
  store.saveEntry({ ...store.getEntry(d.id)!, finalText: 'Hi, Asha. You smiled.' });
  store.setEntryInBook(d.id, false);
  store.deleteEntry(d.id);
  store.undeleteEntry(d.id);
  store.updateChild(c, { name: 'Asha Rose', signsAs: 'Mummy' });
  const gone = store.createDraft({ childId: c, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'No.' });
  store.beginDiscard(gone.id);
  store.finishDiscard(gone.id);
  return d.id;
}

describe('[D-100] server features off: none of sync runs', () => {
  it('the switch reads off in this process, as in every v1.0 build profile', () => {
    expect(caps.serverFeaturesEnabled()).toBe(false);
    expect(caps.capabilities.sync).toBe(false);
  });

  it('startSync wires nothing: no listener, engine, client, request or kill-switch read', () => {
    const stop = sync.startSync();
    signal.signalOutbox(); // a save after boot: nobody listens
    auth.publishInviteAccepted('child-asha');
    nothingWired();
    stop();
    nothingWired();
  });

  it('the whole local flow works and queues nothing; status is local and idle', () => {
    const stop = sync.startSync();
    const id = wholeLocalFlow();
    expect(store.getEntry(id)).toMatchObject({ finalText: 'Hi, Asha. You smiled.', inBook: false, language: 'en-GB', occurredOn: '2026-10-14' });
    expect(store.getChild(store.getActiveChildId()!)).toMatchObject({ name: 'Asha Rose', signsAs: 'Mummy' });
    expect(queued()).toBe(0);
    expect(raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes')!.n).toBe(0);
    expect(store.listConflicts()).toEqual([]);
    expect(sync.getSyncStatus()).toEqual({ phase: 'idle', pending: 0, rejected: 0, conflicts: 0, lastSyncedAt: null, consent: null });
    nothingWired();
    stop();
  });

  it('a phone that synced in a server-on build, then runs an off build, sends nothing and keeps its queue for later', async () => {
    // The kill path for the alpha: an earlier build signed in and left an op queued.
    const c = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    const { takeOwnership } = await import('../src/lib/sync/ownership');
    takeOwnership(raw, MAMA, { now: now(), newId });
    const before = queued();
    expect(before).toBeGreaterThan(0);
    const stop = sync.startSync();
    const id = wholeLocalFlow();
    expect(store.getEntry(id)).not.toBeNull();
    expect(await sync.syncNow()).toBeNull(); // pull to refresh does nothing
    nothingWired();
    expect(queued()).toBeGreaterThanOrEqual(before); // nothing was sent, nothing was dropped
    expect(store.getChild(c)).not.toBeNull();
    stop();
  });
});

const settle = () => new Promise((r) => setTimeout(r, 20));
const okRpc = (fn: string, args: Record<string, unknown> = {}) =>
  Promise.resolve(fn === 'sync_push'
    ? { data: { results: (args.p_ops as { op: string }[]).map((o) => ({ op: o.op, ok: true })), paused: false, stopped: false }, error: null, status: 200 }
    : { data: { reset: false, epoch: 1, epoch_started_at: now(), books: [], gone: [], more: false }, error: null, status: 200 });

describe('[F16-REQ-018] switch on, signed in: the remote kill switch through startSync', () => {
  afterEach(() => auth.publishAuth({ status: 'signedOut' }));

  it('while killSwitches.sync is on, the wired engine sends nothing and keeps the queue; lifting it resumes at once', async () => {
    caps.setServerFeaturesForTests(true);
    spies.rpc.mockImplementation(okRpc);
    let killed = true;
    let wake: () => void = () => {};
    spies.killed.mockImplementation(() => killed);
    spies.killSubscribe.mockImplementation(((l: () => void) => {
      wake = l;
      return () => {};
    }) as never);
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    const stop = sync.startSync();
    auth.publishAuth({ status: 'ready', userId: MAMA, sync: 'on' });
    // BL-347 (F02-REQ-019): this phone's book belongs to no account yet, so sync waits for "Keep them here".
    expect(auth.syncAllowed()).toBe(false);
    expect(spies.createSyncEngine).not.toHaveBeenCalled();
    auth.confirmAccountClaim(MAMA);
    await settle();
    expect(spies.createSyncEngine).toHaveBeenCalledTimes(1);
    expect(spies.killed).toHaveBeenCalled();
    expect(spies.rpc).not.toHaveBeenCalled();
    expect(queued()).toBeGreaterThan(0); // the first sign-in queued the book; it waits
    expect(sync.getSyncStatus().phase).toBe('paused_server');

    killed = false;
    wake(); // the signed config changed: the switch is off again
    await settle();
    expect(spies.rpc.mock.calls.map((c) => c[0])).toEqual(['sync_push', 'sync_pull']);
    expect(queued()).toBe(0);
    stop();
  });

  it('a kill-switch reader that throws keeps sync paused (fail closed)', async () => {
    caps.setServerFeaturesForTests(true);
    spies.rpc.mockImplementation(okRpc);
    spies.killed.mockImplementation(() => {
      throw new Error('unreadable');
    });
    store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    const stop = sync.startSync();
    auth.publishAuth({ status: 'ready', userId: MAMA, sync: 'on' });
    // BL-347 (F02-REQ-019): this phone's book belongs to no account yet, so sync waits for "Keep them here".
    expect(auth.syncAllowed()).toBe(false);
    expect(spies.createSyncEngine).not.toHaveBeenCalled();
    auth.confirmAccountClaim(MAMA);
    await settle();
    expect(spies.rpc).not.toHaveBeenCalled();
    expect(sync.getSyncStatus().phase).toBe('paused_server');
    stop();
  });
});

describe('[F16-REQ-018] the real kill-switch reader (review B2-2)', () => {
  it('reads killSwitches.sync, no other switch, and forwards a config change', () => {
    const { remoteKillSource } = sync;
    let config = { killSwitches: { sync: false, serverContent: true } };
    let heard: (() => void) | null = null;
    const fake = {
      getRemoteConfig: () => config,
      remoteConfigDoc: { subscribe: (l: () => void) => { heard = l; return () => {}; } },
    };
    const source = remoteKillSource(() => fake as never);
    expect(source.killed()).toBe(false); // another switch never pauses sync
    config = { killSwitches: { sync: true, serverContent: false } };
    expect(source.killed()).toBe(true);
    let woke = 0;
    source.subscribe(() => woke++);
    (heard as unknown as () => void)();
    expect(woke).toBe(1);
  });
});

describe('the same build with the switch on (contrast)', () => {
  it('wires sync at boot: sign-in, auth, invites, the upload queue and the foreground listener', () => {
    caps.setServerFeaturesForTests(true);
    const stop = sync.startSync();
    expect(auth.onSignedIn).toHaveBeenCalledTimes(1);
    expect(auth.subscribeAuth).toHaveBeenCalledTimes(1);
    expect(auth.registerUploadQueue).toHaveBeenCalledTimes(1);
    expect(spies.addEventListener).toHaveBeenCalledTimes(1);
    expect(spies.createSyncEngine).not.toHaveBeenCalled(); // no signed-in, consented session yet
    stop();
  });
});
