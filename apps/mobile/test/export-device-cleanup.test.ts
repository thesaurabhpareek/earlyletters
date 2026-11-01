/// <reference types="node" />
/**
 * RT-EXP-05 (docs/qa/COVERAGE.md item 2, DATA-REQ-056): the export's temporary ZIP never stays in the
 * app cache. export/device.ts runs end to end here, over the real store (node:sqlite) and an in-memory
 * expo-file-system (helpers/expo-fs-standin.ts). The share sheet, the PDF printer and the file handle are
 * recording fakes, the way store.shelf.test.ts fakes the audio eraser, so the test sees what was on disk
 * while the sheet was up, after it closed, and after a write failed partway. Fictional Asha family only.
 */
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  /** The share sheet's answer: 'closed' resolves (iOS resolves when the person dismisses it), 'error' rejects. */
  share: 'closed' as 'closed' | 'error',
  /** What the share sheet was given, and whether that file was on disk while the sheet was up. */
  shared: [] as { uri: string; existedWhileOpen: boolean; bytes: number }[],
  /** Fail the nth writeBytes (1-based) on any file handle; 0 never fails. */
  failWriteAt: 0,
  writes: 0,
}));

vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk);
  // A file handle whose writes can fail partway, as a full disk or an I/O error would on a phone.
  class File extends fs.File {
    override open(mode: string) {
      const handle = super.open(mode);
      const write = handle.writeBytes.bind(handle);
      handle.writeBytes = (chunk: Uint8Array) => {
        h.writes += 1;
        if (h.failWriteAt > 0 && h.writes === h.failWriteAt) throw new Error('ERR_FILE_WRITE');
        write(chunk);
      };
      return handle;
    }
  }
  return { ...fs, File };
});
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_alg: string, data: Uint8Array) => {
      const d = hash('sha256').update(data).digest();
      return d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
    },
    getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
  };
});
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('expo-print', () => ({
  printToFileAsync: async () => {
    const uri = `${h.disk.caches}Print/print-${h.disk.files.size}.pdf`;
    put(h.disk, uri, new TextEncoder().encode('%PDF-1.4 stand-in'));
    return { uri };
  },
}));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: async (uri: string) => {
    const f = h.disk.files.get(uri);
    h.shared.push({ uri, existedWhileOpen: f !== undefined, bytes: f?.data.length ?? 0 });
    if (h.share === 'error') throw new Error('share_failed');
  },
}));
vi.mock('../src/lib/auth/auth-store', () => ({ currentAuthUserId: () => null }));
vi.mock('../src/lib/billing', () => ({ hasPlus: () => false }));
vi.mock('../src/lib/supabase/client', () => ({ getSupabaseOrNull: () => null }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { runExport, shareExport, ExportCancelledError } = await import('../src/lib/export/device');

const T0 = Date.parse('2026-10-03T09:00:00.000Z');
let close: () => void = () => {};
let seq = 0;
let recording = '';

/** Every file under the app cache's exports folder (where the temporary ZIP lives). */
const exportsInCache = () => [...h.disk.files.keys()].filter((u) => u.startsWith(`${h.disk.caches}exports/`));
/** Every file on the disk with its hash, to show nothing but the temporary ZIP came or went. */
const snapshotDisk = () => new Map([...h.disk.files].map(([u, f]) => [u, createHash('sha256').update(f.data).digest('hex')]));

beforeEach(() => {
  h.disk = createDisk(iosContainer('A5A1A5A1-0000-4000-8000-00000000E005'));
  h.share = 'closed';
  h.shared = [];
  h.failWriteAt = 0;
  h.writes = 0;
  seq = 0;
  store.closeStore();
  const n = nodeDb();
  close = n.close;
  store.openStore({
    open: () => ({ db: n.db, close: () => {} }),
    now: () => new Date(T0).toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(900 + ++seq).padStart(12, '0')}`,
  });
  const asha = store.addChild({ name: 'Asha', birthday: '2025-06-01', dueDate: null, signsAs: 'Mama' }).id;
  // A recording over 1 MiB, so packing writes to the file more than once (the sink buffers in 1 MiB writes).
  recording = put(h.disk, `${h.disk.documents}ExpoAudio/recording-1E2D3C4B-0000-4000-8000-00000000E051.m4a`, 3 * (1 << 20) + 17);
  store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-00000000e051', childId: asha, audioUri: recording }));
  store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-00000000e052', childId: asha, audioUri: null, captureMode: 'typed', finalText: 'Avi read to you tonight.' }));
});
afterEach(() => {
  store.closeStore();
  close();
});

describe('[RT-EXP-05] [DATA-REQ-056] the temporary export ZIP is removed', () => {
  it('when the share sheet is closed without saving: it was there while the sheet was up, and is gone after', async () => {
    const before = snapshotDisk();
    const result = await runExport();
    expect(exportsInCache()).toEqual([result.uri]);
    h.share = 'closed';
    await shareExport(result);
    expect(h.shared).toEqual([{ uri: result.uri, existedWhileOpen: true, bytes: result.bytes }]);
    expect(exportsInCache()).toEqual([]);
    // Nothing else changed: the recording and the printer's scratch PDFs are as they were (the PDFs are removed too).
    expect(snapshotDisk()).toEqual(before);
  });

  it('when the share sheet fails: the error reaches the caller and the ZIP is still removed', async () => {
    const result = await runExport();
    h.share = 'error';
    await expect(shareExport(result)).rejects.toThrow('share_failed');
    expect(h.shared).toHaveLength(1);
    expect(exportsInCache()).toEqual([]);
  });

  it('when a write fails partway (the second 1 MiB write): the error reaches the caller and no partial ZIP is left', async () => {
    const before = snapshotDisk();
    h.failWriteAt = 2;
    await expect(runExport()).rejects.toThrow('ERR_FILE_WRITE');
    expect(h.writes).toBe(2); // one write landed before the failure: the ZIP was partly on disk
    expect(exportsInCache()).toEqual([]);
    expect(h.shared).toEqual([]);
    expect(snapshotDisk()).toEqual(before);
  });

  it('when the last write (on close) fails: no partial ZIP is left', async () => {
    // Count the writes of a good run, then fail the last one.
    await runExport();
    const total = h.writes;
    expect(total).toBeGreaterThan(2);
    h.writes = 0;
    h.failWriteAt = total;
    await expect(runExport()).rejects.toThrow('ERR_FILE_WRITE');
    expect(exportsInCache()).toEqual([]);
  });

  it('when the person stops partway: no partial ZIP is left', async () => {
    const signal = { aborted: false };
    await expect(
      runExport({
        signal,
        onProgress: (p) => {
          if (p.phase !== 'checking' && p.fraction > 0) signal.aborted = true;
        },
      }),
    ).rejects.toBeInstanceOf(ExportCancelledError);
    expect(exportsInCache()).toEqual([]);
  });
});
