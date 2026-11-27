/// <reference types="node" />
/**
 * NS-16 section 6 (BL-980, review B finding 1 on #2093): the From name typed for a draft (`signAs.draft`) is that one
 * draft's, so it goes whenever the draft ends: Keep, Let it go (even one whose file will not delete yet), Delete, a
 * deleted book's erase, and the pull removing a held draft that another phone kept. A name typed for another draft
 * stays. Real SQLite (node:sqlite) under the store facade. Fictional Asha family only.
 *
 * Mutant this file was written to catch: the draft's removal leaves `signAs.draft` in settings (drafts.ts
 * forgetDraftFromName made a no-op). On develop before this change every "goes" test here is red.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { letItGo } from '../src/lib/capture/let-it-go.logic';
import { serializeDraftName, SIGN_AS_DRAFT_SETTING } from '../src/lib/capture/sign-as-other.logic';
import { removeBook } from '../src/lib/db/repos/wipe';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

let db: SqlDb;
let close: () => void = () => {};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  db = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-10-03T09:00:00.000Z', newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

const typedFor = (draftId: string, name = 'Nani') => store.setSetting(SIGN_AS_DRAFT_SETTING, serializeDraftName(draftId, name));
const slot = () => db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING)?.value ?? null;

function spokenDraft(childId = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id) {
  return store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: 'file:///rec/take-1.m4a', audioDurationMs: 600, typedText: null });
}

const steps = (deleteFile: () => void) => ({
  beginDiscard: store.beginDiscard,
  deleteFile,
  finishDiscard: store.finishDiscard,
  onFailure: store.noteDiscardFailure,
});

describe('[NS-16 s6][PRIV] the typed From name goes with its draft', () => {
  it('[NS-16 s6] Let it go removes the draft and its typed From name', () => {
    const d = spokenDraft();
    typedFor(d.id);
    expect(letItGo(d.id, d.audioUri, steps(() => {}))).toBe(true);
    expect(store.getDraft(d.id)).toBeNull();
    expect(slot()).toBeNull();
  });

  it('[NS-16 s6] a Let it go whose file will not delete yet still forgets the name: the draft is off every list', () => {
    const d = spokenDraft();
    typedFor(d.id);
    expect(letItGo(d.id, d.audioUri, steps(() => { throw new Error('permission'); }))).toBe(false);
    expect(store.getDraft(d.id)?.state).toBe('discarding');
    expect(slot()).toBeNull();
  });

  it('[NS-16 s6] Delete (a written draft let go, the sweep removing an empty take) forgets the name', () => {
    const d = spokenDraft();
    typedFor(d.id);
    store.deleteDraft(d.id);
    expect(slot()).toBeNull();
  });

  it('[NS-16 s6] Keep forgets the name even when the From card was not drawn (flag off or paused at Keep)', () => {
    const d = spokenDraft();
    typedFor(d.id);
    // Review's own kept() step only runs when the card is offered; the row's removal at Keep must not depend on it.
    store.saveVoiceOnlyFromDraft(d, { childId: d.childId!, authorSignsAs: 'Mama', inBook: true, engineVersion: 1 });
    expect(store.getDraft(d.id)).toBeNull();
    expect(slot()).toBeNull();
  });

  it('[NS-16 s6] erasing a deleted book forgets a name typed for one of its drafts', () => {
    const d = spokenDraft();
    typedFor(d.id);
    db.transaction(() => removeBook({ db, now: () => '2026-10-03T09:00:00.000Z', newId }, d.childId!));
    expect(slot()).toBeNull();
  });

  it('[NS-16 s6] a name typed for another draft stays when this one goes', () => {
    const childId = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    const gone = spokenDraft(childId);
    const other = spokenDraft(childId);
    typedFor(other.id, 'Dada');
    store.deleteDraft(gone.id);
    expect(letItGo(gone.id, gone.audioUri, steps(() => {}))).toBe(false); // already gone: nothing to let go
    expect(slot()).toBe(serializeDraftName(other.id, 'Dada'));
    db.transaction(() => removeBook({ db, now: () => '2026-10-03T09:00:00.000Z', newId }, 'no-such-book'));
    expect(slot()).toBe(serializeDraftName(other.id, 'Dada'));
  });

  it('[NS-16 s6] a slot that cannot be read is left alone (it names no draft) and never blocks the draft going', () => {
    const d = spokenDraft();
    store.setSetting(SIGN_AS_DRAFT_SETTING, 'not json');
    store.deleteDraft(d.id);
    expect(store.getDraft(d.id)).toBeNull();
    expect(slot()).toBe('not json');
  });
});
