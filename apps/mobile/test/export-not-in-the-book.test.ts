/**
 * [BL-388] LEGAL-REQ-034: recordings on this phone in no letter or draft (the sweep's `orphan_audio`) go in the export
 * under not-in-the-book/, byte for byte, listed in data/not_in_the_book.json, with a README section (schema 1.8.0).
 * The plan and the ZIP (build.logic.ts, pack.ts); the Asha golden (export-golden.test.ts) holds one on the phone and
 * one whose file is gone. Fictional Asha only.
 */
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { ASHA_FILES, ASHA_STRAY, ashaSnapshot, sha256Hex } from './helpers/asha-export';
import { notInTheBookPath, orphanMediaType, planExport } from '../src/lib/export/build.logic';
import { packExport } from '../src/lib/export/pack';
import type { NotInTheBookFile } from '../src/lib/export/schema';

async function pack(snapshot = ashaSnapshot(), files: Record<string, Uint8Array> = ASHA_FILES) {
  const chunks: Uint8Array[] = [];
  await packExport(snapshot, {
    readFile: async (uri) => files[uri] ?? Promise.reject(new Error('missing')),
    sha256: async (d) => sha256Hex(d),
    renderPdf: async () => new TextEncoder().encode('%PDF-1.4\n%%EOF\n'),
    sink: { write: (c) => chunks.push(c.slice()) },
  });
  const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  chunks.reduce((o, c) => (all.set(c, o), o + c.length), 0);
  return unzipSync(all);
}
const listOf = (files: Record<string, Uint8Array>) => JSON.parse(strFromU8(files['data/not_in_the_book.json'])) as NotInTheBookFile;

describe('[BL-388] LEGAL-REQ-034: plan and pack', () => {
  it('none at all: no not-in-the-book/ folder, no json, no README section', async () => {
    const files = await pack({ ...ashaSnapshot(), orphans: [] });
    expect(Object.keys(files).filter((p) => p.includes('not-in-the-book') || p.includes('not_in_the_book'))).toEqual([]);
    expect(strFromU8(files['README.txt'])).not.toContain('NOT IN THE BOOK');
  });

  it('a recording whose file is gone, or vanished before packing, is listed with no file and its stored size', async () => {
    const snap = ashaSnapshot();
    expect(planExport(snap).orphanAudio.map((j) => j.fileName)).toEqual([ASHA_STRAY]); // never the one not on this phone
    const files = await pack(snap, { ...ASHA_FILES, [snap.orphans![0].uri!]: undefined as unknown as Uint8Array });
    expect(listOf(files).recordings.map((r) => [r.path, r.bytes, r.sha256])).toEqual([[null, 1_500, null], [null, 2_048, null]]);
    expect(Object.keys(files).some((p) => p.startsWith('not-in-the-book/'))).toBe(false);
    expect(strFromU8(files['README.txt'])).toContain('NOT IN THE BOOK');
  });

  it('names every computer can open, two the same numbered, and each container its own media type', () => {
    const used = new Set<string>();
    expect(['a:b.m4a', 'A_b.m4a', '.wav', 'x'].map((n) => notInTheBookPath(n, used))).toEqual([
      'not-in-the-book/a_b.m4a', 'not-in-the-book/A_b-2.m4a', 'not-in-the-book/_wav', 'not-in-the-book/x',
    ]);
    expect(['a.M4A', 'a.aac', 'a.caf', 'a.wav', 'a.3gp', 'a.webm', 'a.txt'].map(orphanMediaType)).toEqual([
      'audio/mp4', 'audio/aac', 'audio/x-caf', 'audio/wav', 'audio/3gpp', 'audio/webm', 'application/octet-stream',
    ]);
  });
});
