/// <reference types="node" />
/**
 * NS-16 section 6 (BL-980, review B finding 1 on #2093): the From name typed for a draft (`signAs.draft`) is that one
 * draft's, so it goes whenever the draft ends: Keep, Let it go (even one whose file will not delete yet), Delete, a
 * deleted book's erase, and the pull removing a held draft that another phone kept. A name typed for another draft
 * stays. Real SQLite (node:sqlite) under the store facade. Fictional Asha family only.
 *
 * Mutants this file was written to catch: the draft's removal leaves `signAs.draft` in settings (drafts.ts
 * forgetDraftFromName made a no-op), and merge.ts adoptHeldDraft drops the draft row without its call (review A
 * finding 3 and review B finding 2 on #2179); and finishDiscard dropping a draft the pull marked `discarding` without
 * its call (review B note 1 at 9b62a26d5 on #2179). On develop before this change every "goes" test here is red.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { letItGo } from '../src/lib/capture/let-it-go.logic';
import { finishDiscard } from '../src/lib/db/repos/drafts';
import { serializeDraftName, SIGN_AS_DRAFT_SETTING } from '../src/lib/capture/sign-as-other.logic';
import { removeBook } from '../src/lib/db/repos/wipe';
import type { SqlDb } from '../src/lib/db/sql';
import { applyPullPage } from '../src/lib/sync/merge';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import type { PullResponse } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { fixture, insertBook } from './helpers/store-fixture';

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

  it('[NS-16 s6] the pull adopting a held draft that another phone kept forgets the name typed for it here', () => {
    const NOW = '2026-10-03T09:00:00.000Z';
    const ME = '11111111-1111-1111-1111-111111111111';
    const f = fixture();
    try {
      insertBook(f.db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
      writeSetting(f.db, SYNC_SETTING.owner, ME);
      writeSetting(f.db, SYNC_SETTING.heldServer, '1');
      f.db.run(
        "INSERT INTO drafts (id, child_id, capture_mode, created_at, audio_uri, audio_duration_ms, state, held_kind, held_v) VALUES ('h1', 'c1', 'spoken', ?, 'file:///asha/x.m4a', 3000, 'ready', 'held_letter', '870')",
        NOW,
      );
      // The letter kept on the other phone, already here (it arrives in its book).
      f.db.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
           in_book, updated_at, child_id, author_id, transcript_status)
         VALUES ('h1', 'letter', '2026-10-02', ?, 'spoken', 'verbatim', 5, 'you sang', '[]', 'you sang', 1, ?, 'c1', ?, 'ready')`,
        NOW, NOW, ME,
      );
      f.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', SIGN_AS_DRAFT_SETTING, serializeDraftName('h1', 'Nani'));
      applyPullPage(
        f.db,
        { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false, held: { rows: [{ id: 'h1', gone: 'kept', updated_at: NOW, v: '881' }], cursor: '900:00000000-0000-0000-0000-000000000000', more: false } } as unknown as PullResponse,
        NOW,
      );
      expect(f.db.get('SELECT id FROM drafts WHERE id = ?', 'h1')).toBeNull(); // adopted: the draft row went
      expect(f.db.get('SELECT value FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING)).toBeNull(); // mutant: adopt leaves the name
    } finally {
      f.close();
    }
  });

  it('[NS-16 s6] a held draft let go on another phone: the pull marks it, and the sweep finishing it forgets the name', () => {
    const NOW = '2026-10-03T09:00:00.000Z';
    const f = fixture();
    try {
      insertBook(f.db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
      writeSetting(f.db, SYNC_SETTING.owner, '11111111-1111-1111-1111-111111111111');
      writeSetting(f.db, SYNC_SETTING.heldServer, '1');
      f.db.run(
        "INSERT INTO drafts (id, child_id, capture_mode, created_at, audio_uri, audio_duration_ms, state, held_kind, held_v) VALUES ('h2', 'c1', 'spoken', ?, 'file:///asha/y.m4a', 3000, 'ready', 'held_letter', '870')",
        NOW,
      );
      f.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', SIGN_AS_DRAFT_SETTING, serializeDraftName('h2', 'Nani'));
      applyPullPage(
        f.db,
        { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false, held: { rows: [{ id: 'h2', gone: 'discarded', updated_at: NOW, v: '881' }], cursor: '900:00000000-0000-0000-0000-000000000000', more: false } } as unknown as PullResponse,
        NOW,
      );
      // The pull only marks it (beginDiscard never ran here), so the name is still on the phone until the row goes.
      expect(f.db.get<{ state: string }>('SELECT state FROM drafts WHERE id = ?', 'h2')?.state).toBe('discarding');
      expect(f.db.get('SELECT value FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING)).not.toBeNull();
      expect(finishDiscard({ db: f.db, now: () => NOW, newId }, 'h2')).toBe(true);
      expect(f.db.get('SELECT id FROM drafts WHERE id = ?', 'h2')).toBeNull();
      expect(f.db.get('SELECT value FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING)).toBeNull(); // mutant: finishDiscard leaves the name
    } finally {
      f.close();
    }
  });

  it('[NS-16 s6] a slot that cannot be read is left alone (it names no draft) and never blocks the draft going', () => {
    const d = spokenDraft();
    store.setSetting(SIGN_AS_DRAFT_SETTING, 'not json');
    store.deleteDraft(d.id);
    expect(store.getDraft(d.id)).toBeNull();
    expect(slot()).toBe('not json');
  });
});
