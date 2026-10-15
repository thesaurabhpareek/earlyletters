/**
 * BL-330, security review H3: the app posts Apple's one-time authorization
 * code to the apple-token Edge Function once after native sign-in
 * (F02-REQ-022, F02-REQ-004). The function side is tested in Deno
 * (supabase/functions/apple-token/handler.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { APPLE_TOKEN_FUNCTION, captureAppleRefreshToken, type InvokeFn } from '../src/lib/auth/apple-token';

const CODE = 'c0a5a.0.asha-apple-authorization-code-fixture';
const noSleep = async () => {};

function recorder(results: ({ error: unknown } | Error)[]) {
  const calls: { name: string; body: unknown }[] = [];
  const invoke: InvokeFn = async (name, options) => {
    calls.push({ name, body: options.body });
    const r = results.shift() ?? { error: null };
    if (r instanceof Error) throw r;
    return r;
  };
  return { invoke, calls };
}

describe('[F02-REQ-022] Apple authorization code to apple-token', () => {
  it('[F02-REQ-022] posts the code once, in the body, to apple-token/v1', async () => {
    const { invoke, calls } = recorder([{ error: null }]);
    expect(await captureAppleRefreshToken(invoke, CODE, { sleep: noSleep })).toBe('stored');
    expect(calls).toEqual([{ name: APPLE_TOKEN_FUNCTION, body: { code: CODE } }]);
    expect(APPLE_TOKEN_FUNCTION).toBe('apple-token/v1');
  });

  it('[F02-REQ-022] no code (older iOS, cancelled) or a malformed one: nothing is sent', async () => {
    const { invoke, calls } = recorder([]);
    expect(await captureAppleRefreshToken(invoke, null, { sleep: noSleep })).toBe('skipped');
    expect(await captureAppleRefreshToken(invoke, 'bad code with spaces', { sleep: noSleep })).toBe('skipped');
    expect(calls).toHaveLength(0);
  });

  it('[F02-REQ-022] a network or server failure retries once, then gives up without failing sign-in', async () => {
    const net = recorder([new Error('offline'), { error: null }]);
    expect(await captureAppleRefreshToken(net.invoke, CODE, { sleep: noSleep })).toBe('stored');
    expect(net.calls).toHaveLength(2);
    const down = recorder([{ error: { context: { status: 503 } } }, { error: { context: { status: 502 } } }]);
    expect(await captureAppleRefreshToken(down.invoke, CODE, { sleep: noSleep })).toBe('failed');
    expect(down.calls).toHaveLength(2);
  });

  it('[F02-REQ-022] a refusal (used or expired code, not an Apple account) is not retried', async () => {
    const { invoke, calls } = recorder([{ error: { context: { status: 400 } } }]);
    expect(await captureAppleRefreshToken(invoke, CODE, { sleep: noSleep })).toBe('refused');
    expect(calls).toHaveLength(1);
  });
});
