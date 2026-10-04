// Pure parts of the purge worker: Apple token wrapping and revoke responses, the bucket
// registry, config parsing, and the copy rules for every email the worker sends.
import assert from 'node:assert/strict';
import { CANARY } from '../../_shared/log/canary.ts';
import { LOGGABLE_BUCKETS } from '../../_shared/log/log.ts';
import { makeClientSecret, revokeAppleToken, unwrapAppleToken, wrapAppleToken } from '../lib/apple.ts';
import { BUCKETS, mirrorPrefixes, ownedObjectAction, profilePrefixes, rehomedChildPhotoPath } from '../lib/buckets.ts';
import { ServiceError, safeEqual } from '../lib/http.ts';
import { readConfig } from '../config.ts';
import { workerCopy } from '../copy.ts';
import { alertEmail, contributorNoticeEmail, deletionCancelledEmail, deletionCompletedEmail, deletionRequestedEmail } from '../emails.ts';
import { conditionsFromSla } from '../alerts.ts';
import { appleTestKey, KEK } from './helpers.ts';

Deno.test('Apple refresh tokens are wrapped with AES-GCM bound to the profile id', async () => {
  const w = await wrapAppleToken(KEK, 1, CANARY.profileId, CANARY.appleRefreshToken);
  assert.match(w.ciphertext, /^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
  assert.ok(!w.ciphertext.includes(CANARY.appleRefreshToken));
  assert.equal(await unwrapAppleToken(KEK, CANARY.profileId, w.ciphertext), CANARY.appleRefreshToken);
  await assert.rejects(() => unwrapAppleToken(KEK, CANARY.coParentId, w.ciphertext), (e) => e instanceof ServiceError && e.code === 'decrypt_failed');
  await assert.rejects(() => wrapAppleToken('c2hvcnQ=', 1, CANARY.profileId, 'x'), (e) => e instanceof ServiceError && e.code === 'config');
});

Deno.test('the client secret rejects malformed team or key ids and bad PEM', async () => {
  const key = await appleTestKey();
  await assert.rejects(() => makeClientSecret({ teamId: 'short', keyId: 'KEY1234567', privateKeyPem: key.pem }, 'x'), (e) => e instanceof ServiceError && e.code === 'config');
  await assert.rejects(() => makeClientSecret({ teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: 'not a key' }, 'x'), (e) => e instanceof ServiceError && e.code === 'config');
  // Escaped newlines (how secrets are often pasted) work.
  const escaped = key.pem.replace(/\n/g, '\\n');
  assert.equal((await makeClientSecret({ teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: escaped }, 'com.earlyletters.scribe')).split('.').length, 3);
});

Deno.test('revoke: 200 revoked, invalid_grant already invalid, invalid_client config, 5xx transient', async () => {
  const answer = (status: number, body?: unknown) => () => Promise.resolve(new Response(body ? JSON.stringify(body) : null, { status }));
  const args = { clientId: 'c', clientSecret: 's', token: 't' };
  assert.equal(await revokeAppleToken(answer(200), args), 'revoked');
  assert.equal(await revokeAppleToken(answer(400, { error: 'invalid_grant' }), args), 'already_invalid');
  await assert.rejects(() => revokeAppleToken(answer(400, { error: 'invalid_client' }), args), (e) => e instanceof ServiceError && e.code === 'invalid_client' && !e.transient);
  await assert.rejects(() => revokeAppleToken(answer(503), args), (e) => e instanceof ServiceError && e.transient);
  await assert.rejects(() => revokeAppleToken(() => Promise.reject(new TypeError('dns')), args), (e) => e instanceof ServiceError && e.code === 'network');
});

Deno.test('bucket registry: loggable names match, prefixes mirror by scope, ownership actions', () => {
  assert.deepEqual([...LOGGABLE_BUCKETS].sort(), BUCKETS.map((b) => b.id).sort());
  const book = CANARY.childId, uid = CANARY.profileId;
  const all = new Set(BUCKETS.map((b) => b.id));
  assert.deepEqual(mirrorPrefixes(`${book}/`, all).map((m) => m.bucket).sort(), ['child-photos', 'entry-audio', 'inbox']);
  assert.deepEqual(mirrorPrefixes(`${book}/${uid}/`, all).map((m) => m.bucket).sort(), ['entry-audio', 'inbox']);
  assert.deepEqual(mirrorPrefixes(`${book}/`, new Set(['entry-photos'])), []);
  assert.deepEqual(mirrorPrefixes('not-a-prefix', all), []);
  assert.deepEqual(profilePrefixes(uid, all).map((p) => p.bucket).sort(), ['avatars', 'exports']);
  assert.deepEqual(profilePrefixes('../etc', all), []);
  assert.deepEqual(ownedObjectAction('entry-photos', `${book}/${uid}/x.jpg`, uid), { kind: 'delete' });
  assert.deepEqual(ownedObjectAction('entry-photos', `${book}/${CANARY.coParentId}/x.jpg`, uid), { kind: 'report' });
  assert.deepEqual(ownedObjectAction('child-photos', `${book}/x.jpg`, uid), { kind: 'rehome', childId: book });
  assert.deepEqual(ownedObjectAction('avatars', `${uid}/a.png`, uid), { kind: 'delete' });
  assert.deepEqual(ownedObjectAction('ops-ledger', 'purges/x.jsonl', uid), { kind: 'report' });
  assert.equal(rehomedChildPhotoPath(book, `${book}/old.HEIC`, '0192e000-0000-7000-8000-0000000000c2'), `${book}/0192e000-0000-7000-8000-0000000000c2.heic`);
  assert.equal(rehomedChildPhotoPath(book, `${book}/old.gif`, '0192e000-0000-7000-8000-0000000000c2'), null);
});

Deno.test('config: required secrets, Apple only when complete, budget bounds', () => {
  const env = (m: Record<string, string>) => (n: string) => m[n];
  const base = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', PURGE_WORKER_SECRET: 's', RESEND_API_KEY: 'r' };
  assert.deepEqual(readConfig(env({})).missing, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'PURGE_WORKER_SECRET', 'RESEND_API_KEY']);
  const c = readConfig(env(base)).config!;
  assert.equal(c.apple, null);
  assert.equal(c.alertTo, 'hello@earlyletters.com');
  assert.equal(c.mailFrom, 'Early Letters <hello@earlyletters.com>');
  assert.equal(c.budgetMs, 110_000);
  assert.equal(c.resendContacts, false);
  assert.equal(readConfig(env({ ...base, RESEND_CONTACTS: 'on' })).config!.resendContacts, true);
  const full = readConfig(env({ ...base, APPLE_TEAM_ID: 'TEAM123456', APPLE_SIGNIN_KEY_ID: 'KEY1234567', APPLE_SIGNIN_PRIVATE_KEY: 'pem', APPLE_SERVICES_ID: 'com.earlyletters.web', TOKEN_KEK_V1: 'a', TOKEN_KEK_V2: 'b', PURGE_WORKER_BUDGET_MS: '999999999' })).config!;
  assert.deepEqual(full.apple!.clientIds, ['com.earlyletters.scribe', 'com.earlyletters.web']);
  assert.deepEqual(Object.keys(full.tokenKeks), ['1', '2']);
  assert.equal(full.budgetMs, 110_000);
});

Deno.test('safeEqual compares secrets without short-circuit on content', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('', ''), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
});

Deno.test('SLA counts map to alert kinds; a silent purge is an alert', () => {
  const zero = { tombstones_overdue: 0, requests_executing_over_24h: 0, requests_executing_over_7d: 0, steps_failed: 0, steps_retrying: 0, queue_stuck: 0, queue_attempts_high: 0, scheduled_overdue: 0, holds_past_review: 0, purge_run_age_minutes: 5 };
  assert.deepEqual(conditionsFromSla(zero), []);
  assert.deepEqual(conditionsFromSla({ ...zero, queue_stuck: 1, queue_attempts_high: 2, purge_run_age_minutes: null }), [['queue_stuck', 3], ['purge_silent', 1]]);
});

// The same character and tone rules as packages/content/test/rules.test.ts, for the worker's own copy.
Deno.test('every worker email follows the content rules and carries no content', () => {
  const ref = '3c0ffee0-0000-4000-8000-000000000001';
  const mails = [
    deletionRequestedEmail({ scheduledFor: '2026-12-05T10:00:00Z', reference: ref }),
    deletionCancelledEmail({ reference: ref }),
    deletionCompletedEmail({ completedAt: '2026-12-05T10:00:00Z', reference: ref, hadSubscription: false }),
    deletionCompletedEmail({ completedAt: '2026-12-05T10:00:00Z', reference: ref, hadSubscription: null }),
    contributorNoticeEmail({ scheduledFor: '2026-12-05T10:00:00Z' }),
    alertEmail({ conditions: [{ kind: 'request_stuck', count: 2 }], run: 'abcdefabcdef', at: new Date('2026-12-05T10:00:00Z') }),
  ];
  const strings = [...mails.flatMap((m) => [m.subject, m.text]), ...JSON.stringify(workerCopy).split('"')];
  for (const s of strings) {
    assert.doesNotMatch(s, /[—–‘’“”…]/, s);
    assert.doesNotMatch(s, /\p{Extended_Pictographic}/u, s);
    assert.doesNotMatch(s, /\b(too late|lost forever|never get back|regrets?|die|death|dead|passed away)\b/i, s);
    assert.doesNotMatch(s, /\b(AI|smart|magic(al)?|generat(e|es|ed|ing)|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/, s);
  }
  for (const m of mails) assert.doesNotMatch(m.subject + m.text, /\{\w+\}/, 'no unfilled placeholder');
  assert.ok(!/Apple Account subscriptions/.test(mails[2].text), 'no billing line when there was no subscription');
  assert.ok(/Apple Account subscriptions/.test(mails[3].text), 'billing line when unknown');
  assert.ok(mails.slice(0, 4).every((m) => m.text.includes(ref)));
  assert.match(mails[0].subject, /December 5, 2026/);
});
