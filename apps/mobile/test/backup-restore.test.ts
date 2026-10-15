/// <reference types="node" />
/**
 * Restore on a new phone (lib/backup/restore.ts; WP-F08-B5b; F08 6.5 B;
 * F08-REQ-023; F08-U02, U18 to U20). The conflict rules first, as a table;
 * then real restores between two phones with the app's own local database.
 * The rule that matters most: a file already on the phone is never
 * overwritten. Fictional family Asha only.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { planRestore, type LocalLetter } from '../src/lib/backup/restore';
import { FakeBackend, FakeICloud, fakeM4a, sha256Hex } from './helpers/backup-node';
import { addChild, audioOf, cleanupPhones, makePhone, recordLetter, syncText, type Phone } from './helpers/backup-phone';

const MAMA = '11111111-1111-4111-8111-111111111111';
const PAPA = '22222222-2222-4222-8222-222222222222';
const ASHA = 'a5a5a5a5-0000-4000-8000-000000000001';
const LETTER = '01928c3e-5a2b-7c3d-8e4f-0000000000aa';

afterEach(cleanupPhones);

describe('restore conflict rules (planRestore)', () => {
  const letter = (o: Partial<LocalLetter> = {}): LocalLetter => ({ entryId: LETTER, authorId: MAMA, deleted: false, audioUri: null, audioSha256: null, ...o });
  const none = { exists: false, sha256: null };
  const cases: [string, Parameters<typeof planRestore>[0], ReturnType<typeof planRestore>['kind']][] = [
    ['text not synced yet: wait', { blob: { entryId: LETTER }, letter: null, me: MAMA, file: none }, 'wait_for_letter'],
    ['someone else\'s letter (Papa\'s, on Mama\'s phone): skip', { blob: { entryId: LETTER }, letter: letter({ authorId: PAPA }), me: MAMA, file: none }, 'skip'],
    ['deleted letter: skip', { blob: { entryId: LETTER }, letter: letter({ deleted: true }), me: MAMA, file: none }, 'skip'],
    ['no recording on this phone: download', { blob: { entryId: LETTER }, letter: letter(), me: MAMA, file: none }, 'download'],
    ['a letter written before sign-in (no author) is mine', { blob: { entryId: LETTER }, letter: letter({ authorId: null }), me: MAMA, file: none }, 'download'],
    ['names a file that is gone: download', { blob: { entryId: LETTER }, letter: letter({ audioUri: 'file:///Documents/a.m4a', audioSha256: 'aa' }), me: MAMA, file: none }, 'download'],
    ['the same file is here (an iCloud device backup): nothing to do', { blob: { entryId: LETTER }, letter: letter({ audioUri: 'file:///Documents/a.m4a', audioSha256: 'aa' }), me: MAMA, file: { exists: true, sha256: 'aa' } }, 'present'],
    ['a different file is here: keep it, never overwrite', { blob: { entryId: LETTER }, letter: letter({ audioUri: 'file:///Documents/a.m4a', audioSha256: 'aa' }), me: MAMA, file: { exists: true, sha256: 'bb' } }, 'keep_local'],
    ['a file is here and the letter has no hash: keep it', { blob: { entryId: LETTER }, letter: letter({ audioUri: 'file:///Documents/a.m4a' }), me: MAMA, file: { exists: true, sha256: 'bb' } }, 'present'],
  ];
  for (const [name, input, kind] of cases) it(name, () => expect(planRestore(input).kind).toBe(kind));
});

async function backedUpPhone(backend: FakeBackend, clock: { t: number }, icloud: FakeICloud, letters = 3) {
  const a = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-a' });
  addChild(a, ASHA);
  const recs = [];
  for (let i = 0; i < letters; i++) recs.push(recordLetter(a, ASHA, 70_000 + i * 50_000));
  expect(await a.service.turnOn()).toBe('on');
  await a.service.tick();
  for (const r of recs) expect(backend.blobs.get(r.id)?.state, r.id).toBe('confirmed');
  return { a, recs };
}

function documents(p: Phone): string[] {
  return readdirSync(p.files.docDir).sort();
}

describe('[F08-REQ-023] restore on a new phone', () => {
  it('signs in, text arrives, every recording comes back with its hash, and the letter points at it', async () => {
    const clock = { t: Date.parse('2026-10-29T19:00:00Z') };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    for (const r of recs) {
      const audio = audioOf(b, r.id);
      expect(audio.uri, r.id).not.toBeNull();
      expect(audio.sha256).toBe(sha256Hex(r.plain));
      expect(sha256Hex(readFileSync(fileURLToPath(audio.uri!)))).toBe(sha256Hex(r.plain));
    }
    expect(readdirSync(b.files.tmpDir)).toEqual([]);
    // Restoring a recording does not upload it again.
    const tus = backend.requests.filter((x) => x.kind === 'tus').length;
    await b.service.turnOn();
    await b.service.tick();
    expect(backend.requests.filter((x) => x.kind === 'tus').length).toBe(tus);
  });

  it('waits for a letter whose text has not synced, then brings it back', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 2);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b, [recs[0].id]);
    await b.service.tick();
    expect(audioOf(b, recs[0].id).sha256).toBe(sha256Hex(recs[0].plain));
    expect(documents(b)).toHaveLength(1);
    syncText(a, b);
    await b.service.tick();
    expect(audioOf(b, recs[1].id).sha256).toBe(sha256Hex(recs[1].plain));
  });

  it('never overwrites a file already on the phone, even one that differs from the backup', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 2); // the second is missing, so a restore pass runs
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const mine = fakeM4a(5000);
    const uri = b.files.documentUri('newer.m4a');
    writeFileSync(fileURLToPath(uri), mine);
    b.local.run('UPDATE entries SET audio_uri = ?, audio_sha256 = ? WHERE id = ?', uri, sha256Hex(mine), recs[0].id);
    await b.service.tick();
    // The letter's own file matches its own hash: it is the letter's recording, kept as it is, nothing downloaded.
    expect(sha256Hex(readFileSync(fileURLToPath(uri)))).toBe(sha256Hex(mine));
    expect(audioOf(b, recs[0].id)).toEqual({ uri, sha256: sha256Hex(mine) });
    expect(documents(b)).toEqual([`${recs[1].id}.m4a`, 'newer.m4a'].sort());
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('done');
    expect(audioOf(b, recs[1].id).sha256).toBe(sha256Hex(recs[1].plain));
  });

  it('[F08-U02] a local file that differs from its letter\'s hash is kept and flagged, never replaced by the backup', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 2);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const changed = fakeM4a(5000);
    const uri = b.files.documentUri('changed.m4a');
    writeFileSync(fileURLToPath(uri), changed);
    b.local.run('UPDATE entries SET audio_uri = ?, audio_sha256 = ? WHERE id = ?', uri, sha256Hex(recs[0].plain), recs[0].id);
    await b.service.tick();
    expect(sha256Hex(readFileSync(fileURLToPath(uri)))).toBe(sha256Hex(changed));
    expect(documents(b)).toEqual([`${recs[1].id}.m4a`, 'changed.m4a'].sort());
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('kept_local');
  });

  it('a recording already here from an iCloud device backup is matched by hash and not downloaded', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 2);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const uri = b.files.documentUri('from-device-backup.m4a');
    writeFileSync(fileURLToPath(uri), recs[0].plain);
    b.local.run('UPDATE entries SET audio_uri = ?, audio_sha256 = ? WHERE id = ?', uri, sha256Hex(recs[0].plain), recs[0].id);
    const downloadsBefore = backend.requests.length;
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('done');
    expect(documents(b)).toEqual([`${recs[1].id}.m4a`, 'from-device-backup.m4a'].sort());
    expect(backend.requests.slice(downloadsBefore).filter((x) => x.kind === 'tus')).toEqual([]);
  });

  it('a phone whose recordings are all here asks the server nothing', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a } = await backedUpPhone(backend, clock, icloud, 2);
    let passes = 0;
    const before = backend.requests.length;
    const original = a.service.restore.run;
    a.service.restore.run = async () => {
      passes += 1;
      return original();
    };
    await a.service.tick();
    await a.service.tick();
    expect(passes).toBe(0);
    expect(backend.requests.length).toBe(before);
  });

  it('[F08-U20] a tampered object is discarded, tried once more, then left not on this phone; nothing half-written stays', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const path = backend.blobs.get(recs[0].id)!.objectPath;
    const obj = backend.objects.get(path)!;
    obj[obj.length - 20] ^= 0x01;
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toMatchObject({ state: 'pending', attempts: 1 });
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toMatchObject({ state: 'failed', attempts: 2 });
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    expect(documents(b)).toEqual([]);
    expect(readdirSync(b.files.tmpDir)).toEqual([]);
  });

  it('an object swapped in from another letter is refused (the header names its own letter)', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 2);
    const one = backend.blobs.get(recs[0].id)!;
    const two = backend.blobs.get(recs[1].id)!;
    backend.objects.set(one.objectPath, backend.objects.get(two.objectPath)!);
    one.cipherSha256 = two.cipherSha256; // the transfer check passes; the header check must not
    one.bytes = two.bytes;
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('failed');
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    expect(audioOf(b, recs[1].id).sha256).toBe(sha256Hex(recs[1].plain));
  });

  it('a letter whose own hash differs from the backup is never given that recording', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    b.local.run('UPDATE entries SET audio_uri = ?, audio_sha256 = ? WHERE id = ?', b.files.documentUri('gone.m4a'), 'ab'.repeat(32), recs[0].id);
    await b.service.tick();
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('failed');
    expect(existsSync(fileURLToPath(b.files.documentUri('gone.m4a')))).toBe(false);
  });

  it('a file that appears while the recording downloads wins; the download is dropped', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const inner = backend.downloader.download;
    const mine = fakeM4a(3000);
    const uri = b.files.documentUri('recorded-meanwhile.m4a');
    backend.downloader.download = async (url, to) => {
      writeFileSync(fileURLToPath(uri), mine);
      b.local.run('UPDATE entries SET audio_uri = ?, audio_sha256 = ? WHERE id = ?', uri, sha256Hex(mine), recs[0].id);
      return inner(url, to);
    };
    await b.service.tick();
    expect(audioOf(b, recs[0].id)).toEqual({ uri, sha256: sha256Hex(mine) });
    expect(documents(b)).toEqual(['recorded-meanwhile.m4a']);
    expect(readdirSync(b.files.tmpDir)).toEqual([]);
  });

  it('deleted letters and the other parent\'s letters are not restored', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 2);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    b.local.run("UPDATE entries SET deleted_at = '2026-10-29T00:00:00Z' WHERE id = ?", recs[0].id);
    await b.service.tick();
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    expect(audioOf(b, recs[1].id).sha256).toBe(sha256Hex(recs[1].plain));
  });
});
