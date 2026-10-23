/// <reference types="node" />
/**
 * Which account backup runs for on a phone, and where its state lives (lib/backup/account.ts;
 * review B M2 on PR #150): only the account released to sync, and one backup state per account,
 * so a sign-in that ends with "Not my account", or a second account, never turns this one's backup
 * off or drops its queue. Fictional family Asha only (Mama, Papa).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { AccountChanged, backupAccountFor, backupDbFileFor, createAccountHost, sameAccountOnly } from '../src/lib/backup/account';
import { openBackupDb, type BackupDb } from '../src/lib/backup/local-db';
import type { BackupService } from '../src/lib/backup/service';
import { FakeBackend, FakeICloud } from './helpers/backup-node';
import { addChild, cleanupPhones, makePhone, recordLetter, syncText, audioOf, type LiveSession } from './helpers/backup-phone';
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

/** Two accounts on one phone. `live`: the phone's one Supabase session, which every server call goes under. */
function setup(o: { live?: LiveSession } = {}) {
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
    const phone = makePhone({ backend, uid: MAMA, icloud, clock, name: 'mama', backupDb: dbOf(MAMA), live: o.live });
    addChild(phone, ASHA);
    const made: string[] = [];
    const host = createAccountHost<BackupService>((uid) => {
      made.push(uid);
      if (made.length === 1 && uid === MAMA) return phone.service;
      return makePhone({ backend, uid, icloud, clock, name: uid, backupDb: dbOf(uid), share: phone, live: o.live }).service;
    });
    return { backend, phone, host, dbOf, made, icloud, clock };
}

describe('[review B M2] another account on this phone never turns this one off', () => {
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

/** Papa's sign-in lands once, as the first `name` call is sent (`before`) or answers (`after`). */
function landsAt(live: LiveSession, name: string, phase: 'before' | 'after', uid: string | null = PAPA): void {
  let done = false;
  live.onSend = (n, p) => {
    if (done || n !== name || p !== phase) return;
    done = true;
    live.uid = uid;
  };
}

describe('[follow-up on #150] a pass never calls the server under the next account\'s session', () => {
  it('each call checks the live session first: another account, or none, stops it before it is made', async () => {
    const live: LiveSession = { uid: MAMA };
    const calls: string[] = [];
    const api = sameAccountOnly({ listBlobs: async () => calls.push('listBlobs') }, async () => live.uid, MAMA);
    await api.listBlobs();
    for (const uid of [PAPA, null]) {
      live.uid = uid;
      await expect(api.listBlobs()).rejects.toBeInstanceOf(AccountChanged);
    }
    const throwing = sameAccountOnly({ listBlobs: async () => calls.push('listBlobs') }, async () => Promise.reject(new Error('storage')), MAMA);
    await expect(throwing.listBlobs()).rejects.toBeInstanceOf(AccountChanged);
    expect(calls).toEqual(['listBlobs']);
  });

  it('[review A N1 on #252] with recheck, an answer or a refusal that came back after the session changed is never acted on', async () => {
    const live: LiveSession = { uid: MAMA };
    const api = {
      listKeys: async () => {
        live.uid = PAPA; // a sign-in lands while the request is out
        return [];
      },
      storeKey: async () => {
        live.uid = PAPA;
        throw new Error('42501');
      },
    };
    const checked = sameAccountOnly(api, async () => live.uid, MAMA, { recheck: true });
    await expect(checked.listKeys()).rejects.toBeInstanceOf(AccountChanged);
    live.uid = MAMA;
    await expect(checked.storeKey()).rejects.toBeInstanceOf(AccountChanged);
    live.uid = MAMA;
    expect(await sameAccountOnly(api, async () => live.uid, MAMA).listKeys()).toEqual([]); // escrow's wrapper: no recheck
  });

  it('[review A N1 on #252] a sign-in landing between the check and the send: the answer under it is dropped, so no book key is made from it', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    // Mama's first phone backed up Asha's recordings: the server holds her book key for Asha.
    const first = makePhone({ backend, uid: MAMA, icloud: new FakeICloud(), clock, name: 'mama-first' });
    addChild(first, ASHA);
    recordLetter(first, ASHA, 10_000);
    expect(await first.service.turnOn()).toBe('on');
    await first.service.tick();
    expect(backend.childKeys).toHaveLength(1);
    // Her new phone, without iCloud Keychain, records a letter of its own.
    const live: LiveSession = { uid: MAMA };
    const fresh = makePhone({ backend, uid: MAMA, icloud: null, clock, name: 'mama-new', live });
    addChild(fresh, ASHA);
    const rec = recordLetter(fresh, ASHA, 10_000);
    expect(await fresh.service.turnOn()).toBe('on');
    // The key rows are asked for under Mama's checked session, and Papa's lands before the request goes:
    // the answer is Papa's view (no key for Asha), which would make a second book key here.
    landsAt(live, 'listKeys', 'before');
    await fresh.service.tick();
    expect(await fresh.vault.bookKeyVersions({ profileId: MAMA, childId: ASHA })).toEqual([]);
    expect(backend.childKeys).toHaveLength(1);
    expect(fresh.backupDb.job(rec.id)).toMatchObject({ state: 'queued', attempts: 0, lastError: null });
  });

  it('Papa signs in while Mama\'s upload runs: her next call is not made, nothing is counted, and her upload goes on', async () => {
    const live: LiveSession = { uid: MAMA };
    const { backend, phone, host, dbOf } = setup({ live });
    const rec = recordLetter(phone, ASHA, 70_000);
    // Papa's sign-in lands as Mama's backup_begin answers, before her service retires (about 500 ms in the app).
    landsAt(live, 'begin', 'after');
    const mama = await host.forAccount(MAMA, MAMA);
    expect(await mama!.turnOn()).toBe('on');
    await mama!.tick();
    // The answer is not acted on (begin is idempotent, so it is asked again), and the upload under Papa's
    // session, which would be refused (403) and counted, is never made.
    expect(dbOf(MAMA).job(rec.id)).toMatchObject({ state: 'sealed', attempts: 0, lastError: null });
    expect(backend.uploads.size).toBe(0);
    expect(backend.objects.size).toBe(0);
    expect(mama!.view().status.kind).toBe('paused');
    // Mama's session again (or her service retires and comes back): the same job carries on.
    live.uid = MAMA;
    await mama!.tick();
    expect(backend.blobs.get(rec.id)?.state).toBe('confirmed');
    expect(dbOf(MAMA).job(rec.id)).toMatchObject({ state: 'confirmed', attempts: 0 });
  });

  it('a restore stopped that way is not a failed try: the recording comes back on the next pass', async () => {
    const live: LiveSession = { uid: MAMA };
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const old = makePhone({ backend, uid: MAMA, icloud, clock, name: 'mama-old' });
    addChild(old, ASHA);
    expect(await old.service.turnOn()).toBe('on');
    const rec = recordLetter(old, ASHA, 70_000);
    await old.service.tick();
    expect(backend.blobs.get(rec.id)?.state).toBe('confirmed');
    // Mama's new phone, on the same iCloud Keychain: her letter's words came by sync, its recording did not.
    const fresh = makePhone({ backend, uid: MAMA, icloud, clock, name: 'mama-new', live });
    syncText(old, fresh);
    // Papa's session lands between the check and the send of the download link: the answer under it is a refusal.
    landsAt(live, 'downloadUrl', 'before');
    await fresh.service.tick();
    expect(audioOf(fresh, rec.id).uri).toBeNull();
    expect(fresh.backupDb.restoreItem(rec.id)?.attempts ?? 0).toBe(0);
    live.uid = MAMA;
    await fresh.service.tick();
    expect(audioOf(fresh, rec.id).sha256).toBe(audioOf(old, rec.id).sha256);
    expect(fresh.backupDb.restoreItem(rec.id)).toMatchObject({ state: 'done' });
  });
});
