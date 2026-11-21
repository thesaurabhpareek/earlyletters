// BL-1444: the pending picture does not outlive its person, adopts wait their turn, the deleted letter shows no picture.
// The fictional family is Asha; no real picture is used.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StoredPhoto, PickedFiles } from '../src/lib/photos/types';
import { deps, makeJpeg } from './photos-helpers';

const h = vi.hoisted(() => ({ row: null as unknown, listeners: new Set<() => void>() }));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('../src/lib/store', () => ({
  subscribe: (l: () => void) => (h.listeners.add(l), () => void h.listeners.delete(l)),
  subscribeTo: () => () => {},
  listEntriesForChild: () => [],
}));
vi.mock('../src/lib/photos/device', () => ({ photoDeps: () => ({ store: { get: () => h.row, all: () => [] } }) }));

import { renderHook } from './helpers/mini-react';
import { adoptPending, dropQueuedAdopts } from '../src/lib/photos/adopt';
import { discardPendingPhotoOnLeaving } from '../src/lib/photos/leaving';
import { clearPhotoNotSaved, photoNotSaved } from '../src/lib/photos/failures';
import { PendingPhoto } from '../src/lib/photos/pending';
import { registerPending } from '../src/lib/photos/registry';
import { useLetterPhoto } from '../src/lib/photos/hooks';

const SRC = join(__dirname, '..', 'src');
const read = (f: string) => readFileSync(join(SRC, f), 'utf8');
const URI = 'file:///c/ImagePicker/a.jpg';
const WORDS = 'Asha and the rain boots.';

const photo = (over: Partial<StoredPhoto> = {}): StoredPhoto => ({ entryId: 'e1', mediaId: 'm1', ext: 'jpg', bytes: 1, sha256: 'x', width: 4, height: 4, text: null, place: null, addedAt: '2026-11-11T00:00:00Z', deletedAt: null, ...over });

/** Picker originals in memory; `hold()` makes the next read wait until `release()`. */
function gatedPicked(): PickedFiles & { left: () => string[]; hold: () => void; release: () => void } {
  const m = new Map([[URI, makeJpeg({ exif: true })]]);
  let gate: Promise<void> | null = null;
  let open = () => {};
  return {
    left: () => [...m.keys()],
    hold() {
      gate = new Promise<void>((r) => (open = r));
    },
    release: () => open(),
    async read(uri: string) {
      if (gate) await gate;
      const b = m.get(uri);
      if (!b) throw new Error('gone');
      return b;
    },
    async remove(uri: string) {
      m.delete(uri);
    },
    async sweep() {
      m.clear();
    },
  };
}
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

afterEach(() => {
  registerPending(null);
  dropQueuedAdopts();
  h.row = null;
});

describe('[BL-1444-D] a letter in Recently deleted shows no picture', () => {
  it('[BL-1444-D] useLetterPhoto gives the picture of an open letter and nothing for a deleted one, then again after a restore', () => {
    h.row = photo();
    const run = renderHook(() => useLetterPhoto('e1'));
    expect(run.result.current?.mediaId).toBe('m1');
    h.row = photo({ deletedAt: '2026-11-12T00:00:00Z' }); // the letter was deleted: the store event arrives
    for (const l of [...h.listeners]) l();
    expect(run.result.current).toBeNull();
    h.row = photo(); // restored
    for (const l of [...h.listeners]) l();
    expect(run.result.current?.mediaId).toBe('m1');
    run.unmount();
  });
  it('[BL-1444-D] a letter deleted before the first render shows nothing at once', () => {
    h.row = photo({ deletedAt: '2026-11-12T00:00:00Z' });
    const run = renderHook(() => useLetterPhoto('e1'));
    expect(run.result.current).toBeNull();
    run.unmount();
  });
});

describe('[BL-1444-2] a second adopt waits its turn and is not dropped', () => {
  it('[BL-1444-2] an adopt asked while another reads waits, then stores the picture the first left pending', async () => {
    const picked = gatedPicked();
    const p = new PendingPhoto(picked);
    await p.set({ uri: URI });
    const { d, store } = deps();
    picked.hold();
    const first = adoptPending(p, () => d, 'e1', '', true); // no words: stays pending
    const second = adoptPending(p, () => d, 'e1', WORDS, true);
    await flush();
    expect(store.rows.size).toBe(0); // nothing ran twice at once
    picked.release();
    await Promise.all([first, second]);
    expect(store.rows.get('e1')?.mediaId).toBeTruthy(); // the second was not dropped
    expect(picked.left()).toEqual([]);
  });
});

describe('[BL-1444-1] the pending picture goes when its person leaves', () => {
  it('[BL-1444-1] leaving removes the pending picture and the picker original; with no pending it does nothing and does not throw', async () => {
    await expect(discardPendingPhotoOnLeaving()).resolves.toBeUndefined();
    const picked = gatedPicked();
    const p = new PendingPhoto(picked);
    registerPending(p);
    await p.set({ uri: URI });
    expect(p.source).not.toBeNull();
    await discardPendingPhotoOnLeaving();
    expect(p.source).toBeNull();
    expect(picked.left()).toEqual([]);
  });
  it('[BL-1444-1] an adopt still waiting when the person leaves does not run; the one running finishes first', async () => {
    const picked = gatedPicked();
    const p = new PendingPhoto(picked);
    registerPending(p);
    await p.set({ uri: URI });
    clearPhotoNotSaved('e1');
    const { d, store } = deps();
    picked.hold();
    const running = adoptPending(p, () => d, 'e1', '', true);
    const waiting = adoptPending(p, () => d, 'e2', WORDS, true);
    await flush(); // the first is now reading; the second waits behind it
    const leaving = discardPendingPhotoOnLeaving();
    picked.release();
    await Promise.all([running, waiting, leaving]);
    expect(store.rows.size).toBe(0); // the waiting adopt never stored a picture for the next account
    expect(p.source).toBeNull();
    expect(picked.left()).toEqual([]);
    expect(photoNotSaved('e1')).toBe(false); // the running adopt read its picture before it went: no "not saved" line for a letter left behind
  });
  it('[BL-1444-1] a new adopt after leaving works (the drop ends the old waits only)', async () => {
    const picked = gatedPicked();
    const p = new PendingPhoto(picked);
    await discardPendingPhotoOnLeaving();
    await p.set({ uri: URI });
    const { d, store } = deps();
    await adoptPending(p, () => d, 'e3', WORDS, true);
    expect(store.rows.has('e3')).toBe(true);
  });
  it('[BL-1444-1] the wiring: an ended or replaced session, a forced sign-out and Erase everything each call it', () => {
    const sp = read('lib/auth/session-provider.tsx');
    expect(sp).toMatch(/const before = photoUser\.current;\s*photoUser\.current = sessionUser;\s*if \(before && before !== sessionUser\) void discardPendingPhotoOnLeaving\(\);/);
    expect(sp).toMatch(/if \(step\.signOut\) \{\n\s+void discardPendingPhotoOnLeaving\(\);/); // gap 3: before the uploads finish
    const er = read('lib/erase-everything.ts');
    const call = er.indexOf('await discardPendingPhotoOnLeaving()');
    expect(call).toBeGreaterThan(er.indexOf('export async function eraseEverything()'));
    expect(call).toBeLessThan(er.indexOf('eraseEverythingLocal(eraseAudioFile', call)); // before the files go
    expect(er.slice(er.lastIndexOf('\n', call), call)).toMatch(/if \(localDeletionAllowed\(\)\)/); // a refused erase changes nothing
  });
});

describe('[BL-1444-S] isClosedSeal changes with sealed letters', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : /\.ts$/.test(n) ? [join(dir, n)] : []));
  it('[BL-1444-S] once the letters table or the store knows a seal, the stub may not stay a constant false', () => {
    const files = [...walk(join(SRC, 'lib', 'db')), join(SRC, 'lib', 'store.ts')];
    const sealed = files.filter((f) => /\b(sealed|seal_until|sealedUntil|opens_on|opensOn)\b/i.test(readFileSync(f, 'utf8')));
    const stub = /export const isClosedSeal = \(_entryId: string\): boolean => false;/.test(read('lib/photos/seal.ts'));
    expect(stub && sealed.length > 0, `a seal now exists in ${sealed.join(', ')}: make lib/photos/seal.ts read it (NS-01-R10b)`).toBe(false);
  });
});
