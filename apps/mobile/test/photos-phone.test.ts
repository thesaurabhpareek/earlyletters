/// <reference types="node" />
// The phone's wiring for Photo with a letter (src/lib/photos/device.ts) over a real SQLite and the expo-file-system
// stand-in: the deps every picture write runs against, the one eraser every letter purge calls, the launch sweep, and
// what the store adds to a phone where nothing is picked. Fictional family Asha.
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { migrate, MIGRATIONS } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { erasePictureOf, photoDeps, sweepPhotosAtLaunch } from '../src/lib/photos/device';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { expoPhotoFiles, photosDirectory, storedPhotoFile } from '../src/lib/photos/files';
import type { StoredPhoto } from '../src/lib/photos/types';
import { createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, db: null as unknown as SqlDb, changes: 0, ids: 0 }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_algorithm: string, bytes: Uint8Array) => Uint8Array.from(hash('sha256').update(bytes).digest()).buffer,
  };
});
vi.mock('../src/lib/store', () => ({ localSqlDb: () => h.db, notifyStoreChanged: () => void h.changes++, uuidv7: () => `m${++h.ids}` }));

const ctx = { now: '2026-11-11T00:00:00.000Z', newId: () => 'id' };
const row = (entryId: string, mediaId: string): StoredPhoto => ({
  entryId, mediaId, ext: 'jpg', bytes: 3, sha256: 'ab', width: 4, height: 4, text: null, place: null, addedAt: '2026-11-11T00:00:00Z', deletedAt: null,
});
const letter = (db: SqlDb, id: string) =>
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text, in_book, updated_at)
     VALUES (?, 'letter', '2026-06-12', '2026-06-12T09:00:00Z', 'typed', 'clean', 1, 'x', '[]', 'Asha and the rain boots.', 1, '2026-06-12T09:00:00Z')`,
    id,
  );
/** A phone on the newest schema with one letter, e1, and an empty disk. */
function phone(name: string): SqlDb {
  const { db } = nodeDb();
  migrate(db, ctx);
  letter(db, 'e1');
  h.db = db;
  h.disk = createDisk(iosContainer(`B81D7E44-NEW0-4A7F-8C21-ASHA0000${name}`));
  return db;
}
const rows = (db: SqlDb) => db.all<{ id: string }>('SELECT id FROM entry_media ORDER BY id').map((r) => r.id);

describe('[ADR 0028 D1] the store adds one empty table and writes nothing until a picture is kept', () => {
  it('[D1] with nothing picked (EXPO_PUBLIC_PHOTOS unset), a phone on 10 gains only the empty table: the launch sweep and the eraser make no file, folder or row', async () => {
    const { db } = nodeDb();
    h.db = db;
    migrate(db, ctx, MIGRATIONS.slice(0, 10));
    letter(db, 'e1');
    const schema = () => db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").map((r) => r.name);
    const before = schema();
    migrate(db, ctx);
    expect(schema().filter((n) => !before.includes(n))).toEqual(['entry_media', 'entry_media_draft_idx', 'entry_media_entry_idx', 'entry_media_one_photo_idx']);
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000010'));
    const files = [...h.disk.files.keys()];
    const dirs = [...h.disk.dirs].sort();
    await sweepPhotosAtLaunch();
    erasePictureOf('e1');
    expect([...h.disk.files.keys()]).toEqual(files);
    expect([...h.disk.dirs].sort()).toEqual(dirs);
    expect(rows(db)).toEqual([]);
    expect(db.get<{ final_text: string }>("SELECT final_text FROM entries WHERE id = 'e1'")?.final_text).toBe('Asha and the rain boots.');
  });

  it('[D1] the phone deps: rows in entry_media, files in Application Support/photos, a media id and a SHA-256; no native step in Node', async () => {
    const db = phone('0011');
    const d = photoDeps();
    expect(d.orientation).toBeUndefined(); // no ImageIO here: a turned picture is refused, never stored sideways
    await d.files.write('m9.jpg', Uint8Array.of(1, 2, 3));
    expect([...h.disk.files.keys()]).toEqual([`${photosDirectory().uri}m9.jpg`]);
    const changes = h.changes;
    d.store.put(row('e1', 'm9'));
    expect(rows(db)).toEqual(['m9']);
    expect(h.changes).toBe(changes + 1); // the screens hear the change
    expect(await d.sha256(Uint8Array.of(1, 2, 3))).toBe(createHash('sha256').update(Uint8Array.of(1, 2, 3)).digest('hex'));
    expect(d.newId()).toMatch(/^m\d+$/);
  });
});

describe('[NS-01-R16] delete, restore and purge treat letter and picture as one', () => {
  it('[NS-01-R16] delete hides the picture and restore brings it back with no picture write', () => {
    const db = phone('0012');
    const store = entryMediaStore(db);
    store.put(row('e1', 'm1'));
    db.run("UPDATE entries SET deleted_at = '2026-11-12T00:00:00Z' WHERE id = 'e1'");
    expect(store.get('e1')?.deletedAt).toBe('2026-11-12T00:00:00Z');
    db.run("UPDATE entries SET deleted_at = NULL WHERE id = 'e1'");
    expect(store.get('e1')?.deletedAt).toBeNull();
    expect(rows(db)).toEqual(['m1']);
  });

  it('[NS-01-R16] the eraser removes a letter\'s picture, the file first and then its row, and a draft\'s the same way; nothing else is touched', async () => {
    const db = phone('0013');
    const store = entryMediaStore(db);
    const files = expoPhotoFiles();
    store.put(row('e1', 'm1'));
    store.put(row('d1', 'm2')); // a draft owns it (no letter with that id)
    letter(db, 'e2');
    store.put(row('e2', 'm3'));
    for (const n of ['m1.jpg', 'm2.jpg', 'm3.jpg']) await files.write(n, Uint8Array.of(1));
    erasePictureOf('e1');
    erasePictureOf('d1');
    expect(await files.list()).toEqual(['m3.jpg']);
    expect(rows(db)).toEqual(['m3']);
    erasePictureOf('e1'); // safe to repeat
    expect(rows(db)).toEqual(['m3']);
  });

  it('[NS-01-R16] the eraser goes through the stored-name guard: a row whose id climbs out of photos/ loses its row, and the file it names stays (review N3 on #841)', () => {
    const db = phone('0013');
    const elsewhere = put(h.disk, `${h.disk.documents}notes.jpg`, 1);
    entryMediaStore(db).put(row('e1', '../../../Documents/notes'));
    erasePictureOf('e1');
    expect(h.disk.files.has(elsewhere)).toBe(true);
    expect(rows(db)).toEqual([]);
    expect(storedPhotoFile('../../../Documents/notes')).toBeNull();
    expect(storedPhotoFile('m1')?.uri).toBe(`${photosDirectory().uri}m1.jpg`);
  });

});
