// Proves the rehearsal script can fail: each plant breaks one thing the restore runbook relies on and
// must turn exactly the check that guards it red. A rehearsal that cannot fail proves nothing.
// Run: node --test scripts/ops/rehearsal/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rehearse } from './restore-replay.mjs';

const failedIds = (r) => r.filter((x) => !x.ok).map((x) => x.id);

test('restore-drill.md part 2: with nothing broken every check passes', async () => {
  assert.deepEqual(failedIds(await rehearse()), []);
});

test('restore-drill.md part 2 step 3: no replay lets a purged letter come back (RH4.1, RH4.3)', async () => {
  assert.deepEqual(failedIds(await rehearse({ sabotage: 'skip-replay' })), ['RH4.1', 'RH4.3']);
});

test('restore-drill.md part 2 step 4: no new epoch means phones never re-upload (RH4.5, RH4.6)', async () => {
  assert.deepEqual(failedIds(await rehearse({ sabotage: 'skip-epoch' })), ['RH4.5', 'RH4.6']);
});

test('replay must not delete a letter that was kept (RH4.2, RH4.4)', async () => {
  const f = failedIds(await rehearse({ sabotage: 'over-delete' }));
  assert.ok(f.includes('RH4.2'), f.join());
});

test('DATA-REQ-031 hash sample: a restore that changed raw words is caught (RH4.4)', async () => {
  assert.deepEqual(failedIds(await rehearse({ sabotage: 'tamper-raw' })), ['RH4.4']);
});
