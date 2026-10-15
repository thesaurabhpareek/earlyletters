// The restore flow (restore.ts, F08 6.5 C) with real keys: a phone wraps its book key to the
// escrow public key, asks from a new phone, and opens what comes back with its own device key.
// Order matters and is asserted: log rows before the email, the email before release, and no
// sealed key returned when either fails. Fictional family "Asha" only (CLAUDE.md).
import assert from 'node:assert/strict';
import { decodeBase64, decodeBase64Url, sha256, toHex } from '../bytes.ts';
import type { SealedBox } from '../contract.ts';
import { aad, generateKeyPair, INFO, open, unpackV1 } from '../hpke.ts';
import type { VerifiedUser } from '../jwt.ts';
import { memoryLogger } from '../log.ts';
import { createRequest, Refusal, release } from '../restore.ts';
import { ASHA, FakeDb, FakeMailer, phone } from './fakes.ts';

const nowSec = () => Math.floor(Date.now() / 1000);
const user = (over: Partial<VerifiedUser> = {}): VerifiedUser => ({ sub: ASHA.profile, email: ASHA.email, authAt: nowSec() - 60, sessionId: ASHA.session, ...over });

/** What the app does: open (or get) the request, then poll release. */
const restore = async (deps: Parameters<typeof createRequest>[0], u: VerifiedUser, device: string, rid: string) => {
  const view = await createRequest(deps, u, device, rid);
  return release(deps, u, device, view.request_id, rid);
};
const STOP = /stop#([A-Za-z0-9_-]{43})/;

async function world() {
  const escrow = await generateKeyPair();
  const db = new FakeDb();
  const mailer = new FakeMailer(db.calls);
  const log = memoryLogger();
  const deps = { db, mailer, log, keys: { 1: escrow.sk } as Record<number, Uint8Array>, stopUrl: 'https://earlyletters.com/stop', now: () => new Date() };
  return { escrow, db, mailer, log, deps };
}

Deno.test('[F08-REQ-029] a new phone with no other enrolled device: request, email with the stop link, 24-hour hold', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  const a = await createRequest(deps, user(), p.device, '0123456789ab');
  assert.equal(a.state, 'requested');
  assert.equal(a.is_this_device, true);
  const hours = (new Date(a.hold_until).getTime() - Date.now()) / 3600_000;
  assert.ok(hours > 23.9 && hours <= 24);
  assert.equal(mailer.sent.length, 1);
  assert.equal(mailer.sent[0].subject, 'A new iPhone asked for your recordings');
  assert.equal(mailer.sent[0].to, ASHA.email);
  // The stop link's token hashes to what the request stores; only the hash is in the database.
  const token = decodeBase64Url(mailer.sent[0].text.match(STOP)![1]);
  assert.equal(token.length, 32);
  assert.equal(toHex(await sha256(token)), db.requests[0].tokenHash);
  assert.ok(db.requests[0].notified, 'release waits for this email, and it has gone');
  assert.ok(!mailer.sent[0].text.includes(ASHA.profile) && !mailer.sent[0].text.includes(p.device), 'no ids in the email');
});

Deno.test('[F08-REQ-029] with another enrolled device: 72 hours, and a code sealed to that device that only it can open', async () => {
  const { escrow, db, deps } = await world();
  const old = await phone(db, escrow.pk, { device: ASHA.oldPhone, enrolled: true });
  const p = await phone(db, escrow.pk);
  const a = await createRequest(deps, user(), p.device, '0123456789ab');
  const hours = (new Date(a.hold_until).getTime() - Date.now()) / 3600_000;
  assert.ok(hours > 71.9 && hours <= 72);
  const ap = db.requests[0].approvals;
  assert.equal(ap.length, 1);
  assert.equal(ap[0].device_id, ASHA.oldPhone);
  const sealed = unpackV1(Uint8Array.from(ap[0].sealed_code_hex.match(/../g)!.map((h) => parseInt(h, 16))));
  const code = await open(old.sk, sealed.enc, INFO.approval, aad.approval(ASHA.profile, ASHA.oldPhone), sealed.ct);
  assert.equal(toHex(await sha256(code)), ap[0].code_hash_hex, 'the old phone proves itself by returning this code');
  await assert.rejects(() => open(p.sk, sealed.enc, INFO.approval, aad.approval(ASHA.profile, ASHA.oldPhone), sealed.ct), 'the new phone cannot open it');
});

Deno.test('[F08-REQ-029] a session whose last sign-in is older than 10 minutes cannot open a request', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  await assert.rejects(() => createRequest(deps, user({ authAt: nowSec() - 601 }), p.device, '0123456789ab'),
    (e) => e instanceof Refusal && e.code === 'reauth_required' && e.status === 401 && e.detail === 'step_up_required');
  assert.equal(db.requests.length, 0);
  assert.equal(mailer.sent.length, 0);
});

Deno.test('[F08-REQ-029] during the hold the answer is the hold time, with no new sign-in needed and no keys', async () => {
  const { escrow, db, deps } = await world();
  const p = await phone(db, escrow.pk);
  await restore(deps, user(), p.device, '0123456789ab');
  const again = await restore(deps, user({ authAt: nowSec() - 7200 }), p.device, '0123456789ac');
  assert.equal(again.state, 'requested');
  assert.ok(!('keys' in again));
  assert.equal(db.log.length, 0);
});

Deno.test('[F08-REQ-029] [F08-REQ-042] release: the book key sealed to the requesting device, logged, then emailed, then released', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  await restore(deps, user(), p.device, '0123456789ab');
  db.requests[0].hold_until = Date.now() - 1000;
  db.calls.length = 0;
  const a = await restore(deps, user({ authAt: nowSec() - 7200 }), p.device, '0123456789ac');
  assert.equal(a.state, 'released');
  const k = (a as { keys: { child_id: string; key_version: number; sealed: SealedBox }[] }).keys[0];
  assert.equal(k.sealed.suite, 'hpke-x25519-sha256-aes256gcm');
  const bk = await open(p.sk, decodeBase64(k.sealed.enc), INFO.release, aad.release(ASHA.profile, p.device, db.requests[0].id, k.child_id, k.key_version), decodeBase64(k.sealed.ct));
  assert.equal(toHex(bk), toHex(p.bk), 'the new phone opens exactly the book key the old one made');
  const order = db.calls.map((c) => c.fn).filter((f) => ['recordUnwraps', 'email', 'setState'].includes(f));
  assert.deepEqual(order, ['recordUnwraps', 'email', 'setState'], 'log rows, then the email, then release');
  assert.deepEqual(db.log.map((l) => l.outcome), ['opened']);
  assert.equal(mailer.sent.at(-1)!.subject, 'We used your recovery key');
  assert.match(mailer.sent.at(-1)!.idempotencyKey, /^escrow-restore-released:/);
});

Deno.test('[F08-REQ-042] if the email fails, no key leaves the function and the request is not released', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  await restore(deps, user(), p.device, '0123456789ab');
  db.requests[0].hold_until = Date.now() - 1000;
  mailer.fail = true;
  await assert.rejects(() => restore(deps, user(), p.device, '0123456789ac'), (e) => e instanceof Refusal && e.code === 'email' && e.retryable);
  assert.equal(db.requests[0].state, 'requested');
  assert.equal(db.log.length, 1, 'the opening was logged even though nothing was delivered');
});

Deno.test('a wrap moved to another account cannot be opened (the aad binds it to its row): logged as failed, nothing released', async () => {
  const { escrow, db, deps } = await world();
  const p = await phone(db, escrow.pk);
  // Someone with database access copies another person's wrap into this account's row.
  const other = await generateKeyPair();
  const { seal, packV1 } = await import('../hpke.ts');
  db.wraps[0].wrap = packV1(await seal(escrow.pk, INFO.bookKey, aad.bookKey('22222222-2222-4222-8222-222222222222', ASHA.child, 1, 1), other.sk));
  await restore(deps, user(), p.device, '0123456789ab');
  db.requests[0].hold_until = Date.now() - 1000;
  await assert.rejects(() => restore(deps, user(), p.device, '0123456789ac'), (e) => e instanceof Refusal && e.code === 'decrypt_failed');
  assert.deepEqual(db.log.map((l) => l.outcome), ['failed']);
  assert.notEqual(db.requests[0].state, 'released');
});

Deno.test('a wrap to an escrow key version this project does not hold is refused, not guessed', async () => {
  const { escrow, db, deps } = await world();
  const p = await phone(db, escrow.pk, { ekv: 2 });
  await restore(deps, user(), p.device, '0123456789ab');
  db.requests[0].hold_until = Date.now() - 1000;
  await assert.rejects(() => restore(deps, user(), p.device, '0123456789ac'), (e) => e instanceof Refusal && e.code === 'unknown_key_version');
});

Deno.test('no email address on the token, an account being deleted, or nothing backed up: refused before any request', async () => {
  const { escrow, db, deps } = await world();
  const p = await phone(db, escrow.pk);
  await assert.rejects(() => restore(deps, user({ email: null }), p.device, '0123456789ab'), (e) => e instanceof Refusal && e.code === 'no_address');
  db.deleting = true;
  await assert.rejects(() => restore(deps, user(), p.device, '0123456789ab'), (e) => e instanceof Refusal && e.code === 'deleted' && e.detail === 'deletion_pending');
  db.deleting = false;
  db.wraps.length = 0;
  await assert.rejects(() => restore(deps, user(), p.device, '0123456789ab'), (e) => e instanceof Refusal && e.code === 'not_found');
  assert.equal(db.requests.length, 0);
});

Deno.test('a request email that failed is sent on the next call with a fresh stop token', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  mailer.fail = true;
  await assert.rejects(() => restore(deps, user(), p.device, '0123456789ab'), Refusal);
  const firstHash = db.requests[0].tokenHash;
  mailer.fail = false;
  const a = await restore(deps, user(), p.device, '0123456789ac');
  assert.equal(a.state, 'requested');
  assert.equal(db.requests.length, 1);
  assert.notEqual(db.requests[0].tokenHash, firstHash);
  const token = decodeBase64Url(mailer.sent[0].text.match(STOP)![1]);
  assert.equal(toHex(await sha256(token)), db.requests[0].tokenHash, 'the mailed link is the live one');
});

Deno.test('a cancelled or expired request answers 410 gone with its detail and releases nothing', async () => {
  const { escrow, db, deps } = await world();
  const p = await phone(db, escrow.pk);
  const view = await createRequest(deps, user(), p.device, '0123456789ab');
  for (const state of ['cancelled', 'expired'] as const) {
    db.requests[0].state = state;
    db.requests[0].hold_until = Date.now() - 1000;
    await assert.rejects(() => release(deps, user(), p.device, view.request_id, '0123456789ac'),
      (e) => e instanceof Refusal && e.code === 'gone' && e.status === 410 && e.detail === state);
  }
  assert.equal(db.log.length, 0);
});

Deno.test('asking again for an open, notified request returns it without a new sign-in, email or request', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  const first = await createRequest(deps, user(), p.device, '0123456789ab');
  const again = await createRequest(deps, user({ authAt: nowSec() - 7200 }), p.device, '0123456789ac');
  assert.equal(again.request_id, first.request_id);
  assert.equal(db.requests.length, 1);
  assert.equal(mailer.sent.length, 1);
});

Deno.test('logs carry no ids, emails, tokens or key bytes', async () => {
  const { escrow, db, mailer, log, deps } = await world();
  const p = await phone(db, escrow.pk);
  await restore(deps, user(), p.device, '0123456789ab');
  db.requests[0].hold_until = Date.now() - 1000;
  await restore(deps, user(), p.device, '0123456789ac');
  const all = log.raw.join('\n');
  for (const s of [ASHA.profile, ASHA.email, p.device, ASHA.child, db.requests[0].id, toHex(p.bk), mailer.sent[0].text.match(STOP)![1]]) {
    assert.ok(!all.includes(s), `log leaked ${s.slice(0, 8)}`);
  }
  assert.ok(log.raw.length >= 3);
});

Deno.test('[F08-REQ-042] a repeat release within the day opens the keys again: new log rows and its own email', async () => {
  const { escrow, db, mailer, deps } = await world();
  const p = await phone(db, escrow.pk);
  await restore(deps, user(), p.device, '0123456789ab');
  db.requests[0].hold_until = Date.now() - 1000;
  await release(deps, user(), p.device, db.requests[0].id, '0123456789ac');
  await release(deps, user(), p.device, db.requests[0].id, '0123456789ad');
  const used = mailer.sent.filter((m) => m.subject === 'We used your recovery key');
  assert.equal(used.length, 2);
  assert.notEqual(used[0].idempotencyKey, used[1].idempotencyKey, 'the provider does not fold the second use into the first');
  assert.equal(db.log.filter((l) => l.outcome === 'opened').length, 2);
});

Deno.test('a token without a session id cannot open a request', async () => {
  const { escrow, db, deps } = await world();
  const p = await phone(db, escrow.pk);
  await assert.rejects(() => createRequest(deps, user({ sessionId: null }), p.device, '0123456789ab'), (e) => e instanceof Refusal && e.code === 'reauth_required');
  assert.equal(db.requests.length, 0);
});
