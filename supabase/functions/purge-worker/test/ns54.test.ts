// NS-54-R5 (P0): an account that used Apple is deleted, the purge revokes the Apple token and the receipt says so.
// The same world as NS-45-R8, read for the Apple half only. Fictional family "Asha" only.
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read supabase/functions scripts/ops
import assert from 'node:assert/strict';
import { CANARY } from '../../_shared/log/canary.ts';
import { appleTestKey, ashaWorld, BUNDLE_ID, run, testConfig } from './helpers.ts';
import type { FakeWorld } from './fake.ts';

/** What R5 promises: Apple was asked once to revoke the stored token, the token row is gone, the receipt says revoked. */
function proveR5(w: FakeWorld, requestId: string, uid: string): void {
  assert.equal(w.appleCalls.length, 1, 'Apple was asked to revoke once');
  assert.equal(w.appleCalls[0].get('token'), CANARY.appleRefreshToken, 'the stored token is the one revoked');
  assert.equal(w.appleTokens.has(uid), false, 'the stored token is gone');
  assert.equal(w.finalized.get(requestId)?.apple, 'revoked', 'the receipt says Apple was revoked');
}

Deno.test('[NS-54-R5] deletion revokes Apple', async () => {
  const key = await appleTestKey();
  const cfg = () => testConfig({ apple: { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKeyPem: key.pem, clientIds: [BUNDLE_ID] } });
  const { w, uid, req } = await ashaWorld();
  assert.equal(w.appleTokens.has(uid), true, 'arrange: a token is held');
  assert.equal(w.appleCalls.length, 0, 'arrange: Apple not yet called');
  await run(w, await cfg());
  proveR5(w, req.id, uid);

  // Mutant: the token is gone before the step looks, so Apple is never asked and the receipt says no_token.
  const skipped = await ashaWorld();
  skipped.w.appleTokens.delete(skipped.uid);
  await run(skipped.w, await cfg());
  assert.throws(() => proveR5(skipped.w, skipped.req.id, skipped.uid));
});
