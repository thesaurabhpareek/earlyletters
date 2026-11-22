// BL-1535: an adopt asked while the picture is being let go, and words typed while the picture is being kept.
// The fictional family is Asha; no real picture is used.
import { describe, expect, it } from 'vitest';
import type { PickedFiles } from '../src/lib/photos/types';
import { adoptPending } from '../src/lib/photos/adopt';
import { photoNotSaved, clearPhotoNotSaved } from '../src/lib/photos/failures';
import { discardPendingPhotoOnLeaving } from '../src/lib/photos/leaving';
import { PendingPhoto } from '../src/lib/photos/pending';
import { registerPending } from '../src/lib/photos/registry';
import { deps, makeJpeg } from './photos-helpers';

const A = 'file:///c/ImagePicker/a.jpg';
const WORDS = 'Asha and the rain boots.';
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function files(): PickedFiles & { left: () => string[]; hold: () => void; release: () => void } {
  const m = new Map([[A, makeJpeg({ exif: true })]]);
  let gate: Promise<void> | null = null;
  let open = () => {};
  return {
    left: () => [...m.keys()],
    hold() { gate = new Promise<void>((r) => (open = r)); },
    release: () => open(),
    async read(uri: string) { if (gate) await gate; const b = m.get(uri); if (!b) throw new Error('gone'); return b; },
    async remove(uri: string) { m.delete(uri); },
    async sweep() { m.clear(); },
  };
}

describe('[BL-1535-1] an adopt asked between the drop and the discard', () => {
  it('[BL-1535-1] it finishes before the discard: the picture is stored once, the original goes, nothing is marked not saved', async () => {
    clearPhotoNotSaved('e1');
    const f = files();
    const p = new PendingPhoto(f);
    registerPending(p);
    await p.set({ uri: A });
    p.setText('Asha at the park');
    const { d, store } = deps();
    f.hold();
    const leaving = discardPendingPhotoOnLeaving(); // the drop has happened; nothing was running
    const adopting = adoptPending(p, () => d, 'e1', WORDS, true); // asked after the drop
    await flush();
    f.release();
    await Promise.all([leaving, adopting]);
    expect(store.rows.size).toBe(1);
    expect(store.rows.get('e1')?.text).toBe('Asha at the park');
    expect(photoNotSaved('e1')).toBe(false);
    expect(p.source).toBeNull();
    expect(f.left()).toEqual([]);
    registerPending(null);
  });
});

describe('[BL-1535-2] words typed while a picture is being kept', () => {
  it('[BL-1535-2] they reach the stored copy, none are dropped by the discard that follows', async () => {
    const f = files();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    p.setText('Asha at the park');
    p.setPlace('The park');
    const { d, store } = deps();
    f.hold();
    const adopting = adoptPending(p, () => d, 'e1', WORDS, true);
    await flush(); // the original is being read
    p.setText('Asha at the park, in her rain boots');
    p.setPlace('The park gate');
    f.release();
    await adopting;
    const row = store.rows.get('e1');
    expect(row?.text).toBe('Asha at the park, in her rain boots');
    expect(row?.place).toBe('The park gate');
    expect(store.rows.size).toBe(1);
    expect(f.left()).toEqual([]);
  });
  it('[BL-1535-2] words that did not change are written once: the copy is not rewritten', async () => {
    const f = files();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    p.setText('Asha at the park');
    const { d, store } = deps();
    await adoptPending(p, () => d, 'e1', WORDS, true);
    expect(store.puts).toBe(1);
  });
});
