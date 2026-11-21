// NS-45 rows R8 (P0) and R17 (P1): what the purge worker does when a deletion date passes, and the two
// plain emails around a request (FP-18; card 19; E58). The tests prove the rows with the fake vendors.
// A "mutant" below is a world broken on purpose in one way; the same proof function must fail on it.
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read supabase/functions scripts/ops
import assert from 'node:assert/strict';
import { CANARY, findCanaries } from '../../_shared/log/canary.ts';
import { readConfig } from '../config.ts';
import { appleTestKey, ashaWorld, BUNDLE_ID, run, testConfig } from './helpers.ts';
import { FakeWorld } from './fake.ts';

const DAY = 86_400_000;
const appleConfig = async () => {
  const key = await appleTestKey();
  return testConfig({ apple: { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: key.pem, clientIds: [BUNDLE_ID] } });
};

/** Everything R8 promises once the date has passed, read from the world after a run. */
function proveR8(w: FakeWorld, requestId: string, uid: string, apple: 'revoked' | 'no_token'): void {
  const final = w.finalized.get(requestId);
  assert.ok(final, 'the request was finalized');
  assert.equal(final.apple, apple, 'the receipt records the Apple outcome');
  if (apple === 'revoked') {
    assert.equal(w.appleCalls.length, 1, 'one revoke call');
    assert.equal(w.appleCalls[0].get('token'), CANARY.appleRefreshToken);
  } else {
    assert.equal(w.appleCalls.length, 0, 'nothing held, nothing sent to Apple');
  }
  assert.equal(w.appleTokens.has(uid), false, 'the stored refresh token is gone');
  assert.equal(w.users.has(uid), false, 'the sign-in account is gone');
  assert.deepEqual(w.names('entry-photos').filter((n) => n.includes(`/${uid}/`)), [], 'their photos are gone');
  // The row removal and consent pseudonymising run inside prepare_account_purge (database tests:
  // supabase/tests/deletion_subject_hash.test.mjs). The worker must call it first, once, for this request.
  const calls = w.rpcCalls.filter((c) => c.fn === 'prepare_account_purge' && c.args.p_request === requestId);
  assert.equal(calls.length, 1, 'prepare_account_purge ran once for this request');
  const order = w.rpcCalls.map((c) => c.fn === 'record_deletion_step' ? `step:${c.args.p_step}` : c.fn);
  assert.ok(order.indexOf('prepare_account_purge') < order.indexOf('step:apple_token_revoke'), 'prepare before the Apple step');
  assert.ok(order.indexOf('step:apple_token_revoke') < order.indexOf('finalize_account_deletion'), 'the Apple step before finalize');
  assert.deepEqual(final.counts, { letters: 2, books: 1, objects: 1, rehomed: 1 });
}

Deno.test('[NS-45-R8] purge revokes Apple and removes server data', async () => {
  const { w, uid, req } = await ashaWorld();
  // Arrange: all of it exists before the run, so the checks below can fail.
  assert.equal(w.appleTokens.has(uid), true);
  assert.equal(w.users.has(uid), true);
  assert.equal(w.finalized.size, 0);
  assert.equal(w.names('entry-photos').filter((n) => n.includes(`/${uid}/`)).length, 1);
  await run(w, await appleConfig());
  proveR8(w, req.id, uid, 'revoked');
  // The co-parent's rows and photo stay.
  assert.equal(w.users.has(CANARY.coParentId), true);
  assert.equal(w.names('entry-photos').length, 1);
});

Deno.test('[NS-45-R8] with no stored Apple token the receipt says no_token and the rest still goes', async () => {
  const { w, uid, req } = await ashaWorld({ token: false });
  await run(w, testConfig());
  proveR8(w, req.id, uid, 'no_token');
});

Deno.test('[NS-45-R8] mutants: a skipped revoke, a refused revoke and a leftover row each fail the proof', async () => {
  // Mutant 1: the revoke is skipped (the token row is gone before the step looks): the receipt says no_token, Apple is never called.
  const skipped = await ashaWorld();
  skipped.w.appleTokens.delete(skipped.uid);
  await run(skipped.w, await appleConfig());
  assert.throws(() => proveR8(skipped.w, skipped.req.id, skipped.uid, 'revoked'));

  // Mutant 2: Apple refuses our configuration: the account is not finalized and the sign-in account stays.
  const refused = await ashaWorld();
  refused.w.appleResponse = { status: 400, body: { error: 'invalid_client' } };
  await run(refused.w, await appleConfig());
  assert.throws(() => proveR8(refused.w, refused.req.id, refused.uid, 'revoked'));

  // Mutant 3: a database row still points at the person: verification keeps the request open.
  const residue = await ashaWorld();
  residue.w.extraResidue.push({ table_schema: 'public', table_name: 'entries', column_name: 'author_id' });
  await run(residue.w, await appleConfig());
  assert.throws(() => proveR8(residue.w, residue.req.id, residue.uid, 'revoked'));
});

/** What R17 promises: one plain email for the request and one for the cancel, to the account address, no content. */
function proveR17(w: FakeWorld, ids: { requested: string; cancelled: string }): void {
  const mine = w.emails.filter((e) => e.to === CANARY.parentEmail);
  const requested = mine.filter((e) => e.idempotencyKey === `deletion-requested:${ids.requested}`);
  const cancelled = mine.filter((e) => (e.idempotencyKey ?? '').startsWith(`deletion-cancelled:${ids.cancelled}:`));
  assert.equal(requested.length, 1, 'one request email');
  assert.equal(cancelled.length, 1, 'one cancel email');
  assert.notEqual(requested[0].subject, cancelled[0].subject);
  for (const e of [requested[0], cancelled[0]]) {
    const body = `${e.subject}\n${e.text}\n${e.html ?? ''}`;
    assert.deepEqual(findCanaries(body, { uuids: [ids.requested, ids.cancelled], emails: ['hello@earlyletters.com'] }), [], 'no id, token or content');
    assert.ok(!/Asha|laughed|finger/i.test(body), 'no child name or letter words');
  }
}

function r17World() {
  const w = new FakeWorld();
  w.users.set(CANARY.profileId, { email: CANARY.parentEmail, providers: ['email'] });
  const base = { requested_at: w.now.toISOString(), scheduled_for: new Date(w.now.getTime() + 30 * DAY).toISOString(), executing_at: '', had_active_subscription: true, receipt: {}, steps: [] };
  const ids = { requested: 'aaaaaaaa-0000-4000-8000-0000000000a1', cancelled: 'aaaaaaaa-0000-4000-8000-0000000000a2' };
  w.requests.push({ ...base, id: ids.requested, profile_id: CANARY.profileId, status: 'scheduled', cancelled_at: null });
  w.requests.push({ ...base, id: ids.cancelled, profile_id: CANARY.profileId, status: 'cancelled', cancelled_at: w.now.toISOString() });
  return { w, ids };
}

Deno.test('[NS-45-R17] deletion and cancel are confirmed by email', async () => {
  const { w, ids } = r17World();
  assert.equal(w.emails.length, 0);
  await run(w, testConfig());
  proveR17(w, ids);
  assert.equal(w.requests.find((r) => r.id === ids.requested)!.receipt.request_email, 'sent');
  assert.equal(w.requests.find((r) => r.id === ids.cancelled)!.receipt.cancel_email, 'sent');
  // A second run sends nothing more.
  await run(w, testConfig());
  proveR17(w, ids);
  assert.equal(w.emails.length, 2);
});

Deno.test('[NS-45-R17] a provider outage sends nothing, records nothing as sent, and the next run sends each once', async () => {
  const { w, ids } = r17World();
  w.resendStatus = 503;
  await run(w, testConfig());
  assert.equal(w.emails.length, 0);
  assert.throws(() => proveR17(w, ids));
  assert.notEqual(w.requests[0].receipt.request_email, 'sent');
  w.resendStatus = 200;
  await run(w, testConfig());
  proveR17(w, ids);
});

Deno.test('[NS-45-R17] mutants: no address on the account and a sender that is not configured', () => {
  // Mutant 1: the account has no address: the receipt says no_address and the proof fails.
  const noAddress = r17World();
  noAddress.w.users.set(CANARY.profileId, { email: null, providers: ['apple'] });
  return run(noAddress.w, testConfig()).then(() => {
    assert.equal(noAddress.w.requests[0].receipt.request_email, 'no_address');
    assert.throws(() => proveR17(noAddress.w, noAddress.ids));
    // Deployment check (E58): without the provider key the worker refuses to start, so a sender is always configured.
    const env = (m: Record<string, string>) => (n: string) => m[n];
    const base = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', PURGE_WORKER_SECRET: 's' };
    assert.deepEqual(readConfig(env(base)).missing, ['RESEND_API_KEY']);
    assert.equal(readConfig(env(base)).config, null);
    assert.deepEqual(readConfig(env({ ...base, RESEND_API_KEY: 'r' })).missing, []);
  });
});
