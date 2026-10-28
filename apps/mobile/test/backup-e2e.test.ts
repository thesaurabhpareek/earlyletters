/// <reference types="node" />
/**
 * Backup end to end in Node (WP-F08-B5a, B5b; F08-REQ-018, -020 to -023,
 * -027 to -029, -032). Phones are the app's real local database and real
 * files; the server is a fake bucket with the RPCs and escrow function the
 * client is written against (lib/backup/contract.ts). What only a device can
 * prove (Keychain sync between two iPhones, CryptoKit, Storage over the
 * network, kill by the system) is the two-phone drill in
 * docs/qa/BACKUP_RESTORE_DRILL.md.
 *
 * Asha's family: Mama (phones A, B and C, one Apple Account) and Papa (his own
 * phone and account). Fictional only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { BackupServerError } from '../src/lib/backup/contract';
import { ICLOUD_WAIT_MS } from '../src/lib/backup/keys';
import { backupSource } from '../src/lib/backup/local-store';
import { FakeBackend, FakeICloud, sha256Hex } from './helpers/backup-node';
import { addChild, audioOf, cleanupPhones, holdDraft, makePhone, recordLetter, syncText, type LiveSession, type Phone } from './helpers/backup-phone';

const MAMA = '11111111-1111-4111-8111-111111111111';
const PAPA = '22222222-2222-4222-8222-222222222222';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';
const HOUR = 3600 * 1000;

afterEach(cleanupPhones);

describe('backup end to end against a fake bucket', () => {
  it('Mama backs up on phone A; phone B (iCloud Keychain) and phone C (escrow, 72 h hold) get every recording back; Papa keeps his own', async () => {
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const mamaCloud = new FakeICloud();

    // Phone A: three letters and a take held at the Keep gate whose held-draft row is on the server.
    const a = makePhone({ backend, uid: MAMA, icloud: mamaCloud, clock, name: 'mama-a' });
    addChild(a, ASHA);
    const letters = [recordLetter(a, ASHA, 90_000), recordLetter(a, ASHA, 400_000), recordLetter(a, ASHA, 1_000)];
    const notSynced = recordLetter(a, ASHA, 20_000, { synced: false });
    const held = holdDraft(a, ASHA, 150_000, { onServer: true });
    const all = [...letters, notSynced, held];

    // Off until the owner turns it on (F08 6.5 A step 1): nothing goes anywhere.
    await a.service.tick();
    expect(backend.requests).toEqual([]);
    expect(a.service.view().status).toEqual({ kind: 'off' });

    expect(await a.service.turnOn()).toBe('on');
    expect(backend.consent.get(MAMA)).toBe('accept');
    await a.service.tick();
    for (const r of [...letters, held]) expect(backend.blobs.get(r.id)?.state, r.id).toBe('confirmed');
    // A letter whose text has not reached the server waits (F08 6.5 A step 5).
    expect(backend.blobs.has(notSynced.id)).toBe(false);
    // ...so Settings never says "Backed up" while it waits: it carries on later.
    expect(a.service.view().status).toEqual({ kind: 'paused' });
    expect(backend.childKeys.filter((k) => k.uid === MAMA)).toHaveLength(1);

    // Papa, on his own phone and account, backs up his letter for the same book with his own key.
    const papa = makePhone({ backend, uid: PAPA, icloud: new FakeICloud(), clock, name: 'papa' });
    addChild(papa, ASHA);
    const papasLetter = recordLetter(papa, ASHA, 60_000);
    await papa.service.turnOn();
    await papa.service.tick();
    expect(backend.blobs.get(papasLetter.id)?.state).toBe('confirmed');
    expect(backend.childKeys.map((k) => k.uid).sort()).toEqual([MAMA, PAPA].sort());
    // [F08-REQ-022] owner-only: neither lists the other's recordings or keys.
    expect((await backend.serverFor(PAPA).listBlobs()).map((b) => b.entryId)).toEqual([papasLetter.id]);
    expect((await backend.serverFor(MAMA).listBlobs()).map((b) => b.entryId)).not.toContain(papasLetter.id);
    await expect(backend.serverFor(PAPA).downloadUrl(backend.blobs.get(letters[0].id)!.objectPath)).rejects.toThrow();

    // [F08-REQ-018, F08-REQ-020] zero plaintext audio in any request, from any phone.
    const originals = [...all, papasLetter];
    // The start of a recording is its MP4 `ftyp` box header: size, "ftyp", major brand, minor version (16 bytes).
    // The four letters alone are no signature. A tus body is the whole object (112 bytes in clear, then AES-GCM
    // ciphertext), so any 4 bytes of it equal "ftyp" by chance: about 1 in 2^32 per byte, about a million bytes
    // per MB uploaded, and that scan failed on CI now and then. The same 16 bytes of the real recording, at any
    // offset of any body, cannot be chance (2^-128), and a leak of just the start of a take is still caught.
    const START = 16;
    for (const r of originals) expect(r.plain.subarray(4, 8).toString('latin1'), 'the fixture starts with an ftyp box').toBe('ftyp');
    for (const req of backend.requests) {
      for (const r of originals) {
        expect(req.body.includes(r.plain.subarray(0, START)), `${req.kind} carries the start of a recording`).toBe(false);
        const at = Math.min(2000, r.plain.length - 64); // past the fixed ftyp box, inside even the shortest take
        expect(req.body.includes(r.plain.subarray(at, at + 64)), `${req.kind} carries part of a recording`).toBe(false);
        expect(req.body.includes(Buffer.from(sha256Hex(r.plain))), `${req.kind} carries an original's hash`).toBe(false);
        expect(req.body.includes(Buffer.from(sha256Hex(r.plain), 'hex')), `${req.kind} carries an original's hash`).toBe(false);
      }
    }

    // Phone B: same Apple Account, iCloud Keychain on. Sign in; text syncs; recordings return.
    const b = makePhone({ backend, uid: MAMA, icloud: mamaCloud, clock, name: 'mama-b' });
    syncText(a, b);
    await b.service.tick();
    for (const r of letters) {
      expect(audioOf(b, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
      expect(sha256Hex(readFileSync(fileURLToPath(audioOf(b, r.id).uri!)))).toBe(sha256Hex(r.plain));
    }
    expect(backend.unwraps).toEqual([]); // iCloud Keychain brought the key: escrow never opened one

    // Phone C: same account, iCloud Keychain off. The never-create rule holds while it waits.
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    expect(c.service.view().restore).toMatchObject({ kind: 'waiting_icloud' });
    expect(await c.vault.bookKeyVersions({ profileId: MAMA, childId: ASHA })).toEqual([]);
    clock.t += ICLOUD_WAIT_MS;
    await c.service.tick();
    // Phone A is an enrolled device, so the hold is 72 hours unless A approves (F08 6.5 C2).
    const restore = c.service.view().restore;
    expect(restore?.kind).toBe('waiting_hold');
    expect(Date.parse((restore as { holdUntil: string }).holdUntil) - clock.t).toBe(72 * HOUR);
    expect(backend.emails.filter((e) => e.kind === 'restore_requested')).toHaveLength(1);
    clock.t += 71 * HOUR;
    await c.service.tick();
    expect(c.service.view().restore?.kind).toBe('waiting_hold');
    expect(backend.unwraps).toEqual([]);
    clock.t += HOUR;
    await c.service.tick();
    expect(c.service.view().restore).toBeNull();
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
    // [F08-REQ-029] one log row and one email per opened key; one key per book.
    expect(backend.unwraps).toEqual([{ uid: MAMA, deviceId: (await c.vault.deviceKey(MAMA))!.deviceId, childId: ASHA, keyVersion: 1, reason: 'restore', requestId: expect.any(String) }]);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    // Never a second key for the book.
    expect(backend.childKeys.filter((k) => k.uid === MAMA)).toHaveLength(1);

    // Phone C can now back up new letters under the same key.
    await c.service.turnOn();
    const later = recordLetter(c, ASHA, 30_000);
    await c.service.tick();
    expect(backend.blobs.get(later.id)?.state).toBe('confirmed');
    syncText(c, b);
    await b.service.tick();
    expect(audioOf(b, later.id).sha256).toBe(sha256Hex(later.plain));
  }, 30_000);

  it('a stopped restore request is never asked again on its own; Try again asks once more', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();

    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    await c.service.tick();
    expect(backend.restores.size).toBe(1);
    // "Not me" on phone A, or the Stop link in the email (F08 6.5 C3, C4).
    for (const r of backend.restores.values()) r.state = 'cancelled';
    clock.t += 100 * HOUR;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    await c.service.tick();
    expect(backend.restores.size).toBe(1);
    expect(backend.unwraps).toEqual([]);
    await c.service.tryAgain();
    await c.service.tick();
    expect(backend.restores.size).toBe(2);
  });

  it('a held request is asked again at most every 5 minutes, and at once when the hold ends', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const r = recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    await c.service.tick(); // asks
    for (let i = 0; i < 5; i++) {
      clock.t += 30 * 1000;
      await c.service.tick();
    }
    expect(backend.releaseCalls).toBe(0);
    clock.t += 5 * 60 * 1000;
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1); // still held: nothing opened
    expect(backend.unwraps).toEqual([]);
    // Phone A approves ("Yes, it's mine"): the next poll releases.
    for (const req of backend.restores.values()) req.state = 'approved';
    clock.t += 5 * 60 * 1000;
    await c.service.tick();
    expect(audioOf(c, r.id).sha256).toBe(sha256Hex(r.plain));
    expect(backend.unwraps).toHaveLength(1);
  });

  it('an old or ended session cannot ask (step-up, 28000 session_ended): sign in again; the escrow kill switch asks nothing', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    c.cond.escrowKilled = true;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'unavailable' });
    expect(backend.restores.size).toBe(0);
    c.cond.escrowKilled = false;
    backend.stepUpRequired = true;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'sign_in_again' });
    expect(backend.restores.size).toBe(0);
    backend.stepUpRequired = false;
    // A session a Stop ended (401 unauthorized, sqlstate 28000, detail session_ended): sign in again, never a silent wait.
    backend.sessionEnded = true;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'sign_in_again' });
    expect(backend.restores.size).toBe(0);
    backend.sessionEnded = false;
    await c.service.tick();
    expect(c.service.view().restore?.kind).toBe('waiting_hold');
  });

  it('with only one phone (lost), the hold is 24 hours (F08 6.5 C2)', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const r = recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    // Phone A is lost: revoked after 90 days of not being seen is the server's rule; here it is revoked.
    for (const d of backend.devices.values()) d.revoked = true;
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    await c.service.tick();
    const restore = c.service.view().restore as { kind: string; holdUntil: string };
    expect(restore.kind).toBe('waiting_hold');
    expect(Date.parse(restore.holdUntil) - clock.t).toBe(24 * HOUR);
    clock.t += 24 * HOUR;
    await c.service.tick();
    expect(audioOf(c, r.id).sha256).toBe(sha256Hex(r.plain));
  });

  it('the Settings line says "carries on later" while a recording retries, then "backed up"', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    backend.faults.set('begin', 1);
    await a.service.tick();
    expect(a.service.view().status).toEqual({ kind: 'paused' });
    clock.t += 10 * 60 * 1000;
    await a.service.tick();
    expect(a.service.view().status).toMatchObject({ kind: 'current' });
  });

  it('an upload call that needs a fresh sign-in (28000, or SCSTP step_up_required) says sign in again, counts no attempt, and goes on after', async () => {
    // #151 raises 28000 with no detail from require_user() on every upload RPC (signed out, or a session
    // a Stop ended); it raises SCSTP only from backup_delete_all, so SCSTP and session_ended here are the
    // client's defensive cases (S07 #138 envelope.ts names both).
    const refusals = [
      { code: '28000', detail: null },
      { code: '28000', detail: 'session_ended' },
      { code: 'SCSTP', detail: 'step_up_required' },
    ];
    for (const refusal of refusals) {
      const clock = { t: 0 };
      const backend = new FakeBackend(() => clock.t);
      const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
      addChild(a, ASHA);
      const letter = recordLetter(a, ASHA, 10_000);
      await a.service.turnOn();
      backend.refuseRpc = refusal;
      await a.service.tick();
      expect(a.service.view().status, refusal.code).toEqual({ kind: 'sign_in_again' });
      const job = a.backupDb.job(letter.id);
      expect(job?.state, refusal.code).toBe('sealed');
      expect(job?.attempts, refusal.code).toBe(0); // not the recording's fault: no backoff to wait out
      // Another pass while still signed out asks once and stops again; nothing is refreshed silently.
      const begins = backend.requests.filter((r) => r.kind === 'begin').length;
      await a.service.tick();
      expect(backend.requests.filter((r) => r.kind === 'begin').length - begins, refusal.code).toBe(1);
      expect(a.service.view().status, refusal.code).toEqual({ kind: 'sign_in_again' });
      // Signed in again: the next pass backs it up.
      backend.refuseRpc = null;
      await a.service.tick();
      expect(backend.blobs.get(letter.id)?.state, refusal.code).toBe('confirmed');
      expect(a.service.view().status, refusal.code).toMatchObject({ kind: 'current' });
    }
  });

  it('turning backup off keeps what is backed up and stops new uploads (F08 6.5 D3)', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const first = recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    await a.service.turnOffKeep();
    expect(backend.consent.get(MAMA)).toBe('withdraw');
    const second = recordLetter(a, ASHA, 10_000);
    await a.service.tick();
    expect(backend.blobs.get(first.id)?.state).toBe('confirmed');
    expect(backend.blobs.has(second.id)).toBe(false);
    expect(a.service.view().status).toEqual({ kind: 'off' });
  });
});

/** Phone A backs up three letters with iCloud Keychain on; phone C (no iCloud Keychain) has their text and asks escrow. */
/** `live`: phone C's live session (for the tests that switch accounts). `elapse`: false stops inside the 72-hour hold. */
async function heldRestore(o: { live?: LiveSession; elapse?: boolean } = {}) {
  const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
  const backend = new FakeBackend(() => clock.t);
  const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
  addChild(a, ASHA);
  const letters = [recordLetter(a, ASHA, 20_000), recordLetter(a, ASHA, 90_000), recordLetter(a, ASHA, 5_000)];
  await a.service.turnOn();
  await a.service.tick();
  const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c', live: o.live });
  syncText(a, c);
  await c.service.tick();
  clock.t += ICLOUD_WAIT_MS;
  await c.service.tick();
  expect(c.service.view().restore?.kind).toBe('waiting_hold');
  if (o.elapse ?? true) clock.t += 72 * HOUR;
  return { clock, backend, a, c, letters };
}

describe('what Settings says, and the recovery service is asked only when it must', () => {
  it('[B1] a recording kept only on this phone (changed since capture) never reads "Backed up"', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const kept = recordLetter(a, ASHA, 10_000);
    const sent = recordLetter(a, ASHA, 10_000);
    writeFileSync(fileURLToPath(kept.uri), Buffer.from('changed after capture')); // its hash no longer matches
    await a.service.turnOn();
    await a.service.tick();
    expect(backend.blobs.get(sent.id)?.state).toBe('confirmed');
    expect(backend.blobs.has(kept.id)).toBe(false);
    expect(a.backupDb.job(kept.id)).toMatchObject({ state: 'blocked', lastError: 'hash_mismatch' });
    expect(a.service.view().status).toEqual({ kind: 'some_kept_here' });
  });

  it('[B1] in the app, a held draft with no server op is not listed, so it never waits as a recording', () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const letter = recordLetter(a, ASHA, 10_000);
    const held = holdDraft(a, ASHA, 10_000, { onServer: true });
    const app = backupSource({ db: () => a.local, profileId: MAMA }); // as runtime.ts builds it today
    expect(app.list().map((i) => i.entryId)).toEqual([letter.id]);
    const later = backupSource({ db: () => a.local, profileId: MAMA, heldOnServer: () => true }); // once S03's op exists
    expect(later.list().map((i) => i.entryId).sort()).toEqual([letter.id, held.id].sort());
  });

  it('[review B m3] the per-id check the queue reads between parts agrees with the list: deleted, erased and others\' letters are out', () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const kept = recordLetter(a, ASHA, 10_000);
    const deleted = recordLetter(a, ASHA, 10_000);
    const erased = recordLetter(a, ASHA, 10_000);
    const held = holdDraft(a, ASHA, 10_000, { onServer: true });
    a.local.run("UPDATE entries SET deleted_at = '2026-10-29T00:00:00Z' WHERE id = ?", deleted.id); // Recently deleted
    a.local.run('DELETE FROM entries WHERE id = ?', erased.id); // erased for good
    for (const src of [backupSource({ db: () => a.local, profileId: MAMA }), backupSource({ db: () => a.local, profileId: MAMA, heldOnServer: () => true })]) {
      const listed = new Set(src.list().map((i) => i.entryId));
      for (const id of [kept.id, deleted.id, erased.id, held.id]) expect(src.has(id), id).toBe(listed.has(id));
    }
    expect(backupSource({ db: () => a.local, profileId: MAMA }).has(kept.id)).toBe(true);
    expect(backupSource({ db: () => a.local, profileId: MAMA }).has(deleted.id)).toBe(false);
    expect(backupSource({ db: () => a.local, profileId: MAMA, heldOnServer: () => true }).has(held.id)).toBe(true);
    expect(backupSource({ db: () => a.local, profileId: PAPA }).has(kept.id)).toBe(false);
  });

  it('[M1] a quota pause lifts at the next launch: one backup_begin asks again', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const letter = recordLetter(a, ASHA, 10_000);
    backend.quotaBytes = 1;
    await a.service.turnOn();
    await a.service.tick();
    expect(a.service.view().status).toEqual({ kind: 'quota' });
    backend.quotaBytes = 5 * 1024 * 1024 * 1024; // raised on the server
    clock.t += HOUR;
    await a.service.tick();
    expect(a.service.view().status).toEqual({ kind: 'quota' }); // within this launch it stays paused
    await a.service.start(); // the next launch
    expect(backend.blobs.get(letter.id)?.state).toBe('confirmed');
    expect(a.service.view().status).toMatchObject({ kind: 'current' });
  });

  it('[M2] a phone with every recording but no key (no iCloud Keychain) asks the recovery service, shows the hold, then backs up', async () => {
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    // Phone B: Mama's own letter is on it (nothing to restore), and the key is not.
    const b = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-b' });
    addChild(b, ASHA);
    const own = recordLetter(b, ASHA, 10_000);
    await b.service.turnOn();
    await b.service.tick();
    expect(b.service.view().status).toEqual({ kind: 'paused' }); // iCloud Keychain may still bring it
    clock.t += ICLOUD_WAIT_MS;
    await b.service.tick();
    expect(backend.requests.filter((r) => r.kind === 'escrow.request')).toHaveLength(1);
    const st = b.service.view().status;
    expect(st.kind).toBe('waiting_key');
    expect(Date.parse((st as { holdUntil: string }).holdUntil) - clock.t).toBe(72 * HOUR);
    expect(b.service.view().restore).toBeNull();
    await b.service.tick();
    expect(backend.requests.filter((r) => r.kind === 'escrow.request')).toHaveLength(1); // asked once
    clock.t += 72 * HOUR;
    await b.service.tick();
    expect(backend.blobs.get(own.id)?.state).toBe('confirmed');
    expect(b.service.view().status).toMatchObject({ kind: 'current' });
    expect(backend.unwraps).toHaveLength(1);
  });

  it('[security 2] a failure after a release retries from the saved copy: escrow releases once, one log row, one email', async () => {
    const { backend, c, letters, clock } = await heldRestore();
    const store = c.service.keys.storeReleased;
    let failures = 3;
    c.service.keys.storeReleased = async (...a) => {
      if (failures-- > 0) throw new BackupServerError('network', true);
      return store(...a);
    };
    for (let i = 0; i < 3; i++) {
      await c.service.tick();
      expect(c.service.view().restore).toEqual({ kind: 'unavailable' });
      clock.t += 1000;
    }
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1);
    expect(backend.unwraps).toHaveLength(1);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[security 2] a release that can never be stored here stops; only Try again asks escrow once more', async () => {
    const { backend, c, letters, clock } = await heldRestore();
    const open = c.vault.openBookKey;
    c.vault.openBookKey = async () => {
      throw Object.assign(new Error('key_check_failed'), { code: 'key_check_failed' });
    };
    for (let i = 0; i < 4; i++) {
      await c.service.tick();
      clock.t += 1000;
    }
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    expect(backend.releaseCalls).toBe(1);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    c.vault.openBookKey = open;
    await c.service.tryAgain();
    await c.service.tick();
    expect(backend.releaseCalls).toBe(2);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[security 2] the Keychain refusing the write as the phone locks: stored from the kept copy on the next pass, no second release', async () => {
    const { backend, c, letters, clock } = await heldRestore();
    const open = c.vault.openBookKey;
    let refusals = 2;
    c.vault.openBookKey = async (...a) => {
      if (refusals-- > 0) throw Object.assign(new Error('keychain_unavailable'), { code: 'keychain_unavailable' });
      return open(...a);
    };
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'unavailable' }); // not stopped: nothing for the person to do
    clock.t += 1000;
    await c.service.tick();
    clock.t += 1000;
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[review B N4 on #252] during an escrow hold the list is not asked again: escrow alone is, and the list once the keys come', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, c, letters, clock } = await heldRestore({ live, elapse: false });
    let lists = 0;
    live.onSend = (name, phase) => {
      if (name === 'listBlobs' && phase === 'before') lists += 1;
    };
    for (let i = 0; i < 5; i++) {
      clock.t += 1000;
      await c.service.tick();
    }
    expect(lists).toBe(0);
    expect(backend.releaseCalls).toBe(0); // polled at most every 5 minutes, as before
    expect(c.service.view().restore?.kind).toBe('waiting_hold');
    clock.t += 72 * HOUR;
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1);
    expect(lists).toBe(1);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[review B N4 on #252] after a Stop the list is not asked again in this run; Try again lists and asks once more', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, c, clock } = await heldRestore({ live, elapse: false });
    let lists = 0;
    live.onSend = (name, phase) => {
      if (name === 'listBlobs' && phase === 'before') lists += 1;
    };
    for (const r of backend.restores.values()) r.state = 'cancelled'; // the Stop link
    clock.t += 5 * 60 * 1000;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    for (let i = 0; i < 5; i++) {
      clock.t += 1000;
      await c.service.tick();
    }
    expect(lists).toBe(0);
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    await c.service.tryAgain();
    await c.service.tick();
    expect(lists).toBe(1);
    expect(backend.requests.filter((r) => r.kind === 'escrow.request')).toHaveLength(2);
  });

  /** iCloud Keychain brings phone A's book keys to phone C at last (it was off, or slow, until now). */
  const iCloudBrings = (a: Phone, c: Phone) => {
    for (const [acc, versions] of a.icloud!.items) c.vault.local.set(acc, new Map(versions));
  };
  /** Counts the server reads phone C makes from now on. */
  const reads = (live: LiveSession) => {
    const n = { listBlobs: 0, listKeys: 0 };
    live.onSend = (name, phase) => {
      if (phase === 'before' && (name === 'listBlobs' || name === 'listKeys')) n[name] += 1;
    };
    return n;
  };

  it('[re-check B on #252] a key iCloud Keychain brings during the hold restores on the next pass: no release, no email', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, a, c, letters, clock } = await heldRestore({ live, elapse: false });
    const n = reads(live);
    clock.t += 1000;
    await c.service.tick();
    expect(n).toEqual({ listBlobs: 0, listKeys: 0 }); // no key yet: the list is not asked again, nor the key rows
    iCloudBrings(a, c);
    clock.t += 1000;
    await c.service.tick();
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
    expect(n.listBlobs).toBe(1);
    expect(c.service.view().restore).toBeNull();
    clock.t += 72 * HOUR; // the hold ends: nothing asks escrow for a key this phone has
    await c.service.tick();
    expect(backend.releaseCalls).toBe(0);
    expect(backend.unwraps).toHaveLength(0);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(0);
  });

  it('[re-check B on #252] a key iCloud Keychain brings after a Stop restores in the same run, with nothing opened by escrow', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, a, c, letters, clock } = await heldRestore({ live, elapse: false });
    for (const r of backend.restores.values()) r.state = 'cancelled'; // the Stop link
    clock.t += 5 * 60 * 1000;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    iCloudBrings(a, c);
    await c.service.tick();
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
    expect(c.service.view().restore).toBeNull();
    expect(backend.unwraps).toHaveLength(0);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(0);
  });

  it('[re-check B on #252] a recording that still has no key keeps its once-a-run listing while another one comes back by iCloud', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, a, c, letters, clock } = await heldRestore({ live, elapse: false });
    // A second child's book key, never on iCloud Keychain for phone C: its recording waits on escrow.
    const twin = 'a5a5a5a5-0000-4000-8000-000000000002';
    addChild(a, twin, 'Asha twin');
    const late = recordLetter(a, twin, 30_000);
    await a.service.tick();
    syncText(a, c, [late.id]);
    clock.t += 1000;
    await c.service.tick(); // the new letter is listed once; its key is not here
    const n = reads(live);
    for (const [acc, versions] of a.icloud!.items) if (acc.endsWith(ASHA)) c.vault.local.set(acc, new Map(versions)); // only Asha's key arrives
    clock.t += 1000;
    await c.service.tick();
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
    expect(audioOf(c, late.id).uri).toBeNull();
    expect(n.listBlobs).toBe(1); // the listing that restored Asha's
    for (let i = 0; i < 4; i++) {
      clock.t += 1000;
      await c.service.tick();
    }
    expect(n.listBlobs).toBe(1); // the twin's recording, still without a key, is not listed again in this run
    expect(backend.unwraps).toHaveLength(0);
  });

  it('[#252 follow-up] with the escrow switch off, then a fresh sign-in needed, the list is read once in this run; escrow alone is asked after', async () => {
    const live: LiveSession = { uid: MAMA };
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    const letters = [recordLetter(a, ASHA, 20_000), recordLetter(a, ASHA, 5_000)];
    await a.service.turnOn();
    await a.service.tick();
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c', live });
    syncText(a, c);
    await c.service.tick(); // iCloud Keychain may still bring the key
    clock.t += ICLOUD_WAIT_MS;
    const n = reads(live);
    c.cond.escrowKilled = true;
    for (let i = 0; i < 5; i++) {
      await c.service.tick();
      clock.t += 1000;
    }
    expect(n.listBlobs).toBe(1);
    expect(c.service.view().restore).toEqual({ kind: 'unavailable' });
    expect(backend.restores.size).toBe(0);
    c.cond.escrowKilled = false;
    backend.stepUpRequired = true;
    for (let i = 0; i < 5; i++) {
      await c.service.tick();
      clock.t += 1000;
    }
    expect(n.listBlobs).toBe(1);
    expect(c.service.view().restore).toEqual({ kind: 'sign_in_again' });
    expect(backend.restores.size).toBe(0);
    backend.stepUpRequired = false; // signed in again
    await c.service.tick();
    expect(c.service.view().restore?.kind).toBe('waiting_hold');
    expect(n.listBlobs).toBe(1);
    clock.t += 72 * HOUR;
    await c.service.tick();
    expect(n.listBlobs).toBe(2); // the keys are here: listed once more, and every recording comes back
    expect(backend.releaseCalls).toBe(1);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[review A N3 on #255] a release that leaves a recording without its key is not asked for again with no new hold', async () => {
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    const twin = 'a5a5a5a5-0000-4000-8000-000000000002';
    addChild(a, ASHA);
    addChild(a, twin, 'Asha twin');
    const asha = recordLetter(a, ASHA, 20_000);
    const late = recordLetter(a, twin, 20_000);
    await a.service.turnOn();
    await a.service.tick();
    // As #151: a request this device released in the last 24 hours is answered as it stands, and the next
    // release call releases it again with no new hold. The twin's wrap does not open there, so a release
    // carries Asha's key only.
    const escrowFor = backend.escrowFor.bind(backend);
    const releasedAt = new Map<string, number>();
    let releases = 0;
    backend.escrowFor = (uid: string) => {
      const e = escrowFor(uid);
      return {
        async request(deviceId: string) {
          for (const [id, at] of releasedAt) {
            const r = backend.restores.get(id)!;
            if (r.deviceId === deviceId && clock.t - at < 24 * HOUR) return { requestId: id, state: 'released' as const, holdUntil: r.holdUntil };
          }
          return e.request(deviceId);
        },
        async release(requestId: string, deviceId: string) {
          const out = await e.release(requestId, deviceId);
          if (out.state !== 'released') return out;
          releases += 1;
          releasedAt.set(requestId, clock.t);
          return { ...out, keys: out.keys.filter((k) => k.childId !== twin) };
        },
      };
    };
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    await c.service.tick();
    expect(c.service.view().restore?.kind).toBe('waiting_hold');
    clock.t += 72 * HOUR;
    for (let i = 0; i < 8; i++) {
      await c.service.tick();
      clock.t += 60 * 1000;
    }
    expect(releases).toBe(1);
    expect(audioOf(c, asha.id).sha256).toBe(sha256Hex(asha.plain));
    expect(audioOf(c, late.id).uri).toBeNull();
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    await c.service.tryAgain(); // within the 24 hours: still no release without a new hold
    await c.service.tick();
    expect(releases).toBe(1);
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    clock.t += 24 * HOUR;
    await c.service.tryAgain(); // a day later Try again makes a new request, with its own hold
    await c.service.tick();
    expect(c.service.view().restore?.kind).toBe('waiting_hold');
    expect(releases).toBe(1);
  });

  /** Phone B has Mama's own new letter and no book key (no iCloud Keychain): the upload side asked escrow and waits on the hold. */
  async function heldUpload() {
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    const b = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-b' });
    addChild(b, ASHA);
    const own = recordLetter(b, ASHA, 10_000);
    await b.service.turnOn();
    await b.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    await b.service.tick();
    expect(b.service.view().status.kind).toBe('waiting_key');
    // Backup on mobile data is off and the phone is on it: uploads pause before the queue reads the key again.
    b.cond.net = 'cellular';
    return { clock, backend, a, b, own };
  }

  it('[escrow window] a key iCloud Keychain brings while uploads are paused: after the hold no release, no email', async () => {
    const { clock, backend, a, b, own } = await heldUpload();
    iCloudBrings(a, b);
    clock.t += 72 * HOUR; // the hold is over: for 7 days a release call would open every key at once
    for (let i = 0; i < 3; i++) {
      await b.service.tick();
      clock.t += 5 * 60 * 1000;
    }
    expect(backend.releaseCalls).toBe(0);
    expect(backend.unwraps).toHaveLength(0);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(0);
    expect(b.service.view().status).toEqual({ kind: 'waiting_wifi' });
    b.cond.net = 'wifi';
    await b.service.tick();
    expect(backend.blobs.get(own.id)?.state).toBe('confirmed');
    expect(b.service.view().status).toMatchObject({ kind: 'current' });
    expect(backend.releaseCalls).toBe(0);
  });

  it('[escrow window] with uploads paused and still no key here, escrow is asked after the hold and releases exactly once', async () => {
    const { clock, backend, b, own } = await heldUpload();
    clock.t += 72 * HOUR;
    for (let i = 0; i < 3; i++) {
      await b.service.tick();
      clock.t += 5 * 60 * 1000;
    }
    expect(backend.releaseCalls).toBe(1);
    expect(backend.unwraps).toHaveLength(1);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    b.cond.net = 'wifi';
    await b.service.tick();
    expect(backend.blobs.get(own.id)?.state).toBe('confirmed');
    expect(backend.releaseCalls).toBe(1);
  });

  it('[review B N3 on #252] a release that lands as another account signs in is kept: stored from the saved copy later, one release, one email', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, c, letters, clock } = await heldRestore({ live });
    // The release answers, then Papa's sign-in lands before the keys are stored (their rows are read first).
    live.onSend = (name, phase) => {
      if (name === 'release' && phase === 'after') live.uid = PAPA;
    };
    await c.service.tick();
    live.onSend = undefined;
    expect(backend.releaseCalls).toBe(1);
    expect(c.service.view().restore).toEqual({ kind: 'unavailable' }); // not stopped: nothing for anyone to do
    expect(c.backupDb.getMeta('restoreStopped')).toBeNull();
    expect(c.backupDb.getMeta('restoreReleased')).not.toBeNull(); // the saved copy, still sealed to this phone
    clock.t += 1000;
    await c.service.tick(); // still Papa's session: nothing is asked in Mama's name
    expect(backend.releaseCalls).toBe(1);
    live.uid = MAMA;
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1);
    expect(backend.unwraps).toHaveLength(1);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[security 2] any other failure saving a release stops; Try again stores from this session\'s copy, never a second release', async () => {
    const { backend, c, letters } = await heldRestore();
    // The saved copy cannot be written either: only this session's copy in memory is left.
    const setMeta = c.backupDb.setMeta.bind(c.backupDb);
    c.backupDb.setMeta = (k: string, v: string) => {
      if (k === 'restoreReleased') throw new Error('disk full');
      setMeta(k, v);
    };
    const store = c.service.keys.storeReleased;
    let failures = 1;
    c.service.keys.storeReleased = async (...a) => {
      if (failures-- > 0) throw new Error('unexpected');
      return store(...a);
    };
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1); // stopped: nothing is asked on its own
    await c.service.tryAgain();
    await c.service.tick();
    expect(backend.releaseCalls).toBe(1); // Try again stored from the kept copy
    expect(backend.unwraps).toHaveLength(1);
    expect(backend.emails.filter((e) => e.kind === 'key_opened')).toHaveLength(1);
    for (const r of letters) expect(audioOf(c, r.id).sha256, r.id).toBe(sha256Hex(r.plain));
  });

  it('[security 3] a revoked phone stops, never enrols again on its own, and gets a new device key only after Try again', async () => {
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const a = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-a' });
    addChild(a, ASHA);
    recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    const c = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-c' });
    syncText(a, c);
    await c.service.tick();
    clock.t += ICLOUD_WAIT_MS;
    await c.service.tick();
    const first = (await c.vault.deviceKey(MAMA))!.deviceId;
    backend.devices.get(first)!.revoked = true; // "Not me" on phone A
    clock.t += 10 * 60 * 1000;
    await c.service.tick();
    expect(c.service.view().restore).toEqual({ kind: 'stopped' });
    clock.t += 10 * 60 * 1000;
    await c.service.tick();
    expect(backend.restores.size).toBe(1);
    expect((await c.vault.deviceKey(MAMA))!.deviceId).toBe(first);
    await c.service.tryAgain();
    await c.service.tick();
    const second = (await c.vault.deviceKey(MAMA))!.deviceId;
    expect(second).not.toBe(first);
    expect(backend.devices.get(second)).toMatchObject({ uid: MAMA, revoked: false });
    expect(backend.restores.size).toBe(2);
    expect([...backend.restores.values()].at(-1)!.deviceId).toBe(second);
  });

  it('[M4] a new phone says recordings are coming back while they download, and knows there is a backup with backup off', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const cloud = new FakeICloud();
    const a = makePhone({ backend, uid: MAMA, icloud: cloud, clock, name: 'mama-a' });
    addChild(a, ASHA);
    const letter = recordLetter(a, ASHA, 10_000);
    await a.service.turnOn();
    await a.service.tick();
    expect(a.service.view().hasBackup).toBe(false); // nothing to restore here, so it never asked
    // Phone B: Settings is told as the download starts, and the line goes once everything is here.
    const b = makePhone({ backend, uid: MAMA, icloud: cloud, clock, name: 'mama-b' });
    syncText(a, b);
    await b.service.tick();
    expect(b.changes.map((v) => v.restore)).toEqual([{ kind: 'restoring' }]);
    expect(audioOf(b, letter.id).sha256).toBe(sha256Hex(letter.plain));
    expect(b.service.view()).toMatchObject({ status: { kind: 'off' }, restore: null, hasBackup: true });
    // Phone D: the download waits for Wi-Fi, and Settings still says the recordings are coming back.
    const d = makePhone({ backend, uid: MAMA, icloud: cloud, clock, name: 'mama-d' });
    syncText(a, d);
    d.cond.net = 'cellular';
    await d.service.tick();
    expect(d.service.view().restore).toEqual({ kind: 'restoring' });
    d.cond.net = 'wifi';
    await d.service.tick();
    expect(d.service.view().restore).toBeNull();
  });
});
