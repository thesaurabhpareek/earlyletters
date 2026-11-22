/// <reference types="node" />
/**
 * Restore on a new phone (lib/backup/restore.ts; WP-F08-B5b; F08 6.5 B;
 * F08-REQ-023; F08-U02, U18 to U20). The conflict rules first, as a table;
 * then real restores between two phones with the app's own local database.
 * The rule that matters most: a file already on the phone is never
 * overwritten. Fictional family Asha only.
 */
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { HEADER_LEN } from '../src/lib/backup/format';
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

  it('[#252 follow-up] the Keychain not reading as the phone locks is no failed try: nothing counted, and the recording comes back later', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const unwrap = b.vault.unwrapFileKey;
    b.vault.unwrapFileKey = async () => {
      throw Object.assign(new Error('keychain_unavailable'), { code: 'keychain_unavailable' });
    };
    for (let i = 0; i < 3; i++) await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toBeNull(); // not failed, and no try counted
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    expect(readdirSync(b.files.tmpDir)).toEqual([]);
    b.vault.unwrapFileKey = unwrap; // unlocked
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('done');
    expect(audioOf(b, recs[0].id).sha256).toBe(sha256Hex(recs[0].plain));
  });

  it('[#252 follow-up] a file key that does not open under the book key is still a failed try: tried once more, then not on this phone', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const obj = backend.objects.get(backend.blobs.get(recs[0].id)!.objectPath)!;
    obj[HEADER_LEN - 1] ^= 1; // the wrapped file key's tag, at the end of the header
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toMatchObject({ state: 'pending', attempts: 1 });
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toMatchObject({ state: 'failed', attempts: 2 });
    expect(audioOf(b, recs[0].id).uri).toBeNull();
  });

  it('[review N1 on #255] an object that is gone is refused when its URL is signed (404): tried once more, then failed for good, nothing stored', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    backend.objects.delete(backend.blobs.get(recs[0].id)!.objectPath);
    let downloads = 0;
    const download = backend.downloader.download;
    backend.downloader.download = async (url: string, toUri: string) => {
      downloads += 1;
      return download(url, toUri);
    };
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toMatchObject({ state: 'pending', attempts: 1 });
    for (let i = 0; i < 3; i++) await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)).toMatchObject({ state: 'failed', attempts: 2 });
    expect(downloads).toBe(0); // refused when signed, before any download
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    expect(documents(b)).toEqual([]);
    expect(readdirSync(b.files.tmpDir)).toEqual([]);
    expect(b.service.view().restore).toBeNull(); // Settings no longer says recordings are coming back
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

  it('overlapping passes and an opened letter never share a download: every recording comes back whole', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 4);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    // Slow downloads, so the passes really overlap.
    const inner = backend.downloader.download;
    backend.downloader.download = async (url, to) => {
      await new Promise((r) => setTimeout(r, 5));
      return inner(url, to);
    };
    await Promise.all([b.service.tick(), b.service.tick(), b.service.restore.restoreEntry(recs[2].id), b.service.restore.restoreEntry(recs[2].id), b.service.tick()]);
    for (const r of recs) {
      const audio = audioOf(b, r.id);
      expect(audio.sha256, r.id).toBe(sha256Hex(r.plain));
      expect(sha256Hex(readFileSync(fileURLToPath(audio.uri!)))).toBe(sha256Hex(r.plain));
      expect(b.backupDb.restoreItem(r.id)?.state).toBe('done');
    }
    expect(readdirSync(b.files.tmpDir)).toEqual([]);
  });

  it('[F08-REQ-025] restore waits while a recording or playback runs, and stops between segments if one starts', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    b.cond.busy = true;
    await b.service.tick();
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    b.cond.busy = false;
    // A recording starts after the download, during decryption.
    const inner = backend.downloader.download;
    backend.downloader.download = async (url, to) => {
      await inner(url, to);
      b.cond.busy = true;
    };
    await b.service.tick();
    expect(audioOf(b, recs[0].id).uri).toBeNull();
    expect(readdirSync(b.files.tmpDir)).toEqual([]); // no half-written plaintext stays
    expect(b.backupDb.restoreItem(recs[0].id)).toBeNull(); // a pause is not a failure
    backend.downloader.download = inner;
    b.cond.busy = false;
    await b.service.tick();
    expect(audioOf(b, recs[0].id).sha256).toBe(sha256Hex(recs[0].plain));
  });

  it('a move that loses to a file already at that path takes back the hash it filled in', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const other = fakeM4a(4000);
    const final = b.files.documentUri(`${recs[0].id}.m4a`);
    const move = b.files.moveNoReplace;
    b.files.moveNoReplace = (from, to) => {
      writeFileSync(fileURLToPath(to), other); // a file lands at the path just before the move
      return move(from, to);
    };
    await b.service.tick();
    expect(sha256Hex(readFileSync(fileURLToPath(final)))).toBe(sha256Hex(other));
    expect(audioOf(b, recs[0].id)).toEqual({ uri: final, sha256: null });
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('kept_local');
  });

  it('a stopped service (another account signed in) starts nothing more and leaves no temp files', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 3);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    const inner = backend.downloader.download;
    let calls = 0;
    backend.downloader.download = async (url, to) => {
      calls += 1;
      if (calls === 1) void b.service.stop(); // the switch arrives mid-pass
      return inner(url, to);
    };
    await b.service.tick();
    await b.service.stop();
    expect(calls).toBe(1);
    await b.service.tick();
    expect(calls).toBe(1);
    expect(recs.filter((r) => audioOf(b, r.id).uri !== null).length).toBeLessThanOrEqual(1);
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

describe('review fixes on #150: the upload switch and the transfer check', () => {
  it('[review B M1] the backupUploads switch stops uploads only: a new phone still restores, and sends nothing', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    b.cond.killed = true;
    expect(await b.service.turnOn()).toBe('on');
    const fresh = recordLetter(b, ASHA, 60_000);
    const tus = backend.requests.filter((x) => x.kind === 'tus').length;
    await b.service.tick();
    expect(audioOf(b, recs[0].id).sha256).toBe(sha256Hex(recs[0].plain));
    expect(backend.requests.filter((x) => x.kind === 'tus').length).toBe(tus);
    expect(backend.blobs.get(fresh.id)).toBeUndefined();
  });

  it('[review A note 1] a row whose hash names another encryption of the letter still restores, because the object authenticates', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    backend.confirmChecksHash = false; // as #151: backup_confirm stores the phone's hash without reading the object
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    // Two writers of one letter (an author's two phones): the row kept one phone's hash, the bucket holds the other's object.
    backend.blobs.get(recs[0].id)!.cipherSha256 = 'ab'.repeat(32);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    const audio = audioOf(b, recs[0].id);
    expect(audio.sha256).toBe(sha256Hex(recs[0].plain));
    expect(sha256Hex(readFileSync(fileURLToPath(audio.uri!)))).toBe(sha256Hex(recs[0].plain));
  });
});

describe('[review B n2 on #150] a recording that is not in the backup is listed for once a run, not on every pass', () => {
  /** Counts the blob listings phones made after this call. */
  function countLists(backend: FakeBackend): { n: number } {
    const c = { n: 0 };
    const serverFor = backend.serverFor.bind(backend);
    backend.serverFor = (uid) => {
      const s = serverFor(uid);
      return {
        ...s,
        listBlobs: async () => {
          c.n += 1;
          return s.listBlobs();
        },
      };
    };
    return c;
  }

  it('never uploaded: one listing leaves it out, later passes ask nothing, and the next launch asks once more', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const lost = recordLetter(a, ASHA, 70_000); // phone A is lost before this one backs up
    const lists = countLists(backend);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    expect(audioOf(b, recs[0].id).sha256).toBe(sha256Hex(recs[0].plain));
    expect(audioOf(b, lost.id).uri).toBeNull();
    expect(lists.n).toBe(1);
    for (let i = 0; i < 5; i++) await b.service.tick(); // saves, foregrounds, network changes
    expect(lists.n).toBe(1);
    expect(b.service.view().restore).toBeNull();
    // The next launch: one more listing, which still does not name it.
    const relaunch = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b', share: b, backupDb: b.backupDb });
    await relaunch.service.start();
    await relaunch.service.tick();
    expect(lists.n).toBe(2);
  });

  it('a later listing that names it brings it back in the same run', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const late = recordLetter(a, ASHA, 70_000); // not backed up yet when phone B first lists
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    expect(audioOf(b, late.id).uri).toBeNull();
    await a.service.tick(); // phone A backs it up
    expect(backend.blobs.get(late.id)?.state).toBe('confirmed');
    const another = recordLetter(a, ASHA, 70_000);
    syncText(a, b, [another.id]); // a new letter's words reach phone B: a missing letter not listed yet
    await b.service.tick();
    expect(audioOf(b, late.id).sha256).toBe(sha256Hex(late.plain));
    expect(audioOf(b, recs[0].id).sha256).toBe(sha256Hex(recs[0].plain));
  });

  it('[review A N5 on #252] a letter whose restore is done but whose file went missing makes no more listings', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const lists = countLists(backend);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('done');
    expect(lists.n).toBe(1);
    // Its path goes stale (an older container, until the launch sweep rebases it): missing again, settled already.
    unlinkSync(fileURLToPath(audioOf(b, recs[0].id).uri!));
    for (let i = 0; i < 5; i++) await b.service.tick();
    expect(lists.n).toBe(1);
  });

  it('a download that failed for good (F08-U20) makes no more listings either', async () => {
    const clock = { t: 0 };
    const backend = new FakeBackend(() => clock.t);
    const icloud = new FakeICloud();
    const { a, recs } = await backedUpPhone(backend, clock, icloud, 1);
    const row = backend.blobs.get(recs[0].id)!;
    const obj = backend.objects.get(row.objectPath)!;
    obj[obj.length - 1] ^= 1; // the stored object no longer authenticates
    const lists = countLists(backend);
    const b = makePhone({ backend, uid: MAMA, icloud, clock, name: 'phone-b' });
    syncText(a, b);
    for (let i = 0; i < 6; i++) await b.service.tick();
    expect(b.backupDb.restoreItem(recs[0].id)?.state).toBe('failed');
    expect(lists.n).toBe(2); // the try and the one retry
  });
});
