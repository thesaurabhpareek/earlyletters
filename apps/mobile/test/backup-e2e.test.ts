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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { ICLOUD_WAIT_MS } from '../src/lib/backup/keys';
import { FakeBackend, FakeICloud, sha256Hex } from './helpers/backup-node';
import { addChild, audioOf, cleanupPhones, holdDraft, makePhone, recordLetter, syncText } from './helpers/backup-phone';

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
    expect(a.service.view().status).toMatchObject({ kind: 'current' });
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
    for (const req of backend.requests) {
      expect(req.body.includes(Buffer.from('ftyp')), req.kind).toBe(false);
      for (const r of originals) {
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
    expect(backend.unwraps).toEqual([{ uid: MAMA, deviceId: (await c.vault.deviceKey())!.deviceId, childId: ASHA, keyVersion: 1, reason: 'restore', requestId: expect.any(String) }]);
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
    c.service.restore.clearStopped();
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

  it('an old or ended session cannot ask (step-up, SCSES): sign in again; the escrow kill switch asks nothing', async () => {
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
    // A session a Stop ended (#151 SCSES, 401 unauthorized): sign in again, never a silent wait.
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
