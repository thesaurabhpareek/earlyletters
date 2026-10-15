// Purge worker behaviour against fake vendors (TC-19: retries are idempotent; DATA-REQ-019 to -036).
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read supabase/functions scripts/ops
import assert from 'node:assert/strict';
import { CANARY } from '../../_shared/log/canary.ts';
import { findCanaries } from '../../_shared/log/canary.ts';
import { APPLE_AUDIENCE } from '../lib/apple.ts';
import { ALERT_AFTER_ATTEMPTS } from '../account.ts';
import { advance, appleTestKey, ashaWorld, BUNDLE_ID, run, testConfig } from './helpers.ts';
import { FakeWorld } from './fake.ts';

const DAY = 86_400_000;
const b64urlDecode = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

Deno.test('an account deletion runs every step in order and finalizes with a counts-only receipt', async () => {
  const key = await appleTestKey();
  const { w, uid, co, child, req, photo } = await ashaWorld();
  const config = testConfig({ apple: { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: key.pem, clientIds: [BUNDLE_ID] } });
  const { summary, log } = await run(w, config);

  assert.deepEqual(summary.accounts, { finalized: 1 });
  // Storage: their photo gone, the co-parent's untouched, the book's photo re-homed and repointed.
  assert.equal(w.has('entry-photos', `${child}/${uid}/${CANARY.entryId}.jpg`), false);
  assert.equal(w.names('entry-photos').length, 1);
  assert.equal(w.has('child-photos', photo), false);
  const newPhoto = w.childPhotos.get(child)!;
  assert.notEqual(newPhoto, photo);
  assert.equal(w.has('child-photos', newPhoto), true);
  assert.equal(w.objects.get('child-photos')!.get(newPhoto)!.owner, null);
  // Apple: one revoke with a valid ES256 client secret for the bundle id; token row deleted.
  assert.equal(w.appleCalls.length, 1);
  const call = w.appleCalls[0];
  assert.equal(call.get('client_id'), BUNDLE_ID);
  assert.equal(call.get('token'), CANARY.appleRefreshToken);
  assert.equal(call.get('token_type_hint'), 'refresh_token');
  const [h, p, s] = call.get('client_secret')!.split('.');
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(h)));
  const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
  assert.deepEqual(header, { alg: 'ES256', kid: 'KEY1234567' });
  assert.equal(claims.iss, 'TEAM123456');
  assert.equal(claims.aud, APPLE_AUDIENCE);
  assert.equal(claims.sub, BUNDLE_ID);
  assert.ok(claims.exp > claims.iat && claims.exp - claims.iat <= 15_777_000);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key.publicKey, b64urlDecode(s), new TextEncoder().encode(`${h}.${p}`)));
  assert.equal(w.appleTokens.size, 0);
  // Email provider contact removed; completion receipt sent with the reference and the Apple billing line.
  assert.deepEqual(w.contactDeletes, [CANARY.parentEmail]);
  const receipt = w.emails.find((e) => e.subject === 'Your account has been deleted')!;
  assert.equal(receipt.to, CANARY.parentEmail);
  assert.match(receipt.text, new RegExp(req.id));
  assert.match(receipt.text, /If you have Plus[^\n]*Subscriptions/);
  assert.equal(receipt.idempotencyKey, `deletion-completed:${req.id}`);
  // Auth user deleted; co-parent untouched; receipt finalized with counts and step outcomes only.
  assert.equal(w.users.has(uid), false);
  assert.equal(w.users.has(co), true);
  const final = w.finalized.get(req.id)!;
  assert.deepEqual(final.counts, { letters: 2, books: 1, objects: 1, rehomed: 1 });
  assert.equal(final.apple, 'revoked');
  assert.equal(final.verified, true);
  assert.deepEqual(final.steps, {
    storage_objects: 'done', apple_token_revoke: 'done', posthog: 'not_applicable', email_provider: 'done',
    receipt_email: 'done', auth_user: 'done', powersync_verify: 'not_applicable',
  });
  assert.ok(JSON.stringify(final).length <= 2048);
  // Order: storage before Apple before receipt before auth, verified before finalize.
  const order = w.rpcCalls.map((c) => c.fn === 'record_deletion_step' ? `step:${c.args.p_step}` : c.fn)
    .filter((n) => n.startsWith('step:') || n === 'finalize_account_deletion' || n === 'prepare_account_purge');
  assert.deepEqual(order, ['prepare_account_purge', 'step:storage_objects', 'step:apple_token_revoke', 'step:posthog',
    'step:powersync_verify', 'step:email_provider', 'step:receipt_email', 'step:auth_user', 'finalize_account_deletion']);
  // Log canary: no fixture, id, email or token anywhere in the logs.
  assert.deepEqual(findCanaries(log.raw.join('\n')), []);
});

Deno.test('ids travel only in request bodies, never in Supabase URLs (except the Auth admin user path)', async () => {
  const { w } = await ashaWorld({ apple: false });
  await run(w, testConfig());
  const leaks = w.traffic.filter((t) => t.url.startsWith('https://fake-project') && !t.url.includes('/auth/v1/admin/users/') && !t.url.includes('/storage/v1/object/child-photos/'))
    .filter((t) => findCanaries(decodeURIComponent(new URL(t.url).pathname + new URL(t.url).search)).length);
  assert.deepEqual(leaks.map((l) => l.method), []);
});

Deno.test('without Resend contacts (v1.0) the email_provider step is not applicable and needs no full-access key', async () => {
  const { w, req } = await ashaWorld({ apple: false });
  await run(w, testConfig({ resendContacts: false }));
  assert.deepEqual(w.contactDeletes, []);
  assert.equal(w.step(req.id, 'email_provider')!.status, 'not_applicable');
  assert.equal(w.finalized.size, 1);
});

Deno.test('a failing receipt email retries with backoff and never deletes the Auth user first', async () => {
  const { w, uid, req } = await ashaWorld({ apple: false });
  w.resendStatus = 503;
  const { summary } = await run(w, testConfig());
  assert.deepEqual(summary.accounts, { waiting: 1 });
  const step = w.step(req.id, 'receipt_email')!;
  assert.equal(step.status, 'pending');
  assert.equal(step.last_error_code, 'http_503');
  assert.equal(w.step(req.id, 'auth_user')!.status, 'pending');
  assert.equal(w.users.has(uid), true);
  assert.equal(w.finalized.size, 0);

  // Inside the backoff window nothing is retried.
  const sent = w.emails.length;
  await run(w, testConfig());
  assert.equal(w.step(req.id, 'receipt_email')!.attempts, 1);
  assert.equal(w.emails.length, sent);

  // After the backoff, with Resend back, the request completes. Earlier steps are not re-run.
  w.resendStatus = 200;
  advance(w, 2 * 60_000);
  const contactCalls = w.contactDeletes.length;
  const second = await run(w, testConfig());
  assert.deepEqual(second.summary.accounts, { finalized: 1 });
  assert.equal(w.contactDeletes.length, contactCalls);
  assert.equal(w.users.has(uid), false);
});

Deno.test('after 7 days of failures a step is marked failed and one content-free alert goes to hello@', async () => {
  const { w, req } = await ashaWorld({ apple: false });
  w.requests[0].executing_at = new Date(w.now.getTime() - 8 * DAY).toISOString();
  w.resendStatus = 500;
  w.sla = { ...w.sla, requests_executing_over_24h: 1, requests_executing_over_7d: 1 };
  const { log } = await run(w, testConfig());
  assert.equal(w.step(req.id, 'receipt_email')!.status, 'failed');
  // The alert itself goes out through Resend; make it succeed for the alert only.
  assert.equal(w.emails.length, 0);
  w.resendStatus = 200;
  advance(w, 60_000);
  w.alertState.clear();
  const second = await run(w, testConfig());
  const alert = w.emails.find((e) => e.to === 'hello@earlyletters.com')!;
  assert.ok(alert, 'alert sent');
  assert.match(alert.subject, /Deletion pipeline needs attention/);
  assert.match(alert.text, /step_failed/);
  assert.match(alert.text, /docs\/ops\/runbooks\/stuck-deletion\.md/);
  assert.deepEqual(findCanaries(alert.subject + alert.text, { emails: ['hello@earlyletters.com'] }), []);
  assert.deepEqual(findCanaries(log.raw.join('\n') + second.log.raw.join('\n')), []);
  // A failed step stops the request: no Auth deletion, no finalize.
  assert.equal(w.finalized.size, 0);
  // The same condition does not mail again within a day.
  const count = w.emails.length;
  advance(w, 15 * 60_000);
  await run(w, testConfig());
  assert.equal(w.emails.length, count);
});

Deno.test('alert email failures release the claim so the next run retries', async () => {
  const w = new FakeWorld();
  w.sla = { ...w.sla, tombstones_overdue: 3 };
  w.resendStatus = 503;
  await run(w, testConfig());
  assert.equal(w.alertState.get('tombstones_overdue'), null);
  w.resendStatus = 200;
  await run(w, testConfig());
  assert.equal(w.emails.length, 1);
  assert.match(w.emails[0].text, /tombstones_overdue: 3/);
});

Deno.test('an Apple user with no stored token: nothing to revoke, the receipt says so, the founder is told', async () => {
  const { w, req } = await ashaWorld({ token: false });
  await run(w, testConfig());
  assert.equal(w.appleCalls.length, 0);
  assert.equal(w.step(req.id, 'apple_token_revoke')!.status, 'not_applicable');
  assert.equal(w.finalized.get(req.id)!.apple, 'no_token');
  assert.ok(w.emails.some((e) => e.to === 'hello@earlyletters.com' && /apple_no_token/.test(e.text)));
});

Deno.test('a stored Apple token without the key configured retries and alerts apple_config', async () => {
  const { w, req, uid } = await ashaWorld();
  await run(w, testConfig({ apple: null }));
  const step = w.step(req.id, 'apple_token_revoke')!;
  assert.equal(step.status, 'pending');
  assert.equal(step.last_error_code, 'config');
  assert.equal(w.users.has(uid), true);
  assert.ok(w.emails.some((e) => /apple_config/.test(e.text) && /docs\/ops\/SECURITY\.md/.test(e.text)));
});

Deno.test('Apple says invalid_grant: the token is already unusable, the step completes', async () => {
  const key = await appleTestKey();
  const { w, req } = await ashaWorld();
  w.appleResponse = { status: 400, body: { error: 'invalid_grant' } };
  await run(w, testConfig({ apple: { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: key.pem, clientIds: [BUNDLE_ID] } }));
  assert.equal(w.finalized.get(req.id)!.apple, 'already_invalid');
});

Deno.test('Apple says invalid_client: our configuration, retried with an apple_config alert', async () => {
  const key = await appleTestKey();
  const { w, req } = await ashaWorld();
  w.appleResponse = { status: 400, body: { error: 'invalid_client' } };
  await run(w, testConfig({ apple: { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: key.pem, clientIds: [BUNDLE_ID] } }));
  assert.equal(w.step(req.id, 'apple_token_revoke')!.last_error_code, 'invalid_client');
  assert.ok(w.emails.some((e) => /apple_config/.test(e.text)));
});

Deno.test('an object in an unexpected place blocks the Auth deletion and is never deleted automatically', async () => {
  const { w, uid, co, child, req } = await ashaWorld({ apple: false });
  const odd = `${child}/${co}/odd-upload.jpg`;
  w.put('entry-photos', odd, uid);
  await run(w, testConfig());
  assert.equal(w.step(req.id, 'storage_objects')!.status, 'pending');
  assert.equal(w.step(req.id, 'storage_objects')!.last_error_code, 'ownership');
  assert.equal(w.has('entry-photos', odd), true);
  assert.equal(w.users.has(uid), true);
});

Deno.test('a held request stops at prepare', async () => {
  const { w, req } = await ashaWorld({ apple: false });
  w.prepareResult = { held: true };
  const { summary } = await run(w, testConfig());
  assert.deepEqual(summary.accounts, { held: 1 });
  assert.equal(w.step(req.id, 'storage_objects')!.attempts, 0);
});

Deno.test('residue at verification keeps the request open and alerts', async () => {
  const { w, req } = await ashaWorld({ apple: false });
  w.extraResidue = [{ table_schema: 'public', table_name: 'dictionary_terms', column_name: 'owner_id' }];
  const { summary } = await run(w, testConfig());
  assert.deepEqual(summary.accounts, { residue: 1 });
  assert.equal(w.finalized.size, 0);
  assert.ok(w.emails.some((e) => /residue/.test(e.text)));
  assert.equal(w.requests.find((r) => r.id === req.id)!.status, 'executing');
});

Deno.test('purge_due is called in bounded batches while it says there is more', async () => {
  const w = new FakeWorld();
  w.purgeResults = [
    { books: 1, entries: 500, accounts_due: 0, more: true },
    { books: 0, entries: 500, accounts_due: 0, more: true },
    { books: 0, entries: 12, accounts_due: 1, more: false },
  ];
  const { summary } = await run(w, testConfig());
  assert.equal(w.purgeCalls, 3);
  assert.deepEqual(summary.purge, { calls: 3, books: 1, letters: 1012, accounts: 1, failed: false });
  const always = new FakeWorld();
  always.purgeResults = Array.from({ length: 20 }, () => ({ books: 0, entries: 500, accounts_due: 0, more: true }));
  await run(always, testConfig());
  assert.equal(always.purgeCalls, 10);
});

Deno.test('a failing purge_due raises purge_failing', async () => {
  const w = new FakeWorld();
  w.purgeError = 500;
  const { summary } = await run(w, testConfig());
  assert.equal(summary.purge.failed, true);
  assert.ok(w.emails.some((e) => /purge_failing/.test(e.text)));
});

Deno.test('the queue is drained through the Storage API, mirrored into every registered bucket that exists', async () => {
  const w = new FakeWorld();
  const book = CANARY.childId;
  w.buckets.add('child-photos');
  w.put('entry-photos', `${book}/${CANARY.profileId}/a.jpg`);
  w.put('entry-photos', `${book}/${CANARY.coParentId}/b.jpg`);
  w.put('child-photos', `${book}/0192e000-0000-7000-8000-0000000000c1.jpg`);
  w.put('entry-photos', 'other/keep.jpg');
  const whole = w.enqueue('entry-photos', `${book}/`, true);
  w.put('entry-photos', `${CANARY.childId}x/one.jpg`);
  const exact = w.enqueue('entry-photos', `${CANARY.childId}x/one.jpg`, false);
  const missing = w.enqueue('entry-audio', `${book}/`, true);
  const { summary } = await run(w, testConfig());
  assert.deepEqual(w.names('entry-photos'), ['other/keep.jpg']);
  assert.deepEqual(w.names('child-photos'), []);
  assert.equal(summary.queue.objects, 4);
  assert.ok([whole, exact, missing].every((id) => w.queue.find((q) => q.id === id)!.done), 'rows for absent buckets are done too');
});

Deno.test('a Storage failure marks the row for backoff with the HTTP status only', async () => {
  const w = new FakeWorld();
  const id = w.enqueue('entry-photos', `${CANARY.childId}/`, true);
  w.put('entry-photos', `${CANARY.childId}/x.jpg`);
  const original = w.fetch;
  w.fetch = async (input, init) => (input.includes('/object/list/') ? new Response('{"message":"boom asha"}', { status: 502 }) : original(input, init));
  await run(w, testConfig());
  const row = w.queue.find((q) => q.id === id)!;
  assert.equal(row.done, false);
  assert.equal(row.last_error_code, 'http_502');
  assert.ok(row.next_attempt_at > w.now.getTime());
});

Deno.test('the ledger bucket is never purged by a queue row', async () => {
  const w = new FakeWorld();
  w.put('ops-ledger', 'purges/2026-11-04.jsonl');
  w.enqueue('ops-ledger', 'purges/', true);
  await run(w, testConfig());
  assert.deepEqual(w.names('ops-ledger'), ['purges/2026-11-04.jsonl']);
});

Deno.test('request and cancellation receipts use the content package words and are sent once', async () => {
  const w = new FakeWorld();
  w.users.set(CANARY.profileId, { email: CANARY.parentEmail, providers: ['email'] });
  w.users.set(CANARY.coParentId, { email: null, providers: ['apple'] });
  const base = { status: 'scheduled' as const, requested_at: w.now.toISOString(), scheduled_for: new Date(w.now.getTime() + 30 * DAY).toISOString(), executing_at: '', cancelled_at: null, had_active_subscription: true, receipt: {}, steps: [] };
  w.requests.push({ ...base, id: 'aaaaaaaa-0000-4000-8000-000000000001', profile_id: CANARY.profileId });
  w.requests.push({ ...base, id: 'aaaaaaaa-0000-4000-8000-000000000002', profile_id: CANARY.coParentId });
  w.requests.push({ ...base, id: 'aaaaaaaa-0000-4000-8000-000000000003', profile_id: CANARY.profileId, status: 'cancelled', cancelled_at: w.now.toISOString() });
  await run(w, testConfig());
  const requested = w.emails.find((e) => e.subject === 'Your account is set to be deleted')!;
  assert.match(requested.text, /December 5, 2026/);
  assert.match(requested.text, /or to cancel the request\. Both are in Settings/);
  assert.match(requested.text, /aaaaaaaa-0000-4000-8000-000000000001/);
  assert.equal(requested.idempotencyKey, 'deletion-requested:aaaaaaaa-0000-4000-8000-000000000001');
  const cancelled = w.emails.find((e) => e.subject === 'Your account is staying')!;
  assert.ok(cancelled);
  assert.equal(w.requests[0].receipt.request_email, 'sent');
  assert.equal(w.requests[1].receipt.request_email, 'no_address');
  assert.equal(w.requests[2].receipt.cancel_email, 'sent');
  const n = w.emails.length;
  await run(w, testConfig());
  assert.equal(w.emails.length, n);
  for (const e of w.emails) {
    assert.ok(!/Asha|laughed|finger/i.test(e.subject + e.text), 'no child name or letter in any email');
  }
});

Deno.test('save-a-copy notices: none without family members, one per member otherwise', async () => {
  const w = new FakeWorld();
  const mk = (id: string) => ({ id, profile_id: CANARY.profileId, status: 'scheduled' as const, requested_at: w.now.toISOString(), scheduled_for: new Date(w.now.getTime() + 30 * DAY).toISOString(), executing_at: '', cancelled_at: null, had_active_subscription: null, receipt: { request_email: 'sent' }, steps: [{ step: 'contributor_export_notice', status: 'pending' as const, attempts: 0, next_attempt_at: new Date(0).toISOString(), last_error_code: null }] });
  w.requests.push(mk('bbbbbbbb-0000-4000-8000-000000000001'), mk('bbbbbbbb-0000-4000-8000-000000000002'));
  w.users.set(CANARY.coParentId, { email: CANARY.coParentEmail, providers: ['email'] });
  w.contributors.set('bbbbbbbb-0000-4000-8000-000000000002', [CANARY.coParentId]);
  await run(w, testConfig());
  assert.equal(w.step('bbbbbbbb-0000-4000-8000-000000000001', 'contributor_export_notice')!.status, 'not_applicable');
  assert.equal(w.step('bbbbbbbb-0000-4000-8000-000000000002', 'contributor_export_notice')!.status, 'done');
  const notice = w.emails.find((e) => e.to === CANARY.coParentEmail)!;
  assert.match(notice.text, /Export everything/);
  assert.ok(notice.idempotencyKey && !notice.idempotencyKey.includes(CANARY.coParentId), 'idempotency key carries a hash, not the id');
});

Deno.test('repeated notice failures raise the retry alert after enough attempts', async () => {
  const w = new FakeWorld();
  w.requests.push({ id: 'cccccccc-0000-4000-8000-000000000001', profile_id: CANARY.profileId, status: 'scheduled', requested_at: w.now.toISOString(), scheduled_for: w.now.toISOString(), executing_at: '', cancelled_at: null, had_active_subscription: null, receipt: { request_email: 'sent' },
    steps: [{ step: 'contributor_export_notice', status: 'pending', attempts: ALERT_AFTER_ATTEMPTS - 1, next_attempt_at: new Date(0).toISOString(), last_error_code: 'http_503' }] });
  w.users.set(CANARY.coParentId, { email: CANARY.coParentEmail, providers: ['email'] });
  w.contributors.set('cccccccc-0000-4000-8000-000000000001', [CANARY.coParentId]);
  w.resendStatus = 503;
  const { summary } = await run(w, testConfig());
  assert.equal(summary.alerts.conditions >= 1, true);
  assert.equal(w.step('cccccccc-0000-4000-8000-000000000001', 'contributor_export_notice')!.status, 'pending');
});

Deno.test('daily: the ledger is copied to the ops-ledger bucket and old files are pruned', async () => {
  const w = new FakeWorld(new Date('2026-11-05T03:17:00Z'));
  w.ledger = [
    { t: 'entry', id: CANARY.entryId, at: '2026-11-04T10:00:00.000Z' },
    { t: 'child', id: CANARY.childId, at: '2026-11-05T01:00:00.000Z' },
    { t: 'entry', id: 'old', at: '2026-10-01T00:00:00.000Z' },
  ];
  w.put('ops-ledger', 'purges/2026-08-01.jsonl');
  w.put('ops-ledger', 'purges/2026-10-01.jsonl');
  const { log } = await run(w, testConfig(), 'daily');
  assert.deepEqual(w.names('ops-ledger'), ['purges/2026-10-01.jsonl', 'purges/2026-11-04.jsonl', 'purges/2026-11-05.jsonl']);
  const file = w.objects.get('ops-ledger')!.get('purges/2026-11-04.jsonl')!.body!;
  assert.deepEqual(file.trim().split('\n').map((l) => JSON.parse(l)), [{ t: 'entry', id: CANARY.entryId, at: '2026-11-04T10:00:00.000Z' }]);
  assert.equal(w.retentionCalls, 1);
  assert.equal(w.purgeCalls, 0);
  assert.deepEqual(findCanaries(log.raw.join('\n')), []);
});

Deno.test('the run stops starting new work at its time budget', async () => {
  const { w } = await ashaWorld({ apple: false });
  let t = w.now.getTime();
  const config = testConfig({ budgetMs: 5_000 });
  const original = w.fetch;
  w.fetch = async (input, init) => {
    t += 3_000;
    w.now = new Date(t);
    return original(input, init);
  };
  const { summary } = await run(w, config);
  assert.equal(summary.budgetHit, true);
  assert.equal(w.finalized.size, 0);
});
