/// <reference types="node" />
/**
 * Review's "Let it go", run for real (BL-379, F04-REQ-009): the three marked steps over the real store on a real SQLite
 * engine, including a kill between the audio delete and the row delete. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { deleteIfPresent, letItGo } from '../src/lib/capture/let-it-go.logic';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

let close: () => void = () => {};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-03T09:00:00.000Z', newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

function spokenDraft() {
  const childId = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  const d = store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: 'file:///rec/take-1.m4a', audioDurationMs: 600, typedText: null });
  return { childId, d };
}

describe('[BL-379][F04-REQ-009] Review "Let it go" runs the marked steps in order', () => {
  it('marks the draft first, then deletes the file, then removes the row', () => {
    const { childId, d } = spokenDraft();
    const seen: string[] = [];
    const ok = letItGo(d.id, d.audioUri, {
      beginDiscard: (id) => {
        const r = store.beginDiscard(id);
        seen.push(`begin:${store.getDraft(id)?.state}`);
        return r;
      },
      deleteFile: (uri) => {
        seen.push(`file:${uri}:${store.getDraft(d.id)?.state}`); // the row is already marked when the file goes
      },
      finishDiscard: (id) => {
        seen.push('finish');
        return store.finishDiscard(id);
      },
    });
    expect(ok).toBe(true);
    expect(seen).toEqual(['begin:discarding', 'file:file:///rec/take-1.m4a:discarding', 'finish']);
    expect(store.getDraft(d.id)).toBeNull();
    expect(store.listDrafts(childId)).toEqual([]);
  });

  it('a file that is already gone is the same as removed: the row still goes', () => {
    const { d } = spokenDraft();
    const del = vi.fn();
    const ok = letItGo(d.id, d.audioUri, {
      beginDiscard: store.beginDiscard,
      deleteFile: () => deleteIfPresent({ exists: false, delete: del }),
      finishDiscard: store.finishDiscard,
    });
    expect(ok).toBe(true);
    expect(del).not.toHaveBeenCalled();
    expect(store.getDraft(d.id)).toBeNull();
  });

  it('a real delete failure keeps the row marked discarding, never calls finishDiscard, and reports not gone', () => {
    const { childId, d } = spokenDraft();
    const finishDiscard = vi.fn(store.finishDiscard);
    const ok = letItGo(d.id, d.audioUri, {
      beginDiscard: store.beginDiscard,
      deleteFile: () => deleteIfPresent({ exists: true, delete: () => { throw new Error('permission denied'); } }),
      finishDiscard,
    });
    expect(ok).toBe(false);
    expect(finishDiscard).not.toHaveBeenCalled();
    expect(store.getDraft(d.id)?.state).toBe('discarding'); // audio is not orphaned behind a vanished row
    expect(store.listDrafts(childId)).toEqual([]); // still hidden from every list
    expect(store.finishDiscard(d.id)).toBe(true); // a later pass can still finish it
  });

  it('a typed draft (no audio file) is let go without any file call', () => {
    const childId = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    const d = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha laughed.' });
    const deleteFile = vi.fn();
    expect(letItGo(d.id, null, { beginDiscard: store.beginDiscard, deleteFile, finishDiscard: store.finishDiscard })).toBe(true);
    expect(deleteFile).not.toHaveBeenCalled();
    expect(store.getDraft(d.id)).toBeNull();
  });

  it('a draft that is not there is left alone and no file is deleted', () => {
    spokenDraft();
    const deleteFile = vi.fn();
    expect(letItGo('0199a5b0-0000-7000-8000-ffffffffffff', 'file:///rec/other.m4a', { beginDiscard: store.beginDiscard, deleteFile, finishDiscard: store.finishDiscard })).toBe(false);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('a kill between the audio delete and the row delete leaves a marked draft, hidden everywhere, that finishing removes', () => {
    const { childId, d } = spokenDraft();
    const other = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Keep me.' });
    let fileGone = false;
    expect(() =>
      letItGo(d.id, d.audioUri, {
        beginDiscard: store.beginDiscard,
        deleteFile: () => {
          fileGone = true;
        },
        finishDiscard: () => {
          throw new Error('process killed'); // the app dies before the row delete
        },
      }),
    ).toThrow('process killed');
    expect(fileGone).toBe(true);
    // What the next launch finds: the row is marked, not a letter that lost its audio.
    expect(store.getDraft(d.id)?.state).toBe('discarding');
    expect(store.listDrafts(childId).map((x) => x.id)).toEqual([other.id]);
    expect(store.listHeldDrafts(childId)).toEqual([]);
    // Finishing (the launch sweep's step) removes it; the other draft is untouched; a second finish does nothing.
    expect(store.finishDiscard(d.id)).toBe(true);
    expect(store.getDraft(d.id)).toBeNull();
    expect(store.getDraft(other.id)).not.toBeNull();
    expect(store.finishDiscard(d.id)).toBe(false);
  });

  it('a kill before the file is deleted keeps the file and leaves the draft marked, never a live draft', () => {
    const { d } = spokenDraft();
    const deleteFile = vi.fn();
    letItGo(d.id, d.audioUri, { beginDiscard: store.beginDiscard, deleteFile, finishDiscard: store.finishDiscard });
    expect(deleteFile).toHaveBeenCalledTimes(1);
    // Marking alone (kill right after step 1) already takes it off every list.
    const e = spokenDraft().d;
    expect(store.beginDiscard(e.id)).toBe(true);
    expect(store.getDraft(e.id)?.state).toBe('discarding');
  });
});
