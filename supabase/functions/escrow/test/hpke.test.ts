// HPKE base mode (hpke.ts) against an independent implementation. The fixture was produced on
// 15 Oct 2026 with @hpke/core 1.8.0 (DhkemX25519HkdfSha256, HkdfSha256, Aes256Gcm): (1) the
// reference sealed `pt` to pkR and this module opens it; (2) this module sealed `pt` with the
// fixed ephemeral key skE and the reference opened it, so the bytes below are the shared answer.
import assert from 'node:assert/strict';
import { fromHex, toHex } from '../bytes.ts';
import { aad, generateKeyPair, HpkeError, INFO, open, packV1, publicKeyOf, seal, unpackV1 } from '../hpke.ts';

const X = {
  skR: '700f343fd24402f5180dd0ec3e14f64dd78622c40aaabb06b88a4def00458c6f',
  pkR: '39b8db9b84f1a8ee4c92eb9d44313f0e348c4f29e1e134adb438eea16e9f1751',
  info: 'scribe/escrow/book-key/v1',
  aad: '11111111-1111-1111-1111-111111111111|22222222-2222-2222-2222-222222222222|1|1',
  pt: 'a5'.repeat(32),
  refEnc: '8e9eb3baf410d62ec27440181a7b581978deece8ceae4ae52a0565ddb941346e',
  refCt: 'd4bb87a4daec1cacb4d35c61131c0c57b3513fd7da6b079302fd8e5568fe415df0ca634ab71eb436da6681cd28fae22d',
  skE: '3b'.repeat(32),
  mineEnc: '437f462c58a8964fa718164019ee3dcaab6023db339c857ecd2a31a56b89d54e',
  mineCt: '23067434182283b6d8920b964503339d1772566e70dda09f19d60628e521b3a49d299650c55fed2546ade669261d40ef',
};
const te = new TextEncoder();

Deno.test('[F08-REQ-020] opens a wrap sealed by an independent HPKE implementation (CryptoKit uses the same suite)', async () => {
  const pt = await open(fromHex(X.skR), fromHex(X.refEnc), te.encode(X.info), te.encode(X.aad), fromHex(X.refCt));
  assert.equal(toHex(pt), X.pt);
});

Deno.test('a seal with a fixed ephemeral key is byte for byte what the independent implementation opened', async () => {
  const s = await seal(fromHex(X.pkR), te.encode(X.info), te.encode(X.aad), fromHex(X.pt), { ephemeralSk: fromHex(X.skE) });
  assert.equal(toHex(s.enc), X.mineEnc);
  assert.equal(toHex(s.ct), X.mineCt);
});

Deno.test('the public key is derived from the private key alone', async () => {
  assert.equal(toHex(await publicKeyOf(fromHex(X.skR))), X.pkR);
  const kp = await generateKeyPair();
  assert.equal(toHex(await publicKeyOf(kp.sk)), toHex(kp.pk));
});

Deno.test('a changed byte, a different aad (another row) or another info fails to open', async () => {
  const sk = fromHex(X.skR);
  const ct = fromHex(X.refCt);
  ct[3] ^= 1;
  await assert.rejects(() => open(sk, fromHex(X.refEnc), te.encode(X.info), te.encode(X.aad), ct), (e) => e instanceof HpkeError && e.code === 'decrypt_failed');
  const otherRow = aad.bookKey('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 1, 1);
  await assert.rejects(() => open(sk, fromHex(X.refEnc), te.encode(X.info), otherRow, fromHex(X.refCt)), HpkeError);
  await assert.rejects(() => open(sk, fromHex(X.refEnc), INFO.release, te.encode(X.aad), fromHex(X.refCt)), HpkeError);
});

Deno.test('format 1 is 0x01, enc, ciphertext: an 81-byte wrap for a 32-byte book key', async () => {
  const kp = await generateKeyPair();
  const bk = crypto.getRandomValues(new Uint8Array(32));
  const w = packV1(await seal(kp.pk, INFO.bookKey, aad.bookKey('a', 'b', 1, 1), bk));
  assert.equal(w.length, 81);
  assert.equal(w[0], 1);
  const u = unpackV1(w);
  assert.equal(toHex(await open(kp.sk, u.enc, INFO.bookKey, aad.bookKey('a', 'b', 1, 1), u.ct)), toHex(bk));
  assert.throws(() => unpackV1(new Uint8Array([2, ...w.subarray(1)])), HpkeError);
  assert.throws(() => unpackV1(w.subarray(0, 40)), HpkeError);
});

Deno.test('aad joins lowercase ids with |, so a wrap is bound to its account, book and versions', () => {
  assert.equal(new TextDecoder().decode(aad.bookKey('ABC', 'Def', 2, 3)), 'abc|def|2|3');
  assert.equal(new TextDecoder().decode(aad.release('p', 'd', 'r', 'c', 1)), 'p|d|r|c|1');
});
