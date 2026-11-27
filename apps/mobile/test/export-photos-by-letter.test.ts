/// <reference types="node" />
/**
 * FU-13d (BL-933; NS-01-R14, ADR 0028 D2): which letters carry a picture into the export, as export/device.ts reads them
 * (`photosByLetter`, private, run here through `exportSnapshot`). Real store over node:sqlite, real `entry_media` rows
 * (photos/entry-media.ts) and an in-memory expo-file-system (helpers/expo-fs-standin.ts), so the stored copy's place is
 * the one storedPhotoFile gives on a phone. What it shows:
 * - a live letter with a kept picture carries it, on the phone, with the row's own size, hash, words and place;
 * - a kept picture whose stored copy is not on disk says onPhone false (pack.ts then writes `photo: null`);
 * - a letter in Recently deleted carries no picture: its `entry_media` row reads `deletedAt` (derived from the letter)
 *   and is skipped. That letter is only in the export while a deletion request is open (DATA-REQ-053), so that is
 *   where the skip is proven;
 * - a waiting letter (a draft) carries no picture field at all;
 * - when the photos folder cannot be placed on this phone, no letter carries a picture and the snapshot still builds.
 * Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';
import { sha256Hex as sha256 } from './helpers/asha-export';
import { makeJpeg } from './photos-helpers';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, authUser: null as string | null }));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: async () => new ArrayBuffer(32), getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
// The recording folders (capture/recordings.ts) for the recordings in no letter (BL-388).
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-print', () => ({ printToFileAsync: async () => ({ uri: '' }) }));
vi.mock('expo-sharing', () => ({ isAvailableAsync: async () => false, shareAsync: async () => {} }));
// The deletion request belongs to the account signed in (export/scope.logic.ts); the store's lists read as signed out
// (bookVisibleNow), so every book and letter is listed as on a phone with one account.
vi.mock('../src/lib/auth/auth-store', () => ({ currentAuthUserId: () => h.authUser, getAuthSnapshot: () => ({ status: 'signedOut' }) }));
vi.mock('../src/lib/billing', () => ({ hasPlus: () => false }));
vi.mock('../src/lib/supabase/client', () => ({ getSupabaseOrNull: () => null }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { exportSnapshot } = await import('../src/lib/export/device');
const { entryMediaStore } = await import('../src/lib/photos/entry-media');
const { storedPhotoFile } = await import('../src/lib/photos/files');
const { OPEN_REQUEST_KEY } = await import('../src/lib/account-deletion/open-request');

const T0 = Date.parse('2026-11-20T09:00:00.000Z');
const NOW = new Date('2026-11-27T09:00:00.000Z');
const id = (n: number) => `0199a5b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const LIVE = id(0xf1);
const MISSING = id(0xf2);
const DELETED = id(0xf3);
const KEPT = makeJpeg({ icc: true, seed: 3 });
const DELETED_COPY = makeJpeg({ icc: true, seed: 7 });
const DRAFT_COPY = makeJpeg({ icc: true, seed: 11 });

let close: () => void = () => {};
let seq = 0;
let draftId = '';

const media = () => entryMediaStore(store.localSqlDb());
function keep(ownerId: string, mediaId: string, bytes: Uint8Array, onDisk: boolean, text: string | null = null, place: string | null = null) {
  media().put({ entryId: ownerId, mediaId, ext: 'jpg', bytes: bytes.length, sha256: sha256(bytes), width: 4, height: 4, text, place, addedAt: new Date(T0).toISOString(), deletedAt: null });
  if (onDisk) put(h.disk, storedPhotoFile(mediaId)!.uri, bytes);
}

function openRequest() {
  h.authUser = 'auth-asha-1';
  store.setSetting(OPEN_REQUEST_KEY, JSON.stringify({ state: 'scheduled', requestId: 'req-asha-1', scheduledFor: '2026-12-20T09:00:00.000Z', userId: 'auth-asha-1' }));
}

beforeEach(() => {
  h.disk = createDisk(iosContainer('A5A1A5A1-0000-4000-8000-00000000F13D'));
  h.authUser = null;
  seq = 0;
  store.closeStore();
  const n = nodeDb();
  close = n.close;
  store.openStore({
    open: () => ({ db: n.db, close: () => {} }),
    now: () => new Date(T0).toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(900 + ++seq).padStart(12, '0')}`,
  });
  const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
  const typed = (lid: string, finalText: string) => letter({ id: lid, childId: asha, captureMode: 'typed', audioUri: null, audioSha256: null, audioBytes: null, audioDurationMs: null, finalText, rawTranscript: finalText });
  store.saveEntry(typed(LIVE, 'Your first bath, in the kitchen sink.'));
  store.saveEntry(typed(MISSING, 'You found your toes.'));
  store.saveEntry(typed(DELETED, 'You slept through the storm.'));
  keep(LIVE, 'm-asha-live', KEPT, true, 'Bath time.', 'Home');
  keep(MISSING, 'm-asha-missing', KEPT, false);
  keep(DELETED, 'm-asha-deleted', DELETED_COPY, true);
  expect(store.deleteEntry(DELETED)).toBe(true); // to Recently deleted: its picture row now reads deletedAt
  draftId = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: 0, typedText: 'Asha, you clapped today.' }).id;
  keep(draftId, 'm-asha-draft', DRAFT_COPY, true);
});
afterEach(() => {
  store.closeStore();
  close();
});

const entryOf = (s: ReturnType<typeof exportSnapshot>, lid: string) => s.entries.find((e) => e.id === lid);

describe('[BL-933] FU-13d: photosByLetter, which letters carry a picture into the export', () => {
  it('[NS-01-R14] FU-13d: a live letter with a kept picture carries it, on this phone, as the row and the stored copy say', () => {
    const s = exportSnapshot(NOW);
    expect(entryOf(s, LIVE)!.photo).toEqual({
      mediaId: 'm-asha-live',
      uri: storedPhotoFile('m-asha-live')!.uri,
      onPhone: true,
      bytes: KEPT.length,
      sha256: sha256(KEPT),
      width: 4,
      height: 4,
      text: 'Bath time.',
      place: 'Home',
    });
  });

  it('[NS-01-R14] FU-13d: a kept picture whose stored copy is not on this phone says onPhone false', () => {
    const s = exportSnapshot(NOW);
    expect(entryOf(s, MISSING)!.photo).toMatchObject({ mediaId: 'm-asha-missing', onPhone: false, sha256: sha256(KEPT) });
  });

  it('[NS-01-R14] FU-13d: a waiting letter carries no picture field, though its draft has a picture row and a stored copy', () => {
    const s = exportSnapshot(NOW);
    expect(media().get(draftId)).toMatchObject({ mediaId: 'm-asha-draft', deletedAt: null });
    const waiting = s.waiting!.find((w) => w.id === draftId)!;
    expect(waiting).toBeDefined();
    expect('photo' in waiting).toBe(false);
    // Nor does the draft's picture land on any letter.
    expect(s.entries.filter((e) => e.photo).map((e) => e.photo!.mediaId).sort()).toEqual(['m-asha-live', 'm-asha-missing']);
  });

  it('[NS-01-R14] FU-13d: with no deletion request open, a Recently deleted letter is not in the export at all', () => {
    expect(entryOf(exportSnapshot(NOW), DELETED)).toBeUndefined();
  });

  it('[NS-01-R14] FU-13d: while a deletion request is open, a Recently deleted letter is in the export and carries no picture (its row with deletedAt is skipped)', () => {
    openRequest();
    const s = exportSnapshot(NOW);
    // The letter is in scope (DATA-REQ-053), and its picture row and stored copy are still on the phone...
    expect(entryOf(s, DELETED)).toMatchObject({ finalText: 'You slept through the storm.' });
    const row = media().all().find((p) => p.entryId === DELETED)!;
    expect(row.deletedAt).not.toBeNull();
    expect(h.disk.files.has(storedPhotoFile('m-asha-deleted')!.uri)).toBe(true);
    // ...yet it carries none.
    expect(entryOf(s, DELETED)!.photo).toBeNull();
    // The live letter beside it still does.
    expect(entryOf(s, LIVE)!.photo).toMatchObject({ mediaId: 'm-asha-live', onPhone: true });
  });

  it('[NS-01-R14] FU-13d: when the photos folder cannot be placed on this phone, no letter carries a picture and the snapshot still builds', () => {
    // The stored copies stay where they were put; a Documents folder laid out some other way gives no photos folder
    // (photos/files.ts photosDirectory fails closed), so nothing is read from anywhere else.
    h.disk.documents = 'file:///var/mobile/Unknown/Docs/';
    expect(() => storedPhotoFile('m-asha-live')).toThrow('photos_folder_unknown');
    const s = exportSnapshot(NOW);
    expect(s.entries.map((e) => e.id).sort()).toEqual([LIVE, MISSING].sort());
    expect(s.entries.every((e) => e.photo === null)).toBe(true);
  });
});
