/**
 * FP-2 review A: a build that ships before 20261108000000 is applied retries once in the old argument form (PGRST202 or
 * 42883 only, same retry key); a real refusal never retries. Also the call site sends the language of the words shown
 * (the content module's, here changed to "xx" so a literal "en" at the call site fails). Fictional Asha family only.
 */
import { describe, expect, it, vi } from 'vitest';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';

vi.mock('react-native', () => ({ Platform: { OS: 'ios', Version: '17.4' } }));
vi.mock('expo-application', () => ({ nativeBuildVersion: '42' }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
// A new value on every call, so a retry that mints a fresh key instead of reusing the held one fails the same-key check.
let keyN = 0;
vi.mock('../src/lib/supabase/client', () => ({ idempotencyKey: () => `0199a5b0-0000-7000-8000-00000000c${String(++keyN).padStart(3, '0')}` }));
vi.mock('@scribe/content', async (orig) => ({ ...(await orig<object>()), CONSENT_LOCALE: 'xx' }));

const { recordConsent } = await import('../src/lib/auth/consent');

/** `answers[i]` is the error code (or null) the server gives the i-th record_policy_act call. */
function stub(answers: (string | null)[]) {
  const calls: { args: Record<string, unknown>; key?: string }[] = [];
  const sb = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      if (fn === 'policy_actions_needed') return Promise.resolve({ data: [{ document: 'terms', version: '4.1.0' }], error: null });
      const call: (typeof calls)[number] = { args };
      calls.push(call);
      const code = answers[calls.length - 1] ?? null;
      return { setHeader: (h: string, v: string) => ((call.key = h === HEADER_IDEMPOTENCY_KEY ? v : undefined), Promise.resolve({ error: code ? { code } : null })) };
    },
  };
  return { sb: sb as never, calls };
}
const run = (sb: never) => recordConsent(sb, 'terms', true, 'apple', 'asha-parent');

describe('consent before the migration is applied', () => {
  it('[NS-42-R7] the call site sends the language of the words shown', async () => {
    const { sb, calls } = stub([null]);
    await run(sb);
    expect(calls[0].args.p_locale).toBe('xx');
  });

  it.each(['PGRST202', '42883'])('retries once in the old form on %s, with the same key, and records one act', async (code) => {
    const { sb, calls } = stub([code, null]);
    await run(sb);
    expect(calls).toHaveLength(2);
    expect(calls[0].args).toHaveProperty('p_app_build');
    expect(calls[1].args).not.toHaveProperty('p_app_build');
    expect(calls[1].args).not.toHaveProperty('p_os_major');
    expect(calls[1].args).toMatchObject({ p_locale: 'xx', p_context: { auth: 'apple', age_attested: true } });
    expect(calls[1].args.p_rendered_sha256).toBe(calls[0].args.p_rendered_sha256);
    expect(calls[1].key).toBe(calls[0].key);
  });

  it.each(['23502', '42501', 'SCCON', 'PGRST301'])('never retries a real refusal (%s)', async (code) => {
    const { sb, calls } = stub([code, null]);
    await expect(run(sb)).rejects.toMatchObject({ code });
    expect(calls).toHaveLength(1);
  });

  it('retries only once, then gives the error', async () => {
    const { sb, calls } = stub(['PGRST202', 'PGRST202', null]);
    await expect(run(sb)).rejects.toMatchObject({ code: 'PGRST202' });
    expect(calls).toHaveLength(2);
  });
});
