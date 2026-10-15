/// <reference types="node" />
/**
 * The M17 ledger query (founder, 13 Oct; F14-REQ-036) through the store facade:
 * only this person's own letters with their words count, never another
 * author's synced rows. Fictional Asha family only. expo-crypto and the native
 * opener are stubbed as in store.facade.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { applyPullPage } = await import('../src/lib/sync/merge');
const { takeOwnership } = await import('../src/lib/sync/ownership');
type PulledRow = import('../src/lib/sync/types').PulledRow;

const ME = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const NOW = '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
let ASHA = '';

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId });
  ASHA = store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  store.closeStore();
  close();
});

const db = () => store.localSqlDb();
const ctx = () => ({ now: NOW, newId });
const mirror = () => store.ledgerDb().counts().recorded;

/** Letters by the other parent arriving through sync (the real merge path). */
function pullPapaLetters(n: number, from = 0) {
  const rows: PulledRow[] = Array.from({ length: n }, (_, i) => ({
    id: `0199a5b0-0000-7000-9000-${String(from + i + 1).padStart(12, '0')}`, child_id: ASHA, author_id: PAPA, author_signs_as: 'Papa',
    kind: 'letter', occurred_on: '2026-09-29', captured_at: NOW, capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null,
    engine_version: 2, final_text: `Papa's letter ${from + i + 1}.`, in_book: true, sounds_like_me: null, approval: 'added',
    audio_kept_on_device: false, created_at: NOW, updated_at: NOW, deleted_at: null, own: false, v: String(1000 + from + i),
  }));
  db().transaction(() => void applyPullPage(db(), {
    reset: false, epoch: 1, epoch_started_at: NOW,
    books: [{ id: ASHA, access: 'a', repull: false, meta_hash: 'h', rows, cursor: String(from + n), more: true }],
  }, NOW));
}

/** Review's Keep: a draft, then saveLetterFromDraft with the words on screen. */
function keepOwn(over: Parameters<typeof letter>[0] = {}) {
  const d = store.createDraft({ childId: ASHA, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null });
  store.saveLetterFromDraft(d.id, letter({ childId: ASHA, audioUri: null, ...over }));
  return d.id;
}

describe('[F14-REQ-036] own letters only (M17)', () => {
  it('[F14-REQ-036] joining a book with 30 of the other parent\'s letters: my first own letter is free letter 1, and 10 more pulled change nothing', () => {
    takeOwnership(db(), ME, ctx());
    pullPapaLetters(30);
    expect(db().get<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE author_id = ?', PAPA)?.n).toBe(30);
    expect(store.countOwnLettersKept()).toBe(0);
    expect(store.countOwnLettersKept(PAPA)).toBe(30); // the query is per person; the ledger asks only for me
    expect(store.ledgerDb().counts()).toEqual({ recorded: 0, present: 0 });

    keepOwn();
    expect(store.countOwnLettersKept()).toBe(1);
    expect(mirror()).toBe(1);

    pullPapaLetters(10, 30);
    expect(store.countOwnLettersKept()).toBe(1);
    expect(store.ledgerDb().counts()).toEqual({ recorded: 1, present: 1 });
  });

  it('counts a letter only once its words exist: not a voice-only letter waiting for them, not a blank one', () => {
    const waiting = store.createRecordingDraft({ childId: ASHA, promptKey: null, audioUri: 'file:///Documents/r.m4a' });
    store.finalizeDraftAudio(waiting.id, { sha256: 'c'.repeat(64), bytes: 9000, state: 'ready', durationMs: 9000 });
    store.saveVoiceOnlyFromDraft(store.getDraft(waiting.id)!, { childId: ASHA, authorSignsAs: 'Mama', inBook: false, engineVersion: 3 });
    keepOwn({ finalText: '   ' });
    expect(store.countOwnLettersKept()).toBe(0);
    expect(store.setWordsForWaitingEntry(waiting.id, { rawTranscript: 'you sang', machineEdits: [], finalText: 'You sang.', editLevel: 'verbatim', engineVersion: 3 })).toBe(true);
    expect(store.countOwnLettersKept()).toBe(1);
  });

  it('notes, quiet-day marks and drafts never count; a deleted letter still does (D-083)', () => {
    const note = store.createDraft({ childId: ASHA, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null });
    store.setDraftKind(note.id, 'note');
    store.saveLetterFromDraft(note.id, letter({ childId: ASHA, audioUri: null }));
    expect(store.getEntry(note.id)?.kind).toBe('note');
    expect(mirror()).toBe(0); // a draft set to note is not counted at its Keep
    store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-00000000aaaa', childId: ASHA, kind: 'not_much', finalText: '', audioUri: null }));
    store.createDraft({ childId: ASHA, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Half written.' });
    expect(store.countOwnLettersKept()).toBe(0);
    const kept = keepOwn();
    store.deleteEntry(kept);
    expect(store.countOwnLettersKept()).toBe(1);
  });

  it('a local-only install (no account) counts letters with no author, and never a row stamped with someone\'s id', () => {
    keepOwn();
    db().run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id) VALUES ('stray', 'letter', '2026-09-29', ?, 'typed', 'verbatim', 2, 'x', '[]', 'x', 0, ?, ?, ?)`,
      NOW, NOW, ASHA, PAPA,
    );
    expect(store.currentUserId()).toBeNull();
    expect(store.countOwnLettersKept()).toBe(1);
    expect(store.countOwnLettersKept(null)).toBe(1);
    // After the first sign-in the same letter is mine by id (ownership stamps it); the stray row still never counts.
    takeOwnership(db(), ME, ctx());
    expect(store.countOwnLettersKept()).toBe(1);
  });
});
