// Shared request handling for JSON Edge Functions (ADR 0017). Run: npm run test:functions.
import assert from 'node:assert/strict';
import { PAUSED_RETRY_AFTER_SECONDS } from '../../../../packages/api/src/standards.ts';
import { KILL_SWITCH_KEYS } from '../../../../packages/api/src/kill-switches.ts';
import {
  clientIp, codeHmac, failReply, idempotencyKeyOf, okReply, PAUSED_RETRY_AFTER, pausedReply, readBody, serverKilled, subjectHash,
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

Deno.test('bodies are capped by Content-Length and by bytes read', async () => {
  const big = new Request('https://x/', { method: 'POST', body: 'é'.repeat(600) });
  assert.deepEqual(await readBody(big, 1000), { ok: false, reason: 'too_large' });
  const small = new Request('https://x/', { method: 'POST', body: '{"a":1}' });
  assert.deepEqual(await readBody(small, 1000), { ok: true, text: '{"a":1}' });
});

Deno.test('[B-NFR-004] subject hashes rotate daily and never contain the input', async () => {
  const s = 's'.repeat(40);
  const d1 = await subjectHash(s, 'ip', '203.0.113.7', new Date('2026-10-15T01:00:00Z'));
  const d1b = await subjectHash(s, 'ip', '203.0.113.7', new Date('2026-10-15T23:00:00Z'));
  const d2 = await subjectHash(s, 'ip', '203.0.113.7', new Date('2026-10-16T01:00:00Z'));
  const dev = await subjectHash(s, 'device', '203.0.113.7', new Date('2026-10-15T01:00:00Z'));
  assert.equal(d1, d1b);
  assert.notEqual(d1, d2);
  assert.notEqual(d1, dev);
  assert.match(d1, /^[0-9a-f]{32}$/);
  assert.equal(clientIp(new Request('https://x/', { headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' } })), '203.0.113.7');
  assert.equal((await codeHmac('p'.repeat(40), '7K3M9QXZ')).length, 64);
});
