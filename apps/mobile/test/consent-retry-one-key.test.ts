/// <reference types="node" />
/**
 * One consent answer, one acceptance row (NS-10-R7; keeping design K11). A tap whose answer is lost on the way back is
 * tapped again; the retry must be the same request, so `record_policy_act` replays the first row instead of writing
 * a second. The server de-duplicates on the `idempotency-key` header (supabase/migrations/20261005000000
 * `request_idempotency_key`, `idempotency_claim`); the fake below does what those two functions do: a key it has
 * seen replays, a new key writes a row. A lost answer is what postgrest-js resolves when the reply never arrives
 * (`status: 0`, code ''). Fixture: the fictional Asha family's parent, signed in.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
let minted = 0;
vi.mock('../src/lib/supabase/client', () => ({
  idempotencyKey: () => `0199a5b0-0000-7000-8000-${String(++minted).padStart(12, '0')}`,
}));

const { recordConsent } = await import('../src/lib/auth/consent');
type SupabaseClient = Parameters<typeof recordConsent>[0];

const MIGRATIONS = join(__dirname, '..', '..', '..', 'supabase', 'migrations');
const ASHA_PARENT = '0199a5b0-0000-7000-8000-00000000a5a1';

type Args = Record<string, unknown>;
interface Sent {
  header: string;
  key: string;
  args: Args;
}

/** A stand-in for the server's record_policy_act: rows, keys, and a switch that loses the next answer. */
function fakeServer() {
  const rows: Args[] = [];
  const claims = new Map<string, number>();
  const sent: Sent[] = [];
  const s = { rows, sent, loseNext: false, version: { terms: '1.0.0', 'sensitive-data': '1.0.0' } as Record<string, string> };
  const sb = {
    rpc(name: string, args: Args = {}) {
      if (name === 'policy_actions_needed') return Promise.resolve({ data: [{ document: 'terms', version: s.version.terms }], error: null });
      if (name !== 'record_policy_act') throw new Error(`unexpected rpc ${name}`);
      return {
        setHeader(header: string, key: string) {
          sent.push({ header, key, args });
          if (!claims.has(key)) {
            rows.push(args);
            claims.set(key, rows.length);
          }
          if (s.loseNext) {
            s.loseNext = false;
            return Promise.resolve({ data: null, error: { message: 'TypeError: Network request failed', details: '', hint: '', code: '' }, status: 0 });
          }
          return Promise.resolve({ data: `row-${claims.get(key)}`, error: null, status: 200 });
        },
      };
    },
    from(table: string) {
      if (table !== 'policy_versions') throw new Error(`unexpected table ${table}`);
      const q = {
        select: () => q,
        eq: () => q,
        lte: () => q,
        order: () => q,
        limit: () => Promise.resolve({ data: [{ version: s.version['sensitive-data'] }], error: null }),
      };
      return q;
    },
  };
  return { rows, sent, server: s, sb: sb as unknown as SupabaseClient };
}

beforeEach(() => {
  minted = 0;
});

describe('[NS-10-R7] one acceptance row after a retry', () => {
  it('Terms: the answer is lost, the parent taps Agree again, and the server holds one row', async () => {
    const f = fakeServer();
    f.server.loseNext = true;
    await expect(recordConsent(f.sb, 'terms', true, 'apple', ASHA_PARENT)).rejects.toMatchObject({ code: '' });
    await recordConsent(f.sb, 'terms', true, 'apple', ASHA_PARENT);
    expect(f.rows).toHaveLength(1);
    expect(f.sent).toHaveLength(2);
    // The retry is the same request: the same key and the same client time as the first tap.
    expect(f.sent[1].key).toBe(f.sent[0].key);
    expect(f.sent[1].args).toEqual(f.sent[0].args);
  });

  it('sensitive data: a lost Agree, tapped again, is one row; so is a lost decline', async () => {
    const f = fakeServer();
    f.server.loseNext = true;
    await expect(recordConsent(f.sb, 'sensitive', true, 'email', ASHA_PARENT)).rejects.toBeTruthy();
    await recordConsent(f.sb, 'sensitive', true, 'email', ASHA_PARENT);
    expect(f.rows).toHaveLength(1);

    const g = fakeServer();
    g.server.loseNext = true;
    await expect(recordConsent(g.sb, 'sensitive', false, 'email', ASHA_PARENT)).rejects.toBeTruthy();
    await recordConsent(g.sb, 'sensitive', false, 'email', ASHA_PARENT);
    expect(g.rows).toHaveLength(1);
    expect(g.rows[0]).toMatchObject({ p_document: 'sensitive-data', p_action: 'decline' });
  });

  it('once the server confirms, the next answer is a new request with a new key', async () => {
    const f = fakeServer();
    await recordConsent(f.sb, 'sensitive', false, 'email', ASHA_PARENT);
    await recordConsent(f.sb, 'sensitive', true, 'email', ASHA_PARENT);
    // The same answer given again after it was confirmed is a new act, as before.
    await recordConsent(f.sb, 'sensitive', true, 'email', ASHA_PARENT);
    expect(f.rows.map((r) => r.p_action)).toEqual(['decline', 'accept', 'accept']);
    expect(new Set(f.sent.map((s) => s.key)).size).toBe(3);
  });

  it('a new document version, another step, or another person is never answered with a held key', async () => {
    const f = fakeServer();
    f.server.loseNext = true;
    await expect(recordConsent(f.sb, 'terms', true, 'apple', ASHA_PARENT)).rejects.toBeTruthy();
    // Terms changed between the lost answer and the retry: the server refuses a key reused with other arguments
    // (22023), so the new version gets its own key.
    f.server.version.terms = '1.1.0';
    await recordConsent(f.sb, 'terms', true, 'apple', ASHA_PARENT);
    await recordConsent(f.sb, 'age', true, 'apple', ASHA_PARENT);
    await recordConsent(f.sb, 'terms', true, 'apple', '0199a5b0-0000-7000-8000-00000000a5a2');
    expect(new Set(f.sent.map((s) => s.key)).size).toBe(4);
    expect(f.rows).toHaveLength(4);
  });

  it('an under-18 answer is still never sent', async () => {
    const f = fakeServer();
    await recordConsent(f.sb, 'age', false, 'apple', ASHA_PARENT);
    await recordConsent(f.sb, 'terms', false, 'apple', ASHA_PARENT);
    expect(f.sent).toEqual([]);
  });
});

describe('[NS-10-R7] the key has the shape the server reads (K11)', () => {
  it('goes in the header request_idempotency_key reads, as a UUID it accepts', async () => {
    const sql = readFileSync(join(MIGRATIONS, '20261005000000_family_cap_language_idempotency.sql'), 'utf8');
    const fn = sql.slice(sql.indexOf('function public.request_idempotency_key()'), sql.indexOf('function public.idempotency_claim('));
    expect(fn).toContain(`->> '${HEADER_IDEMPOTENCY_KEY}'`);
    const pattern = /v_key !~\* '([^']+)'/.exec(fn)?.[1];
    expect(pattern).toBeTruthy();
    const f = fakeServer();
    await recordConsent(f.sb, 'terms', true, 'apple', ASHA_PARENT);
    expect(f.sent[0].header).toBe(HEADER_IDEMPOTENCY_KEY);
    expect(f.sent[0].key).toMatch(new RegExp(pattern!, 'i'));
  });

  it('the server fingerprints document and version but not client time; the retry resends the first time, so both hold', () => {
    const sql = readFileSync(join(MIGRATIONS, '20261108000000_consent_record_fields.sql'), 'utf8');
    const fingerprint = /v_fingerprint := jsonb_build_array\(([^;]+)\);/.exec(sql)?.[1] ?? '';
    expect(fingerprint).toContain('p_document');
    expect(fingerprint).toContain('p_version');
    expect(fingerprint).not.toContain('p_client_recorded_at');
  });
});

describe('heldAnswers: one key per answer until the server confirms', () => {
  it('mints once per answer, keeps the first client time, and frees the answer on confirm', async () => {
    const { heldAnswers } = await import('../src/lib/auth/consent-key.logic');
    let n = 0;
    const held = heldAnswers(() => `key-${++n}`);
    const first = held.hold('answer-a', () => '2026-11-20T19:00:00.000Z');
    expect(held.hold('answer-a', () => '2026-11-20T19:00:09.000Z')).toEqual(first);
    expect(first).toEqual({ key: 'key-1', recordedAt: '2026-11-20T19:00:00.000Z' });
    expect(held.hold('answer-b', () => '2026-11-20T19:00:10.000Z').key).toBe('key-2');
    held.confirmed('answer-a');
    expect(held.hold('answer-a', () => '2026-11-20T19:01:00.000Z')).toEqual({ key: 'key-3', recordedAt: '2026-11-20T19:01:00.000Z' });
  });
});
