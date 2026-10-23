// Escrow key rotation (rotate.ts, F08 6.5 G4, F08-REQ-030): every wrap moves to the new version,
// restores work with the new key afterwards, one email per account retried until sent, and a wrap
// that will not open is counted and passed over without stalling the rest. Fictional family
// "Asha" only (CLAUDE.md).
import assert from 'node:assert/strict';
import { encodeBase64 } from '../bytes.ts';
import { aad, generateKeyPair, INFO, open, publicKeyOf, unpackV1 } from '../hpke.ts';
import { memoryLogger } from '../log.ts';
import { rotateBatch } from '../rotate.ts';
import { ASHA, FakeDb, FakeMailer, phone } from './fakes.ts';

/** Each key pinned as the ceremony pins it (public-keys.ts), unless a test passes its own pins. */
const deps = async (db: FakeDb, mailer: FakeMailer, keys: Record<number, Uint8Array>, pinned?: Record<number, string>) => ({
  db, mailer, log: memoryLogger(), keys, now: () => new Date(),
  pinned: pinned ?? Object.fromEntries(await Promise.all(Object.entries(keys).map(async ([v, k]) => [v, encodeBase64(await publicKeyOf(k))]))),
});

Deno.test('[F08-REQ-030] a call moves every wrap from v1 to v2; the new key opens them; one email per account', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const db = new FakeDb();
  const mailer = new FakeMailer();
  const a = await phone(db, v1.pk, { child: ASHA.child });
  const b = await phone(db, v1.pk, { device: ASHA.oldPhone, child: ASHA.child2 });
  const r = await rotateBatch(await deps(db, mailer, { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ab');
  assert.deepEqual({ rewrapped: r.rewrapped, failed: r.failed, emails: r.emails, remaining: r.remaining, pending: r.notices_pending },
    { rewrapped: 2, failed: 0, emails: 1, remaining: false, pending: 0 });
  assert.equal(mailer.sent[0].subject, 'We updated your recovery key');
  assert.match(mailer.sent[0].idempotencyKey, /^escrow-key-rotated:[0-9a-f-]{36}$/);
  for (const [w, bk] of [[db.wraps[0], a.bk], [db.wraps[1], b.bk]] as const) {
    assert.equal(w.ekv, 2);
    const u = unpackV1(w.wrap);
    const opened = await open(v2.sk, u.enc, INFO.bookKey, aad.bookKey(ASHA.profile, w.child, 1, 2), u.ct);
    assert.deepEqual(opened, bk);
    await assert.rejects(() => open(v1.sk, u.enc, INFO.bookKey, aad.bookKey(ASHA.profile, w.child, 1, 2), u.ct), 'the old key no longer opens it');
  }
  const again = await rotateBatch(await deps(db, mailer, { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ac');
  assert.equal(again.rewrapped, 0, 'nothing left on v1');
  assert.equal(mailer.sent.length, 1, 'no second email for the same account');
});

Deno.test('a wrap that does not open is counted, left on its version, and never stalls the wraps after it', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const stranger = await generateKeyPair();
  const db = new FakeDb();
  await phone(db, stranger.pk, { child: ASHA.child });      // sorts first, and will never open with v1
  await phone(db, v1.pk, { child: ASHA.child2 });
  const r = await rotateBatch(await deps(db, new FakeMailer(), { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ab', { batch: 1 });
  assert.equal(r.failed, 1);
  assert.equal(r.rewrapped, 1, 'the next wrap still moved, in the same call');
  assert.deepEqual(db.failedRotations.map((f) => f.child), [ASHA.child], 'the failed opening is on the record');
  assert.equal(db.wraps.find((w) => w.child === ASHA.child)!.ekv, 1);
  assert.equal(db.wraps.find((w) => w.child === ASHA.child2)!.ekv, 2);
});

Deno.test('a row budget per call: remaining says to call again', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const db = new FakeDb();
  await phone(db, v1.pk, { child: ASHA.child });
  await phone(db, v1.pk, { child: ASHA.child2 });
  const r = await rotateBatch(await deps(db, new FakeMailer(), { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ab', { batch: 1, budget: 1 });
  assert.deepEqual({ rewrapped: r.rewrapped, remaining: r.remaining }, { rewrapped: 1, remaining: true });
  const r2 = await rotateBatch(await deps(db, new FakeMailer(), { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ac', { batch: 1, budget: 1 });
  assert.equal(r2.rewrapped, 1);
});

Deno.test('a rotation email that fails stays due and goes on the next call; it is never lost', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const db = new FakeDb();
  const mailer = new FakeMailer();
  await phone(db, v1.pk);
  mailer.fail = true;
  const r = await rotateBatch(await deps(db, mailer, { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ab');
  assert.deepEqual({ rewrapped: r.rewrapped, emails: r.emails, failures: r.emailFailures, pending: r.notices_pending }, { rewrapped: 1, emails: 0, failures: 1, pending: 1 });
  mailer.fail = false;
  const r2 = await rotateBatch(await deps(db, mailer, { 1: v1.sk, 2: v2.sk }), 1, 2, '0123456789ac');
  assert.deepEqual({ rewrapped: r2.rewrapped, emails: r2.emails, pending: r2.notices_pending }, { rewrapped: 0, emails: 1, pending: 0 });
  assert.equal(db.notices[0].attempts, 1);
});

Deno.test('[review B S1] a new key that does not derive its pinned public key moves nothing (a slip typing V2 from paper)', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const other = await generateKeyPair();
  const db = new FakeDb();
  await phone(db, v1.pk);
  const pins = { 1: encodeBase64(v1.pk), 2: encodeBase64(other.pk) };
  await assert.rejects(() => rotateBatch({ db, mailer: new FakeMailer(), log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date(), pinned: pins }, 1, 2, '0123456789ab'));
  assert.equal(db.wraps[0].ekv, 1, 'the wrap stays on v1');
  assert.ok(!db.calls.some((c) => c.fn === 'rotationBatch' || c.fn === 'rewrapKey'), 'nothing was read or written');
  await assert.rejects(() => rotateBatch({ db, mailer: new FakeMailer(), log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date(), pinned: { 1: encodeBase64(v1.pk) } }, 1, 2, '0123456789ab'),
    'no pinned key for the new version');
});

Deno.test('[review B S1] an old key that does not derive its pinned public key moves nothing', async () => {
  const v1 = await generateKeyPair();
  const v2 = await generateKeyPair();
  const other = await generateKeyPair();
  const db = new FakeDb();
  await phone(db, v1.pk);
  const pins = { 1: encodeBase64(other.pk), 2: encodeBase64(v2.pk) };
  await assert.rejects(() => rotateBatch({ db, mailer: new FakeMailer(), log: memoryLogger(), keys: { 1: v1.sk, 2: v2.sk }, now: () => new Date(), pinned: pins }, 1, 2, '0123456789ab'));
  assert.equal(db.wraps[0].ekv, 1);
});
