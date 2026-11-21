// BL-1489 part 1: an adopt that finishes after the parent picked another picture must not take that picture with it.
// The fictional family is Asha; no real picture is used.
import { describe, expect, it } from 'vitest';
import type { PickedFiles } from '../src/lib/photos/types';
import { adoptPending } from '../src/lib/photos/adopt';
import { PendingPhoto } from '../src/lib/photos/pending';
import { deps, makeJpeg } from './photos-helpers';

const A = 'file:///c/ImagePicker/a.jpg';
const B = 'file:///c/ImagePicker/b.jpg';
const WORDS = 'Asha and the rain boots.';
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function files(): PickedFiles & { left: () => string[]; hold: () => void; release: () => void } {
  const m = new Map([[A, makeJpeg({ exif: true })], [B, makeJpeg({ exif: true })]]);
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

describe('[BL-1489-1] a late adopt does not drop a fresh pick', () => {
  it('[BL-1489-1] adopt A is running, the parent picks B, A finishes: B stays pending with its words; A is stored and its original removed', async () => {
    const f = files();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    const { d, store } = deps();
    f.hold();
    const adopting = adoptPending(p, () => d, 'e1', WORDS, true);
    await flush(); // A is being read
    await p.set({ uri: B });
    p.setText('Rain boots again');
    f.release();
    await adopting;
    expect(store.rows.get('e1')?.mediaId).toBeTruthy(); // A was stored for its letter
    expect(p.source?.uri).toBe(B); // B was not discarded
    expect(p.typedText).toBe('Rain boots again');
    expect(f.left()).toContain(B);
    expect(f.left()).not.toContain(A);
  });
  it('[BL-1489-1] an adopt still waiting when the parent picks B does not store B on the first letter', async () => {
    const f = files();
    const p = new PendingPhoto(f);
    await p.set({ uri: A });
    const { d, store } = deps();
    f.hold();
    const first = adoptPending(p, () => d, 'e1', '', true); // no words: A stays pending
    const second = adoptPending(p, () => d, 'e1', WORDS, true); // asked with A, waits
    await flush();
    await p.set({ uri: B });
    f.release();
    await Promise.all([first, second]);
    expect(store.rows.has('e1')).toBe(false);
    expect(p.source?.uri).toBe(B);
  });
});
