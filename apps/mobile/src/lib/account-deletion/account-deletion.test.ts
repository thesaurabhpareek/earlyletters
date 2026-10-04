/**
 * Account deletion, pure parts: book impact lines, typed confirmation, status,
 * steps, the subscription notice, and the server calls against a fake client.
 * Run (from apps/mobile): npx vitest run --config src/lib/account-deletion/vitest.config.ts
 */
import { describe, expect, it } from 'vitest';
import { cancelDeletion, FORGET_PENDING_KEY, forgetAnalytics, loadBooks, loadStatus, requestDeletion, retryForget, type DeletionClient, type FlagStore } from './api';
import { accountDeletionCopy } from './copy';
import { bookImpacts, confirmationMatches, expectedDeletionDate, impactLines, localDay, parseStatus, showSubscriptionNotice, stepFor, type SyncBook } from './logic';

const me = { role: 'parent' as const, is_me: true, signs_as: 'Mumma' };
const books: SyncBook[] = [
  { id: 'b1', name: 'Asha', role: 'parent', members: [me, { role: 'parent', is_me: false, signs_as: 'Papa' }] },
  { id: 'b2', name: 'Ravi', role: 'parent', members: [me, { role: 'contributor', is_me: false, signs_as: 'Nani' }] },
  { id: 'b3', name: 'Mira', role: 'parent', members: [me] },
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
      "Mira's book will be deleted.",
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

function fakeClient(opts: { rpc?: Record<string, { data: unknown; error: { message?: string } | null }>; invokeError?: unknown; throwRpc?: Error } = {}) {
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
              order: () => ({ limit: () => Promise.resolve({ data: [{ id: 'req-1', status: 'scheduled', scheduled_for: '2026-11-02T00:00:00Z' }], error: null }) }),
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
  });

  it('tells offline from other failures, and never throws', async () => {
    expect(await requestDeletion(fakeClient({ throwRpc: new TypeError('Network request failed') }).client, null)).toEqual({ ok: false, reason: 'offline' });
    expect(await requestDeletion(fakeClient({ rpc: { request_account_deletion: { data: null, error: { message: 'SCDEL' } } } }).client, null)).toEqual({ ok: false, reason: 'failed' });
    expect(await requestDeletion(fakeClient({ rpc: { request_account_deletion: { data: [{}], error: null } } }).client, null)).toEqual({ ok: false, reason: 'failed' });
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

  it('with no ids (analytics never on), nothing is sent', async () => {
    const f = fakeClient();
    expect(await forgetAnalytics(f.client, { ids: () => [], forget: async () => {} }, memoryFlags(), 'account_deletion', 'k')).toBe('nothing');
    expect(f.calls).toEqual([]);
  });
});
