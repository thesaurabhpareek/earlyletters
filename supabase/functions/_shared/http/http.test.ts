// Shared request handling for JSON Edge Functions (ADR 0017). Run: npm run test:functions.
import assert from 'node:assert/strict';
import { PAUSED_RETRY_AFTER_SECONDS } from '../../../../packages/api/src/standards.ts';
import { KILL_SWITCH_KEYS } from '../../../../packages/api/src/kill-switches.ts';
import {
  clientIp, codeHmac, failReply, idempotencyKeyOf, okReply, PAUSED_RETRY_AFTER, pausedReply, readBody, serverKilled, sessionOf, subjectHashes, timedRequest,
} from './http.ts';

Deno.test('[ADR-0017] the envelope carries the request id in the header and the body, never cached', async () => {
  const ok = okReply({ a: 1 }, '0123456789ab');
  assert.equal(ok.headers.get('x-request-id'), '0123456789ab');
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.equal(ok.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await ok.json(), { ok: true, data: { a: 1 }, requestId: '0123456789ab' });
  const bad = failReply({ code: 'immutable', retryable: false, sqlstate: 'SCIMM', message: 'Asha' } as never, '0123456789ab');
  assert.equal(bad.status, 409);
  assert.deepEqual(await bad.json(), { ok: false, error: { code: 'immutable', retryable: false, sqlstate: 'SCIMM' }, requestId: '0123456789ab' });
});

Deno.test('[ADR-0016] paused answers name the switch and ask for the packaged wait', async () => {
  assert.equal(PAUSED_RETRY_AFTER, PAUSED_RETRY_AFTER_SECONDS);
  const r = pausedReply('escrow', '0123456789ab');
  assert.equal(r.status, 503);
  assert.equal(r.headers.get('retry-after'), String(PAUSED_RETRY_AFTER_SECONDS));
  assert.deepEqual((await r.json()).error, { code: 'paused', retryable: true, detail: 'escrow' });
});

Deno.test('[ADR-0016] KILL_SWITCHES uses the remote-config vocabulary and nothing else', () => {
  const env = (v: string) => (n: string) => (n === 'KILL_SWITCHES' ? v : undefined);
  for (const k of KILL_SWITCH_KEYS) assert.equal(serverKilled(env(k), k), true, k);
  assert.equal(serverKilled(env('recording,export'), 'sync'), false);
  assert.equal(serverKilled(() => undefined, 'invites'), false);
  assert.equal(serverKilled(env(' invites , sync'), 'sync'), true);
});

Deno.test('[ADR-0017] idempotency keys: malformed refused, missing refused only where required', () => {
  const r = (h?: string) => new Request('https://x/', { headers: h === undefined ? {} : { 'Idempotency-Key': h } });
  assert.deepEqual(idempotencyKeyOf(r(), false), { ok: true, key: null });
  assert.deepEqual(idempotencyKeyOf(r(), true), { ok: false });
  assert.deepEqual(idempotencyKeyOf(r('nope'), false), { ok: false });
  assert.deepEqual(idempotencyKeyOf(r('0192E000-0000-7000-8000-000000000123'), true), { ok: true, key: '0192e000-0000-7000-8000-000000000123' });
});

Deno.test('bodies are capped by Content-Length and by bytes read, streaming', async () => {
  const big = new Request('https://x/', { method: 'POST', body: 'é'.repeat(600) });
  assert.deepEqual(await readBody(big, 1000), { ok: false, reason: 'too_large' });
  const small = new Request('https://x/', { method: 'POST', body: '{"a":1}' });
  assert.deepEqual(await readBody(small, 1000), { ok: true, text: '{"a":1}' });
  assert.deepEqual(await readBody(new Request('https://x/'), 10), { ok: true, text: '' });
});

Deno.test('[B-NFR-004] subject hashes rotate daily, overlap in the first hour, and never contain the input', async () => {
  const s = 's'.repeat(40);
  const [d1] = await subjectHashes(s, 'ip', '203.0.113.7', new Date('2026-10-15T01:00:00Z'));
  const [d1b] = await subjectHashes(s, 'ip', '203.0.113.7', new Date('2026-10-15T23:00:00Z'));
  const early = await subjectHashes(s, 'ip', '203.0.113.7', new Date('2026-10-16T00:20:00Z'));
  const [dev] = await subjectHashes(s, 'device', '203.0.113.7', new Date('2026-10-15T01:00:00Z'));
  assert.equal(d1, d1b);
  assert.equal(early.length, 2, 'first hour of a day carries yesterday too');
  assert.notEqual(early[0], d1);
  assert.equal(early[1], d1, 'so the rolling hour does not restart at midnight');
  assert.notEqual(d1, dev);
  assert.match(d1, /^[0-9a-f]{32}$/);
  assert.equal((await codeHmac('p'.repeat(40), '7K3M9QXZ')).length, 64);
});

Deno.test('client IP: exactly one configured header, never X-Forwarded-For; normalised; IPv6 by /64', () => {
  const ip = (h: Record<string, string>, name: string | undefined = 'cf-connecting-ip') => clientIp(new Request('https://x/', { headers: h }), name);
  assert.equal(ip({ 'x-forwarded-for': '203.0.113.7' }), '');
  assert.equal(ip({ 'x-forwarded-for': '203.0.113.7' }, 'x-forwarded-for'), '', 'x-forwarded-for can never be configured');
  assert.equal(ip({ 'cf-connecting-ip': '203.0.113.7', 'x-real-ip': '198.51.100.1' }), '203.0.113.7');
  assert.equal(ip({ 'cf-connecting-ip': '9.9.9.9', 'x-real-ip': '203.0.113.8' }, 'x-real-ip'), '203.0.113.8', 'a forged other header is ignored');
  assert.equal(ip({ 'cf-connecting-ip': '203.0.113.7' }, ''), '', 'no header configured');
  assert.equal(ip({ 'cf-connecting-ip': '2001:db8:0:12::1' }), '2001:db8:0:12::/64');
  assert.equal(ip({ 'cf-connecting-ip': '2001:0db8:0000:0012:ffff:1:2:3' }), '2001:db8:0:12::/64');
  assert.equal(ip({ 'cf-connecting-ip': '::ffff:203.0.113.7' }), '203.0.113.7');
  assert.equal(ip({ 'cf-connecting-ip': '203.0.113.7:443' }), '203.0.113.7');
  assert.equal(ip({ 'cf-connecting-ip': '[2001:db8::1]:443' }), '2001:db8:0:0::/64');
  assert.equal(ip({ 'cf-connecting-ip': 'fe80::1%en0' }), 'fe80:0:0:0::/64');
  assert.equal(ip({ 'cf-connecting-ip': '203.0.113.7, 10.0.0.1' }), '203.0.113.7');
  assert.equal(ip({ 'cf-connecting-ip': '999.1.1.1' }), '');
  assert.equal(ip({ 'cf-connecting-ip': 'not an ip' }), '');
});

Deno.test('upstream bodies are read inside the timeout; a slow body is cut off', async () => {
  const slow = (_u: string, init?: RequestInit) => Promise.resolve(new Response(new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode('{"a":'));
      init?.signal?.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')));
    },
  })));
  assert.equal(await timedRequest(slow, 'https://x/', {}, 50), null);
  const ok = await timedRequest(() => Promise.resolve(new Response('{"a":1}', { status: 201 })), 'https://x/', {}, 50);
  assert.deepEqual(ok, { status: 201, ok: true, text: '{"a":1}' });
});

Deno.test('sessions: only is_anonymous === false is a full account', async () => {
  const f = (body: unknown, status = 200) => () => Promise.resolve(new Response(JSON.stringify(body), { status }));
  const id = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(await sessionOf(f({ id, is_anonymous: false }), 'https://s', 'k', 't', 100), { kind: 'ok', profileId: id });
  assert.deepEqual(await sessionOf(f({ id, is_anonymous: true }), 'https://s', 'k', 't', 100), { kind: 'anonymous' });
  assert.deepEqual(await sessionOf(f({ id }), 'https://s', 'k', 't', 100), { kind: 'anonymous' });
  assert.deepEqual(await sessionOf(f({}, 401), 'https://s', 'k', 't', 100), { kind: 'unauthorized' });
  assert.deepEqual(await sessionOf(f({}), 'https://s', 'k', null, 100), { kind: 'unauthorized' });
});
