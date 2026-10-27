/// <reference types="node" />
/**
 * Local schema v6 through the store facade (WP-F04-03; PRD V2 F04 section 11.3):
 * Review's choices on the draft (kind, occurred date and precision, language,
 * direction) reach the saved letter; Let it go in two marked steps; one quiet-day
 * mark per day. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

let close: () => void = () => {};
let seq = 0;
const now = () => '2026-10-03T09:00:00.000Z';
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let raw: ReturnType<typeof nodeDb>['db'];

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  raw = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

function asha(): string {
  return store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
}
function typedDraft(childId: string, text = 'Asha, you laughed at the rain today.') {
  return store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
}
function save(draftId: string, childId: string, over: Partial<Parameters<typeof store.saveLetterFromDraft>[1]> = {}) {
  store.saveLetterFromDraft(draftId, {
    id: draftId, kind: 'letter', occurredOn: '2026-10-03', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: 'Asha, you laughed at the rain today.', machineEdits: [],
    finalText: 'Asha, you laughed at the rain today.', inBook: true, soundsLikeMe: null, childId, authorSignsAs: 'Mama', audioUri: null,
    ...over,
  });
}

describe('[WP-F04-03] Review\'s choices live on the draft and reach the letter', () => {
  it('a new draft is a letter, dated by its day, left to right, in the author\'s default language', () => {
    const d = typedDraft(asha());
    expect(d).toMatchObject({ kind: 'letter', occurredOn: null, occurredPrecision: 'day', language: null, baseDirection: 'ltr' });
  });

  it('[F04-REQ-014] kind, date, precision and language set in Review are what the saved letter holds', () => {
    const c = asha();
    const d = typedDraft(c);
    expect(store.setDraftKind(d.id, 'note')).toBe(true);
    expect(store.setDraftOccurred(d.id, '2026-09-17', 'month')).toBe(true);
    expect(store.setDraftLanguage(d.id, 'hi-IN')).toBe(true);
    expect(store.getDraft(d.id)).toMatchObject({ kind: 'note', occurredOn: '2026-09-01', occurredPrecision: 'month', language: 'hi-IN' });
    save(d.id, c);
    expect(store.getEntry(d.id)).toMatchObject({ kind: 'note', occurredOn: '2026-09-01', occurredPrecision: 'month', language: 'hi-IN', baseDirection: 'ltr' });
    expect(store.getDraft(d.id)).toBeNull();
  });

  it('a choice not made leaves the caller\'s value; a day precision keeps the exact day', () => {
    const c = asha();
    const d = typedDraft(c);
    expect(store.setDraftOccurred(d.id, '2026-09-17', 'day')).toBe(true);
    save(d.id, c, { language: 'en', baseDirection: 'rtl' });
    expect(store.getEntry(d.id)).toMatchObject({ kind: 'letter', occurredOn: '2026-09-17', occurredPrecision: 'day', language: 'en', baseDirection: 'rtl' });
  });

  it('refuses malformed values and changes nothing', () => {
    const c = asha();
    const d = typedDraft(c);
    expect(store.setDraftKind(d.id, 'not_much' as never)).toBe(false);
    expect(store.setDraftOccurred(d.id, '17/09/2026', 'day')).toBe(false);
    expect(store.setDraftOccurred(d.id, '2026-09-17', 'year' as never)).toBe(false);
    expect(store.setDraftLanguage(d.id, 'english please')).toBe(false);
    expect(store.setDraftBaseDirection(d.id, 'up' as never)).toBe(false);
    expect(store.setDraftKind('missing', 'note')).toBe(false);
    expect(store.getDraft(d.id)).toMatchObject({ kind: 'letter', occurredOn: null, occurredPrecision: 'day', language: null, baseDirection: 'ltr' });
  });

  it('[F04-REQ-036] a save retried twice leaves one letter, with the draft\'s choices', () => {
    const c = asha();
    const d = typedDraft(c);
    store.setDraftLanguage(d.id, 'es');
    save(d.id, c);
    save(d.id, c); // the draft is gone: the retry updates the same row and keeps what was saved
    expect(raw.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')!.n).toBe(1);
    expect(store.getEntry(d.id)?.language).toBe('es');
  });
});

describe('[F04-REQ-009] Let it go in marked steps', () => {
  it('a draft being let go leaves Tonight at once, and only a marked draft is removed', () => {
    const c = asha();
    const d = typedDraft(c);
    const other = typedDraft(c, 'Keep me.');
    expect(store.finishDiscard(d.id)).toBe(false); // not marked: never removed by this path
    expect(store.beginDiscard(d.id)).toBe(true);
    expect(store.getDraft(d.id)?.state).toBe('discarding');
    expect(store.listDrafts(c).map((x) => x.id)).toEqual([other.id]);
    expect(store.finishDiscard(d.id)).toBe(true);
    expect(store.getDraft(d.id)).toBeNull();
    expect(store.getDraft(other.id)).not.toBeNull();
  });
});

describe('quiet-day marks: one per day (D-084)', () => {
  it('hasNotMuchOn sees a live mark for that book and day only', () => {
    const c = asha();
    expect(store.hasNotMuchOn(c, '2026-10-02')).toBe(false);
    store.saveEntry({
      id: newId(), kind: 'not_much', occurredOn: '2026-10-02', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: '', machineEdits: [], finalText: '', inBook: false, soundsLikeMe: null, childId: c,
    });
    expect(store.hasNotMuchOn(c, '2026-10-02')).toBe(true);
    expect(store.hasNotMuchOn(c, '2026-10-03')).toBe(false);
    expect(store.hasNotMuchOn('another-book', '2026-10-02')).toBe(false);
  });
});
