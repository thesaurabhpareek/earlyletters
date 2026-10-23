/// <reference types="node" />
/**
 * Which account backup runs for on a phone, and where its state lives (lib/backup/account.ts;
 * review B M2 on PR #150): only the account released to sync, and one backup state per account,
 * so a sign-in that ends with "Not my account", or a second account, never turns this one's backup
 * off or drops its queue. Fictional family Asha only (Mama, Papa).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { backupAccountFor, backupDbFileFor, createAccountHost } from '../src/lib/backup/account';
import { openBackupDb, type BackupDb } from '../src/lib/backup/local-db';
import type { BackupService } from '../src/lib/backup/service';
import { FakeBackend, FakeICloud } from './helpers/backup-node';
import { addChild, cleanupPhones, makePhone, recordLetter } from './helpers/backup-phone';
import { nodeDb } from './helpers/node-db';

const MAMA = '11111111-1111-4111-8111-111111111111';
const PAPA = '22222222-2222-4222-8222-222222222222';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';

afterEach(cleanupPhones);

describe('which account backup runs for', () => {
  it('only the session that is released to sync (consent complete, and "Keep them here" when asked)', () => {
    expect(backupAccountFor(MAMA, MAMA)).toBe(MAMA);
    expect(backupAccountFor(PAPA, null)).toBeNull(); // still consenting, or on the claim screen
    expect(backupAccountFor(PAPA, MAMA)).toBeNull();
    expect(backupAccountFor(null, MAMA)).toBeNull();
    expect(backupAccountFor('not-a-uuid', 'not-a-uuid')).toBeNull();
  });

  it('one backup state file per account', () => {
    expect(backupDbFileFor(MAMA)).toBe(`backup-${MAMA}.db`);
    expect(backupDbFileFor(MAMA)).not.toBe(backupDbFileFor(PAPA));
    expect(() => backupDbFileFor('../backup')).toThrow();
  });
});

describe('[review B M2] another account on this phone never turns this one off', () => {
  function setup() {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const iso = () => new Date(clock.t).toISOString();
    const dbs = new Map<string, BackupDb>();
    const dbOf = (uid: string): BackupDb => {
      const file = backupDbFileFor(uid);
      if (!dbs.has(file)) dbs.set(file, openBackupDb(nodeDb().db, iso));
      return dbs.get(file)!;
    };
    // Mama's phone: its files, letters and Keychain stay; each account that runs gets its own backup state.
    const phone = makePhone({ backend, uid: MAMA, icloud, clock, name: 'mama', backupDb: dbOf(MAMA) });
    addChild(phone, ASHA);
    const made: string[] = [];
    const host = createAccountHost<BackupService>((uid) => {
      made.push(uid);
      if (made.length === 1 && uid === MAMA) return phone.service;
      return makePhone({ backend, uid, icloud, clock, name: uid, backupDb: dbOf(uid), share: phone }).service;
    });
    return { backend, phone, host, dbOf, made };
  }

  it('"Not my account": no service runs for Papa, and Mama signs back in to backup on and her queue kept', async () => {
    const { backend, phone, host, dbOf, made } = setup();
    const mama = await host.forAccount(MAMA, MAMA);
    expect(await mama!.turnOn()).toBe('on');
    phone.cond.net = 'none'; // the upload waits, so a job sits in Mama's queue
    const rec = recordLetter(phone, ASHA, 70_000);
    await mama!.tick();
    expect(dbOf(MAMA).job(rec.id)).not.toBeNull();
    const before = backend.requests.length;
    // Papa signs in on Mama's phone; the claim screen shows, and he taps Not my account (signed out).
    expect(await host.forAccount(PAPA, null)).toBeNull();
    expect(await host.forAccount(null, null)).toBeNull();
    expect(made).toEqual([MAMA]);
    expect(backend.requests.length).toBe(before); // nothing listed, uploaded, restored or asked of escrow for him
    expect(dbOf(MAMA).getMeta('enabled')).toBe('on');
    // Mama signs back in: backup is still on and the queued recording goes.
    const again = await host.forAccount(MAMA, MAMA);
    expect(again).not.toBe(mama);
    expect(again!.view().status.kind).not.toBe('off');
    expect(dbOf(MAMA).job(rec.id)).not.toBeNull();
    await again!.tick();
    expect(backend.blobs.get(rec.id)?.state).toBe('confirmed');
  });

  it('a second real account gets its own backup state; Mama\'s stays on', async () => {
    const { host, dbOf } = setup();
    const mama = await host.forAccount(MAMA, MAMA);
    expect(await mama!.turnOn()).toBe('on');
    const papa = await host.forAccount(PAPA, PAPA);
    expect(papa).not.toBeNull();
    expect(papa!.view().status.kind).toBe('off');
    expect(dbOf(MAMA).getMeta('enabled')).toBe('on');
    const back = await host.forAccount(MAMA, MAMA);
    expect(back!.view().status.kind).not.toBe('off');
  });
});
