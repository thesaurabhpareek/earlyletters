/**
 * Account deletion, pure parts: book impact lines, typed confirmation, status,
 * steps, the subscription notice, and the server calls against a fake client.
 * Run (from apps/mobile): npx vitest run --config src/lib/account-deletion/vitest.config.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelDeletion, FORGET_PENDING_KEY, READ_TIMEOUT_MS, forgetAnalytics, loadBooks, loadStatus, requestDeletion, retryForget, type DeletionClient, type FlagStore } from './api';
import { accountDeletionCopy } from './copy';
import { bookImpacts, confirmationMatches, expectedDeletionDate, impactLines, localDay, parseStatus, showSubscriptionNotice, stepFor, type SyncBook } from './logic';

const me = { role: 'parent' as const, is_me: true, signs_as: 'Mumma' };
const books: SyncBook[] = [
  { id: 'b1', name: 'Asha', role: 'parent', members: [me, { role: 'parent', is_me: false, signs_as: 'Papa' }] },
  { id: 'b2', name: 'Ravi', role: 'parent', members: [me, { role: 'contributor', is_me: false, signs_as: 'Nani' }] },
  { id: 'b3', name: 'Tara', role: 'parent', members: [me] },
  { id: 'b4', name: 'Kai', role: 'contributor', members: [{ role: 'contributor', is_me: true, signs_as: 'Aunty' }] },
  { id: 'b5', name: 'Leo', role: 'parent', members: [me, { role: 'parent', is_me: false, signs_as: null }] },
];
const counts: Record<string, number> = { b1: 12, b2: 1, b3: 0, b4: 3, b5: 1 };

describe('what happens to each book', () => {
  const impacts = bookImpacts(books, (id) => counts[id]);
  it('applies the equals rule: shared books stay, sole-parent books go', () => {
    expect(impacts.map((i) => i.kind)).toEqual(['stays', 'deleted', 'deleted', 'contributor', 'stays']);
  });

  it('says it in plain words, names the co-parent as they sign, and never counts down', () => {
    const lines = impactLines(impacts);
    expect(lines).toEqual([
      "Asha's book stays with Papa, with their letters. Your 12 letters leave it.",
      "Ravi's book will be deleted, with your letter in it.",
      accountDeletionCopy.what.deletedFamily,
      "Tara's book will be deleted.",
      'Your letters to Kai will be removed.',
      "Leo's book stays with your co-parent, with their letters. Your letter leaves it.",
      accountDeletionCopy.what.copies,
    ]);
  });

  it('has a line for an account with no books', () => {
    expect(impactLines([])).toEqual([accountDeletionCopy.what.noBooks]);
  });

  it('never genders the child', () => {
    for (const l of impactLines(impacts)) expect(l).not.toMatch(/\b(she|he|her|him|his|hers)\b/i);
  });
});

describe('two-step confirm and the 30-day window', () => {
  it('needs the typed word, any case, spaces ignored', () => {
    expect(confirmationMatches('delete')).toBe(true);
    expect(confirmationMatches('  DELETE ')).toBe(true);
    expect(confirmationMatches('delet')).toBe(false);
    expect(confirmationMatches('')).toBe(false);
  });

  it('shows the date 30 days out, as a local calendar day', () => {
    expect(expectedDeletionDate(new Date('2026-10-03T12:00:00Z'))).toBe('2026-11-02T12:00:00.000Z');
    expect(localDay('2026-11-02T12:00:00.000Z')).toMatch(/^2026-11-0[123]$/);
  });

  it('chooses the step from the server status first', () => {
    expect(stepFor(null, 'review')).toBe('loading');
    expect(stepFor({ state: 'none' }, 'confirm')).toBe('confirm');
    expect(stepFor({ state: 'scheduled', requestId: 'r', scheduledFor: 'x' }, 'review')).toBe('scheduled');
    expect(stepFor({ state: 'held', requestId: 'r', scheduledFor: 'x' }, 'confirm')).toBe('scheduled');
    expect(stepFor({ state: 'executing', requestId: 'r' }, 'review')).toBe('executing');
  });

  it('reads only well-formed status rows', () => {
    expect(parseStatus([])).toEqual({ state: 'none' });
    expect(parseStatus(null)).toEqual({ state: 'none' });
    expect(parseStatus([{ id: 'r', status: 'scheduled', scheduled_for: '2026-11-02T00:00:00Z' }])).toEqual({ state: 'scheduled', requestId: 'r', scheduledFor: '2026-11-02T00:00:00Z' });
    expect(parseStatus([{ id: 'r', status: 'executing' }])).toEqual({ state: 'executing', requestId: 'r' });
    expect(parseStatus([{ id: 'r', status: 'cancelled', scheduled_for: 'x' }])).toEqual({ state: 'none' });
  });

  it('shows the Apple billing notice when Plus will renew or it is unknown', () => {
    expect(showSubscriptionNotice({ status: 'active', willAutoRenew: true })).toBe(true);
    expect(showSubscriptionNotice({ status: 'trial', willAutoRenew: null })).toBe(true);
    expect(showSubscriptionNotice({ status: 'billing_retry', willAutoRenew: null })).toBe(true);
    expect(showSubscriptionNotice({ status: 'active', willAutoRenew: false })).toBe(false);
    expect(showSubscriptionNotice({ status: 'none', willAutoRenew: null })).toBe(false);
    expect(showSubscriptionNotice({ status: 'refunded', willAutoRenew: null })).toBe(false);
  });
});

// ── Server calls against a fake client ─────────────────────────────────────

type Answer = { data: unknown; error: { code?: string; message?: string } | null; status?: number };
const SCHEDULED_ROW: Answer = { data: [{ id: 'req-1', status: 'scheduled', scheduled_for: '2026-11-02T00:00:00Z' }], error: null };

/** `status` is what the read of the caller's open request answers (an open scheduled request unless given). */
function fakeClient(opts: { rpc?: Record<string, Answer>; invokeError?: unknown; throwRpc?: Error; status?: Answer } = {}) {
  const calls: { kind: string; name: string; args?: unknown; headers?: Record<string, string> }[] = [];
  const query: string[] = [];
  const client: DeletionClient = {
    rpc(fn, args) {
      calls.push({ kind: 'rpc', name: fn, args });
      if (opts.throwRpc) return Promise.reject(opts.throwRpc);
      return Promise.resolve(opts.rpc?.[fn] ?? { data: null, error: null });
    },
    from(table) {
      query.push(table);
      return {
        select: (cols) => (query.push(cols), {
          eq: (c, v) => (query.push(`${c}=${v}`), {
            in: (c2, vs) => (query.push(`${c2} in ${vs.join(',')}`), {
              order: () => ({ limit: () => Promise.resolve(opts.status ?? SCHEDULED_ROW) }),
            }),
          }),
        }),
      };
    },
    functions: {
      invoke(name, o) {
        calls.push({ kind: 'invoke', name, args: o.body, headers: o.headers });
        return Promise.resolve({ data: { ok: true }, error: opts.invokeError ?? null });
      },
    },
  };
  return { client, calls, query };
}

function memoryFlags(): FlagStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v), remove: (k) => void map.delete(k) };
}

describe('server calls', () => {
  it('requests deletion from iOS with the subscription flag and reads the request back', async () => {
    const f = fakeClient({ rpc: { request_account_deletion: { data: [{ request_id: 'req-1', scheduled_for: '2026-11-02T00:00:00Z' }], error: null } } });
    const r = await requestDeletion(f.client, true);
    expect(r).toEqual({ ok: true, value: { requestId: 'req-1', scheduledFor: '2026-11-02T00:00:00Z' } });
    expect(f.calls[0]).toEqual({ kind: 'rpc', name: 'request_account_deletion', args: { p_source: 'ios', p_had_active_subscription: true } });
  });

  it('reads only its own open account request, filtering by enums (no ids in the URL)', async () => {
    const f = fakeClient();
    expect(await loadStatus(f.client)).toEqual({ ok: true, value: { state: 'scheduled', requestId: 'req-1', scheduledFor: '2026-11-02T00:00:00Z' } });
    expect(f.query).toEqual(['deletion_requests', 'id,status,scheduled_for', 'kind=account', 'status in scheduled,held,executing']);
  });

  it('loads books from sync_books and cancels with cancel_account_deletion', async () => {
    const f = fakeClient({ rpc: { sync_books: { data: { books }, error: null }, cancel_account_deletion: { data: true, error: null } } });
    expect((await loadBooks(f.client)).ok).toBe(true);
    expect(await cancelDeletion(f.client)).toEqual({ ok: true, value: true });
    expect(f.query).toEqual([]); // a true answer needs no status read
  });

  // cancel_account_deletion() answers false whenever nothing was open to cancel: already cancelled (an earlier try whose
  // answer was lost, or another phone), or no longer cancellable (executing). The status read tells them apart.
  const cancelAnswering = (data: unknown, status?: Answer) => cancelDeletion(fakeClient({ rpc: { cancel_account_deletion: { data, error: null } }, status }).client);

  it('a false answer with no open request left is a cancel that went through, so the page says the letters are back', async () => {
    expect(await cancelAnswering(false, { data: [], error: null })).toEqual({ ok: true, value: true });
  });

  it('a false answer while the request is still open is a failure, so the page never says they are back', async () => {
    // Anything but true reads as false, and the request here is still scheduled.
    for (const data of [false, null, 'true']) expect(await cancelAnswering(data), String(data)).toEqual({ ok: false, reason: 'failed' });
  });

  it('a false answer while the request is held is a failure: only a status of none counts as cancelled (BL-455 point 4)', async () => {
    const held: Answer = { data: [{ id: 'req-1', status: 'held', scheduled_for: '2026-11-29T09:00:00Z' }], error: null };
    expect(await cancelAnswering(false, held)).toEqual({ ok: false, reason: 'failed' });
  });

  it('a false answer whose status read fails says why the read failed', async () => {
    expect(await cancelAnswering(false, { data: null, error: { message: 'Network request failed' } })).toEqual({ ok: false, reason: 'offline' });
    expect(await cancelAnswering(false, { data: null, error: { message: 'SCDEL' } })).toEqual({ ok: false, reason: 'failed' });
  });

  it('[CDesO-59 case 3] a false answer while the request is executing returns that read, so the page moves to executing and shows no failure', async () => {
    const executing: Answer = { data: [{ id: 'req-1', status: 'executing', scheduled_for: '2026-11-02T00:00:00Z' }], error: null };
    expect(await cancelAnswering(false, executing)).toEqual({ ok: false, reason: 'executing', status: { state: 'executing', requestId: 'req-1', scheduledFor: '2026-11-02T00:00:00Z' } });
    expect(await cancelAnswering(false, { data: [{ id: 'req-1', status: 'executing' }], error: null })).toEqual({ ok: false, reason: 'executing', status: { state: 'executing', requestId: 'req-1' } });
  });

  it('a cancel that could not reach the server is not checked against the status', async () => {
    const f = fakeClient({ throwRpc: new TypeError('Network request failed'), status: { data: [], error: null } });
    expect(await cancelDeletion(f.client)).toEqual({ ok: false, reason: 'offline' });
    expect(f.query).toEqual([]);
  });

  // ── CDesO-58 and CDesO-59: the refusals the phone can tell apart ──
  /**
   * A client whose cancel_account_deletion answers each item of `answers` in turn (the last one repeats), with a
   * refreshSession that answers `refresh` (or none at all). Counts both, so one retry and no loop can be proved.
   */
  function refusingClient(answers: Answer[], opts: { refresh?: 'ok' | 'error' | 'no_session' | 'throws' | 'missing'; status?: Answer } = {}) {
    const f = fakeClient({ status: opts.status });
    const sent = { rpc: 0, refresh: 0 };
    const client: DeletionClient = {
      ...f.client,
      rpc(fn) {
        expect(fn).toBe('cancel_account_deletion');
        const a = answers[Math.min(sent.rpc, answers.length - 1)];
        sent.rpc += 1;
        return Promise.resolve(a);
      },
    };
    if (opts.refresh !== 'missing') {
      client.auth = {
        refreshSession() {
          sent.refresh += 1;
          if (opts.refresh === 'throws') return Promise.reject(new TypeError('Network request failed'));
          if (opts.refresh === 'error') return Promise.resolve({ data: { session: null }, error: new Error('Invalid Refresh Token: Refresh Token Not Found') });
          if (opts.refresh === 'no_session') return Promise.resolve({ data: { session: null }, error: null });
          return Promise.resolve({ data: { session: { access_token: 'fresh' } }, error: null });
        },
      };
    }
    return { client, sent, query: f.query };
  }
  const refused = (code: string, message = 'refused', status?: number): Answer => ({ data: null, error: { code, message }, ...(status ? { status } : {}) });
  const SCRAT = refused('SCRAT', 'too many cancellations today', 400);
  const EXPIRED = refused('PGRST303', 'JWT expired', 401);
  const CANCELLED: Answer = { data: true, error: null };

  it('[CDesO-58] keeps the server code: SCRAT, the daily limit, is `limited`, not an unknown outcome, and is not retried', async () => {
    const c = refusingClient([SCRAT]);
    expect(await cancelDeletion(c.client)).toEqual({ ok: false, reason: 'limited' });
    expect(c.sent).toEqual({ rpc: 1, refresh: 0 });
    // The call rolled back, so there is nothing to check against the status.
    expect(c.query).toEqual([]);
    // Read by its code, never its words: the same message under another code is an ordinary failure.
    expect(await cancelDeletion(refusingClient([refused('P0001', 'too many cancellations today')]).client)).toEqual({ ok: false, reason: 'failed' });
  });

  it('[CDesO-59 case 1] an auth refusal refreshes the session and sends once more; that second answer decides as for any press', async () => {
    // Cancelled on the second send.
    const ok = refusingClient([EXPIRED, CANCELLED]);
    expect(await cancelDeletion(ok.client)).toEqual({ ok: true, value: true });
    expect(ok.sent).toEqual({ rpc: 2, refresh: 1 });
    // The daily limit on the second send is CDesO-58.
    expect(await cancelDeletion(refusingClient([EXPIRED, SCRAT]).client)).toEqual({ ok: false, reason: 'limited' });
    // Anything else on the second send keeps cancelFailed's reasons.
    expect(await cancelDeletion(refusingClient([EXPIRED, refused('40001', 'could not serialize access due to concurrent update')]).client)).toEqual({ ok: false, reason: 'failed' });
    expect(await cancelDeletion(refusingClient([EXPIRED, refused('', 'Network request failed')]).client)).toEqual({ ok: false, reason: 'offline' });
  });

  it('[CDesO-59 case 1] every auth refusal the server gives is retried: 28000, 42501, PGRST301 to 303 and HTTP 401', async () => {
    for (const first of [refused('28000', 'not signed in'), refused('42501', 'permission denied for function cancel_account_deletion'),
      refused('PGRST301', 'JWT expired'), refused('PGRST302', 'Anonymous access is disabled'), refused('PGRST303', 'JWT expired'), refused('', 'Unauthorized', 401)]) {
      const c = refusingClient([first, CANCELLED]);
      expect(await cancelDeletion(c.client), first.error?.code || '401').toEqual({ ok: true, value: true });
      expect(c.sent, first.error?.code || '401').toEqual({ rpc: 2, refresh: 1 });
    }
  });

  it('[CDesO-59 case 1] one retry, never a loop: a second auth refusal is `auth`, and a refresh that brings no session sends nothing more', async () => {
    const twice = refusingClient([EXPIRED, EXPIRED, CANCELLED]);
    expect(await cancelDeletion(twice.client)).toEqual({ ok: false, reason: 'auth' });
    expect(twice.sent).toEqual({ rpc: 2, refresh: 1 });
    for (const refresh of ['error', 'no_session', 'throws', 'missing'] as const) {
      const c = refusingClient([EXPIRED, CANCELLED], { refresh });
      expect(await cancelDeletion(c.client), refresh).toEqual({ ok: false, reason: 'auth' });
      expect(c.sent, refresh).toEqual({ rpc: 1, refresh: refresh === 'missing' ? 0 : 1 });
    }
  });

  it('[CDesO-59] a refusal that is not about auth is never retried and never refreshes the session', async () => {
    for (const first of [SCRAT, refused('SCANO', 'anonymous'), refused('40001', 'could not serialize access'), refused('57014', 'timeout'),
      refused('PGRST202', 'function not found', 404), refused('', 'Network request failed'), refused('XX000', 'internal', 500)]) {
      const c = refusingClient([first, CANCELLED]);
      const r = await cancelDeletion(c.client);
      expect(r.ok, first.error?.code || 'network').toBe(false);
      expect(c.sent, first.error?.code || 'network').toEqual({ rpc: 1, refresh: 0 });
    }
  });

  it('tells offline from other failures, and never throws', async () => {
    // With nothing open on the server (the status read finds none), a failed request stays a failure, as it was.
    const none: Answer = { data: [], error: null };
    expect(await requestDeletion(fakeClient({ throwRpc: new TypeError('Network request failed'), status: none }).client, null)).toEqual({ ok: false, reason: 'offline' });
    expect(await requestDeletion(fakeClient({ rpc: { request_account_deletion: { data: null, error: { message: 'SCDEL' } } }, status: none }).client, null)).toEqual({ ok: false, reason: 'failed' });
    expect(await requestDeletion(fakeClient({ rpc: { request_account_deletion: { data: [{}], error: null } }, status: none }).client, null)).toEqual({ ok: false, reason: 'failed' });
  });

  // The server can commit a request and the answer be lost (a dropped connection, a reply that cannot be read). The
  // screen must never say "Nothing has changed" while a request is open, so a failed request is checked against the
  // status once, as a cancel is.
  describe('a request whose answer was lost', () => {
    const OPEN: Answer = { data: [{ id: 'req-9', status: 'scheduled', scheduled_for: '2026-11-29T09:00:00Z' }], error: null };
    const NONE: Answer = { data: [], error: null };
    const lost = (status: Answer) => ({ throwRpc: new TypeError('Network request failed'), status });

    it('is a success when the status read finds the request open: the page shows it scheduled, not a failure', async () => {
      const f = fakeClient(lost(OPEN));
      expect(await requestDeletion(f.client, null)).toEqual({ ok: true, value: { requestId: 'req-9', scheduledFor: '2026-11-29T09:00:00Z' } });
      expect(f.query).toEqual(['deletion_requests', 'id,status,scheduled_for', 'kind=account', 'status in scheduled,held,executing']);
    });

    it('is a success whatever the failure looked like: offline, a server error, or an answer that cannot be read', async () => {
      const refused = fakeClient({ rpc: { request_account_deletion: { data: null, error: { message: 'SCRAT' } } }, status: OPEN });
      expect(await requestDeletion(refused.client, null)).toMatchObject({ ok: true });
      const unreadable = fakeClient({ rpc: { request_account_deletion: { data: [{}], error: null } }, status: OPEN });
      expect(await requestDeletion(unreadable.client, null)).toMatchObject({ ok: true });
    });

    it('a held request is open too', async () => {
      const held: Answer = { data: [{ id: 'req-9', status: 'held', scheduled_for: '2026-11-29T09:00:00Z' }], error: null };
      expect(await requestDeletion(fakeClient(lost(held)).client, null)).toMatchObject({ ok: true, value: { requestId: 'req-9' } });
    });

    it('reads the status once, and only after a failure: a request that went through is not read back', async () => {
      const ok = fakeClient({ rpc: { request_account_deletion: { data: [{ request_id: 'req-1', scheduled_for: '2026-11-02T00:00:00Z' }], error: null } }, status: OPEN });
      await requestDeletion(ok.client, null);
      expect(ok.query).toEqual([]);
      const failed = fakeClient(lost(NONE));
      await requestDeletion(failed.client, null);
      expect(failed.query.filter((q) => q === 'deletion_requests')).toHaveLength(1);
    });

    it('is still a failure, and a true "nothing has changed", when the read finds nothing open', async () => {
      expect(await requestDeletion(fakeClient(lost(NONE)).client, null)).toEqual({ ok: false, reason: 'offline' });
    });

    it('is still the original failure when the read cannot be made either (and a repeat of the request is safe: it is idempotent)', async () => {
      expect(await requestDeletion(fakeClient(lost({ data: null, error: { message: 'Network request failed' } })).client, null)).toEqual({ ok: false, reason: 'offline' });
      expect(await requestDeletion(fakeClient({ rpc: { request_account_deletion: { data: null, error: { message: 'SCDEL' } } }, status: { data: null, error: { message: 'x' } } }).client, null)).toEqual({ ok: false, reason: 'failed' });
    });

    it('an executing request is not offered back as a new one (it cannot be cancelled and has no date)', async () => {
      const executing: Answer = { data: [{ id: 'req-9', status: 'executing' }], error: null };
      expect(await requestDeletion(fakeClient(lost(executing)).client, null)).toEqual({ ok: false, reason: 'offline' });
    });
  });
});

describe('analytics ids at deletion (TDD 05 X-02)', () => {
  const ids = ['9a9a9a9a-0000-4000-8000-0000000000aa', '9a9a9a9a-0000-4000-8000-0000000000bb'];

  it('sends the ids to analytics-forget once, then forgets them on the phone', async () => {
    const f = fakeClient();
    const flags = memoryFlags();
    let forgotten = false;
    const r = await forgetAnalytics(f.client, { ids: () => ids, forget: async () => void (forgotten = true) }, flags, 'account_deletion', 'idem-1');
    expect(r).toBe('done');
    expect(forgotten).toBe(true);
    expect(f.calls).toEqual([{ kind: 'invoke', name: 'analytics-forget/v1', args: { ids, reason: 'account_deletion' }, headers: { 'idempotency-key': 'idem-1' } }]);
    expect(flags.map.size).toBe(0);
  });

  it('keeps a retry flag when the call fails, and the retry finishes it', async () => {
    const flags = memoryFlags();
    let forgotten = false;
    const a = { ids: () => ids, forget: async () => void (forgotten = true) };
    expect(await forgetAnalytics(fakeClient({ invokeError: new Error('offline') }).client, a, flags, 'account_deletion', 'k')).toBe('pending');
    expect(forgotten).toBe(false);
    expect(flags.map.get(FORGET_PENDING_KEY)).toBe('account_deletion');
    expect(await retryForget(fakeClient().client, a, flags, 'k2')).toBe('done');
    expect(forgotten).toBe(true);
    expect(await retryForget(fakeClient().client, a, flags, 'k3')).toBe('none_pending');
  });

  describe('more ids than one call takes (batches of 21)', () => {
    const many = Array.from({ length: 30 }, (_, i) => `9a9a9a9a-0000-4000-8000-${String(i).padStart(12, '0')}`);
    function store(list: string[]) {
      const state = { list: [...list], wiped: false };
      return {
        state,
        a: {
          ids: () => [...state.list],
          forget: async () => void ((state.wiped = true), (state.list = [])),
          forgetSome: async (gone: string[]) => void (state.list = state.list.filter((x) => !gone.includes(x))),
        },
      };
    }
    function invokeOnly(failOn: number[]): { client: DeletionClient; bodies: string[][] } {
      const bodies: string[][] = [];
      const client = {
        functions: { invoke: async (_n: string, o: { body: { ids: string[] } }) => (bodies.push(o.body.ids), { data: null, error: failOn.includes(bodies.length) ? new Error('x') : null }) },
      } as unknown as DeletionClient;
      return { client, bodies };
    }

    it('names every id: 30 ids go as 21 then 9, and all acknowledged clears everything', async () => {
      const s = store(many);
      const c = invokeOnly([]);
      const flags = memoryFlags();
      expect(await forgetAnalytics(c.client, s.a, flags, 'account_deletion', 'k')).toBe('done');
      expect(c.bodies.map((b) => b.length)).toEqual([21, 9]);
      expect(c.bodies.flat()).toEqual(many);
      expect(s.state.wiped).toBe(true);
      expect(s.state.list).toEqual([]);
      expect(flags.map.size).toBe(0);
    });

    it('one failing batch keeps only the unacknowledged ids, flags a retry, and the retry finishes', async () => {
      const s = store(many);
      const flags = memoryFlags();
      const c = invokeOnly([2]);
      expect(await forgetAnalytics(c.client, s.a, flags, 'account_deletion', 'k')).toBe('pending');
      expect(s.state.wiped).toBe(false);
      expect(s.state.list).toEqual(many.slice(21));
      expect(flags.map.get(FORGET_PENDING_KEY)).toBe('account_deletion');
      const again = invokeOnly([]);
      expect(await retryForget(again.client, s.a, flags, 'k2')).toBe('done');
      expect(again.bodies).toEqual([many.slice(21)]);
      expect(s.state.list).toEqual([]);
    });

    it('a first batch that fails keeps every id', async () => {
      const s = store(many);
      expect(await forgetAnalytics(invokeOnly([1]).client, s.a, memoryFlags(), 'account_deletion', 'k')).toBe('pending');
      expect(s.state.list).toEqual(many);
    });

    it('a call that throws or a local clear that throws still ends as pending, never as a throw (the deletion flow carries on)', async () => {
      const s = store(many);
      const throwing = { functions: { invoke: async () => { throw new Error('offline'); } } } as unknown as DeletionClient;
      expect(await forgetAnalytics(throwing, s.a, memoryFlags(), 'account_deletion', 'k')).toBe('pending');
      const half = invokeOnly([2]);
      const bad = { ...s.a, forgetSome: async () => { throw new Error('disk'); } };
      expect(await forgetAnalytics(half.client, bad, memoryFlags(), 'account_deletion', 'k')).toBe('pending');
      expect(s.state.list).toEqual(many);
    });

    it('never puts an id in anything it throws or logs', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      await forgetAnalytics(invokeOnly([2]).client, store(many).a, memoryFlags(), 'account_deletion', 'k');
      for (const m of [spy, warn, log]) expect(m).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  it('with no ids (analytics never on), nothing is sent', async () => {
    const f = fakeClient();
    expect(await forgetAnalytics(f.client, { ids: () => [], forget: async () => {} }, memoryFlags(), 'account_deletion', 'k')).toBe('nothing');
    expect(f.calls).toEqual([]);
  });
});

describe('[BL-492 point 3] a read that never answers ends as offline', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  const hangingStatus = (): DeletionClient => {
    const f = fakeClient({});
    const never = new Promise<never>(() => undefined);
    return { ...f.client, from: () => ({ select: () => ({ eq: () => ({ in: () => ({ order: () => ({ limit: () => never }) }) }) }) }) };
  };

  it('the status read gives up at the timeout, not before, and says offline', async () => {
    let out: unknown = null;
    void loadStatus(hangingStatus()).then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS - 1);
    expect(out).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(out).toEqual({ ok: false, reason: 'offline' });
    expect(READ_TIMEOUT_MS).toBe(15_000);
  });

  it('the book read gives up the same way', async () => {
    const client: DeletionClient = { ...fakeClient({}).client, rpc: () => new Promise<never>(() => undefined) };
    let out: unknown = null;
    void loadBooks(client).then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS);
    expect(out).toEqual({ ok: false, reason: 'offline' });
  });

  it('an answer in time is the answer, and leaves no timer behind', async () => {
    expect(await loadStatus(fakeClient({}).client)).toMatchObject({ ok: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('[BL-492] the status check after a failed write has no clock of its own: a slow answer that finds the request open is a success', async () => {
    const f = fakeClient({ throwRpc: new Error('network request failed') });
    const slow = new Promise((res) => setTimeout(() => res(SCHEDULED_ROW), READ_TIMEOUT_MS + 5_000));
    const client: DeletionClient = { ...f.client, from: () => ({ select: () => ({ eq: () => ({ in: () => ({ order: () => ({ limit: () => slow as never }) }) }) }) }) };
    let out: unknown = null;
    void requestDeletion(client, null).then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 1);
    expect(out).toBeNull();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(out).toMatchObject({ ok: true });
  });

  it('[BL-492] the same for a cancel whose false answer is checked: the check waits, and finds none open', async () => {
    const f = fakeClient({ rpc: { cancel_account_deletion: { data: false, error: null } } });
    const slow = new Promise((res) => setTimeout(() => res({ data: [], error: null }), READ_TIMEOUT_MS + 5_000));
    const client: DeletionClient = { ...f.client, from: () => ({ select: () => ({ eq: () => ({ in: () => ({ order: () => ({ limit: () => slow as never }) }) }) }) }) };
    let out: unknown = null;
    void cancelDeletion(client).then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 6_000);
    expect(out).toEqual({ ok: true, value: true });
  });

  it('a request is not given up on by the clock: it waits for its own answer (the server may still commit it)', async () => {
    const client: DeletionClient = { ...fakeClient({}).client, rpc: () => new Promise((res) => setTimeout(() => res({ data: [{ request_id: 'r1', scheduled_for: '2026-12-30T00:00:00Z' }], error: null }), 60_000)) };
    let out: unknown = null;
    void requestDeletion(client, null).then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(out).toEqual({ ok: true, value: { requestId: 'r1', scheduledFor: '2026-12-30T00:00:00Z' } });
  });
});
