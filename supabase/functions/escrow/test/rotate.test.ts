// Escrow key rotation (rotate.ts, F08 6.5 G4, F08-REQ-030): every wrap moves to the new version,
// restores work with the new key afterwards, one email per account, and a wrap that will not open
// is counted and left in place. Fictional family "Asha" only (CLAUDE.md).
import assert from 'node:assert/strict';
import { aad, generateKeyPair, INFO, open, unpackV1 } from '../hpke.ts';
import { memoryLogger } from '../log.ts';
import { rotateBatch } from '../rotate.ts';
import { ASHA, FakeDb, FakeMailer, phone } from './fakes.ts';

Deno.test('[F08-REQ-030] a batch moves every wrap from v1 to v2; the new key opens them; one email per account', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const db = new FakeDb();
  const mailer = new FakeMailer();
  const a = await phone(db, v1.pk, { child: ASHA.child });
  const b = await phone(db, v1.pk, { device: ASHA.oldPhone, child: ASHA.child2 });
  const r = await rotateBatch({ db, mailer, log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date() }, 1, 2, 50, '0123456789ab');
  assert.deepEqual({ rewrapped: r.rewrapped, failed: r.failed, emails: r.emails }, { rewrapped: 2, failed: 0, emails: 1 });
  assert.equal(mailer.sent[0].subject, 'We updated your recovery key');
  assert.match(mailer.sent[0].idempotencyKey, /^escrow-rotated:.*:2$/);
  for (const [w, bk] of [[db.wraps[0], a.bk], [db.wraps[1], b.bk]] as const) {
    assert.equal(w.ekv, 2);
    const u = unpackV1(w.wrap);
    const opened = await open(v2.sk, u.enc, INFO.bookKey, aad.bookKey(ASHA.profile, w.child, 1, 2), u.ct);
    assert.deepEqual(opened, bk);
    await assert.rejects(() => open(v1.sk, u.enc, INFO.bookKey, aad.bookKey(ASHA.profile, w.child, 1, 2), u.ct), 'the old key no longer opens it');
  }
  const again = await rotateBatch({ db, mailer, log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date() }, 1, 2, 50, '0123456789ac');
  assert.equal(again.rewrapped, 0, 'nothing left on v1');
});

Deno.test('a wrap that does not open with the old key is logged as failed, left on its version and skipped next time', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const stranger = await generateKeyPair();
  const db = new FakeDb();
  await phone(db, stranger.pk);
  const deps = { db, mailer: new FakeMailer(), log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date() };
  const r = await rotateBatch(deps, 1, 2, 50, '0123456789ab');
  assert.equal(r.failed, 1);
  assert.equal(db.wraps[0].ekv, 1);
  assert.equal(db.calls.filter((c) => c.fn === 'rotationFailed').length, 1);
  const again = await rotateBatch(deps, 1, 2, 1, '0123456789ac');
  assert.deepEqual({ failed: again.failed, remaining: again.remaining }, { failed: 0, remaining: false }, 'a failed wrap never stalls the run');
});

Deno.test('[F08-REQ-030] a failed rotation email is retried by the next batch until it goes out, then never again', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const db = new FakeDb();
  const mailer = new FakeMailer();
  await phone(db, v1.pk, { child: ASHA.child });
  const deps = { db, mailer, log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date() };
  mailer.fail = true;
  const r1 = await rotateBatch(deps, 1, 2, 50, '0123456789ab');
  assert.deepEqual({ rewrapped: r1.rewrapped, emails: r1.emails, emailFailures: r1.emailFailures, remaining: r1.remaining }, { rewrapped: 1, emails: 0, emailFailures: 1, remaining: true });
  mailer.fail = false;
  const r2 = await rotateBatch(deps, 1, 2, 50, '0123456789ac');
  assert.deepEqual({ rewrapped: r2.rewrapped, emails: r2.emails, remaining: r2.remaining }, { rewrapped: 0, emails: 1, remaining: false });
  assert.equal((await rotateBatch(deps, 1, 2, 50, '0123456789ad')).emails, 0, 'one email per account per rotation');
  assert.equal(mailer.sent.length, 1);
});

Deno.test('[F08-REQ-030] an account that already has a key on the new version (made by the app) still gets its rotation email', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const db = new FakeDb();
  const mailer = new FakeMailer();
  await phone(db, v1.pk, { child: ASHA.child });
  await phone(db, v2.pk, { device: ASHA.oldPhone, child: ASHA.child2, ekv: 2 });
  const r = await rotateBatch({ db, mailer, log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date() }, 1, 2, 50, '0123456789ab');
  assert.deepEqual({ rewrapped: r.rewrapped, emails: r.emails }, { rewrapped: 1, emails: 1 });
});
