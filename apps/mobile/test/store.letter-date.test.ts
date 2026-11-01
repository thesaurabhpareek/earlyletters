/// <reference types="node" />
/**
 * Change the date through the store (F09-REQ-004, F09-REQ-003 storage, F04-REQ-015; RT-BK-05, SR-C-10): one write of
 * `occurred_on` and `occurred_precision`, inside the store's existing rules. The words and raw_transcript never change,
 * a deleted letter, a quiet-day mark and another author's letter are refused, with sync on the move goes out as one
 * `entry.upsert` with the `occurred_on` group, and the free-letter ledger never moves. Real SQLite (node:sqlite).
 * Fictional family "Asha" only: Mama and Papa.
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
const { takeOwnership } = await import('../src/lib/sync/ownership');

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
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

const counts = () => store.ledgerDb().counts();
// Born 13 March 2026: 20 August is in Month 5, 13 May starts Month 2.
function asha(): string {
  return store.addChild({ name: 'Asha', birthday: '2026-03-13', dueDate: null, signsAs: 'Mama' }).id;
}
const SAID = 'um Asha you you laughed at the rain';
const KEPT = 'Asha, you laughed at the rain.';
function keep(childId: string, occurredOn = '2026-08-20'): string {
  const d = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: SAID });
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn, capturedAt: now(), captureMode: 'typed', editLevel: 'clean', promptKey: null,
    engineVersion: 5, rawTranscript: SAID, machineEdits: [], finalText: KEPT, inBook: true, soundsLikeMe: null, childId, authorSignsAs: 'Mama', audioUri: null,
  });
  return d.id;
}
const words = (id: string) => raw.get<{ raw_transcript: string; final_text: string; machine_edits: string; captured_at: string }>(
  'SELECT raw_transcript, final_text, machine_edits, captured_at FROM entries WHERE id = ?', id,
);
const ops = () => raw.all<{ type: string; entity_id: string; payload: string }>('SELECT type, entity_id, payload FROM sync_outbox ORDER BY seq');

describe('[F09-REQ-004] change the date of one\'s own letter', () => {
  it('Month 5 to Month 2 (month only): the letter is in Month 2, its words and raw_transcript untouched', () => {
    const c = asha();
    const id = keep(c);
    const before = words(id);
    expect(store.setEntryDate(id, '2026-05-13', 'month')).toBe(true);
    expect(store.getEntry(id)).toMatchObject({ occurredOn: '2026-05-13', occurredPrecision: 'month', rawTranscript: SAID, finalText: KEPT, inBook: true, childId: c });
    expect(words(id)).toEqual(before);
    expect(store.listEntriesForChild(c).map((e) => e.id)).toEqual([id]);
  });

  it('back to a day: the precision returns to day', () => {
    const id = keep(asha());
    store.setEntryDate(id, '2026-05-13', 'month');
    expect(store.setEntryDate(id, '2026-06-02', 'day')).toBe(true);
    expect(store.getEntry(id)).toMatchObject({ occurredOn: '2026-06-02', occurredPrecision: 'day' });
  });

  it('the Book reorders: newest moment first, whatever order they were saved in', () => {
    const c = asha();
    const a = keep(c, '2026-09-20');
    const b = keep(c, '2026-08-20');
    expect(store.listEntriesForChild(c).map((e) => e.id)).toEqual([a, b]);
    store.setEntryDate(a, '2026-04-13', 'month');
    expect(store.listEntriesForChild(c).map((e) => e.id)).toEqual([b, a]);
  });

  it('refuses a deleted letter (tombstone rules, MOB-03), a quiet-day mark, a malformed date and a missing letter', () => {
    const c = asha();
    const id = keep(c);
    store.deleteEntry(id);
    expect(store.setEntryDate(id, '2026-05-13', 'month')).toBe(false);
    store.undeleteEntry(id);
    expect(store.getEntry(id)?.occurredOn).toBe('2026-08-20');
    const mark = newId();
    store.saveEntry({
      id: mark, kind: 'not_much', occurredOn: '2026-10-02', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: '', machineEdits: [], finalText: '', inBook: false, soundsLikeMe: null, childId: c,
    });
    expect(store.setEntryDate(mark, '2026-09-01', 'day')).toBe(false);
    expect(store.setEntryDate(id, '13 May', 'day')).toBe(false);
    expect(store.setEntryDate('no-such-letter', '2026-05-13', 'day')).toBe(false);
  });

  it('refuses the other parent\'s letter (author_id; F09-REQ-028)', () => {
    const c = asha();
    takeOwnership(raw, MAMA, { now: now(), newId });
    const id = newId();
    raw.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id, server_version, sync_state) VALUES (?, 'letter', '2026-08-01', ?, 'typed', 'verbatim', 5, '', '[]', 'From Papa.', 1, ?, ?, ?, '9', 'synced')`,
      id, now(), now(), c, PAPA,
    );
    expect(store.setEntryDate(id, '2026-05-13', 'month')).toBe(false);
    expect(store.getEntry(id)?.occurredOn).toBe('2026-08-01');
  });

  it('with sync on, the move is one entry.upsert carrying occurred_on and occurred_precision, never new words', () => {
    const c = asha();
    takeOwnership(raw, MAMA, { now: now(), newId });
    const id = keep(c);
    raw.run('DELETE FROM sync_outbox');
    raw.run("UPDATE entries SET server_version = '5', sync_state = 'synced' WHERE id = ?", id);
    expect(store.setEntryDate(id, '2026-05-13', 'month')).toBe(true);
    const queued = ops();
    expect(queued.map((o) => o.type)).toEqual(['entry.upsert']);
    const p = JSON.parse(queued[0].payload) as { changed: string[]; data: Record<string, unknown> };
    expect(p.changed).toEqual(['occurred_on']);
    expect(p.data).toMatchObject({ occurred_on: '2026-05-13', occurred_precision: 'month', raw_transcript: SAID, final_text: KEPT });
    expect(store.getEntry(id)?.syncState).toBe('pending');
  });

  it('without an account nothing is queued (local only)', () => {
    const id = keep(asha());
    expect(store.setEntryDate(id, '2026-05-13', 'month')).toBe(true);
    expect(ops()).toEqual([]);
  });
});

describe('[F14-REQ-023] the free-letter count never changes when a date moves', () => {
  it('moving letters between months, to a month only, to Before You and back leaves the ledger as it was', () => {
    const c = asha();
    const a = keep(c);
    const b = keep(c, '2026-09-20');
    expect(counts()).toEqual({ recorded: 2, present: 2 });
    store.setEntryDate(a, '2026-05-13', 'month');
    store.setEntryDate(b, '2026-03-12', 'month');
    store.setEntryDate(a, '2026-06-02', 'day');
    expect(counts()).toEqual({ recorded: 2, present: 2 });
    takeOwnership(raw, MAMA, { now: now(), newId });
    store.setEntryDate(b, '2026-09-20', 'day');
    expect(counts()).toEqual({ recorded: 2, present: 2 });
  });
});
