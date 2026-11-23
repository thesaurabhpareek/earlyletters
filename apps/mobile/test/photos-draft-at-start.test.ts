// BL-955 (NS-01-R43): a picture chosen before recording is stored with the draft as soon as the draft row exists, so a
// kill during recording keeps it. Before the draft there is nothing to store it against and a kill keeps nothing.
// The fictional family is Asha; no real picture is used.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adoptPending } from '../src/lib/photos/adopt';
import { clearPhotoNotSaved, photoNotSaved } from '../src/lib/photos/failures';
import { PendingPhoto } from '../src/lib/photos/pending';
import { photoPath } from '../src/lib/photos/types';
import type { PickedFiles } from '../src/lib/photos/types';
import { deps, makeJpeg, memoryFiles } from './photos-helpers';

const A = 'file:///c/ImagePicker/asha.jpg';
const DRAFT = 'draft-asha-1';

function picked(): PickedFiles & { left: () => string[]; swept: () => Promise<void> } {
  const m = new Map([[A, makeJpeg({ exif: true })]]);
  return {
    left: () => [...m.keys()],
    swept: async () => void m.clear(),
    async read(uri) { const b = m.get(uri); if (!b) throw new Error('gone'); return b; },
    async remove(uri) { m.delete(uri); },
    async sweep() { m.clear(); },
  };
}

describe('[NS-01-R43] the picture goes with the draft at record start', () => {
  it('[NS-01-R43] after the draft exists and the adopt ran, a kill keeps the stored copy and its row; the original is gone', async () => {
    const f = picked();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    const { d, store, files } = deps();
    await adoptPending(p, () => d, DRAFT, '', false);
    // the app is killed here: a new launch has no pending picture, only what was stored
    expect(store.rows.get(DRAFT)).toBeTruthy();
    expect(files.disk.has(photoPath(store.rows.get(DRAFT)!))).toBe(true);
    expect(f.left()).toEqual([]);
    expect(new PendingPhoto(f).source).toBeNull();
  });

  it('[NS-01-R43] before any draft, a kill keeps nothing: no row, no file, the temporary copy is swept', async () => {
    const f = picked();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    const { store, files } = deps();
    await f.swept(); // the launch sweep
    expect(store.rows.size).toBe(0);
    expect(files.disk.size).toBe(0);
    expect(f.left()).toEqual([]);
  });

  it('[NS-01-R43] asking twice stores once, and a failed write leaves no file and marks it not saved', async () => {
    const f = picked();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    const ok = deps();
    await Promise.all([adoptPending(p, () => ok.d, DRAFT, '', false), adoptPending(p, () => ok.d, DRAFT, '', false)]);
    expect(ok.store.puts).toBe(1);
    clearPhotoNotSaved(DRAFT);
    const f2 = picked();
    const p2 = new PendingPhoto(f2);
    await p2.set({ uri: A });
    const bad = deps({ files: memoryFiles({ failWrite: true }) });
    await adoptPending(p2, () => bad.d, DRAFT, '', false);
    expect(bad.store.rows.size).toBe(0);
    expect(bad.files.disk.size).toBe(0);
    expect(f2.left()).toEqual([]);
    expect(photoNotSaved(DRAFT)).toBe(true);
    clearPhotoNotSaved(DRAFT);
  });

  it('[NS-01-R43] Listen adopts the pending picture against the take\'s draft the moment recording starts, with no words needed', () => {
    const src = readFileSync(join(__dirname, '../src/app/listen.tsx'), 'utf8');
    expect(src).toMatch(/takeId\.current = out\.draftId;[\s\S]{0,200}adoptPendingPhoto\(out\.draftId, '', false\)/);
  });
});
