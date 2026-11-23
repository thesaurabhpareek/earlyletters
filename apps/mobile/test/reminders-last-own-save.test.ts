/// <reference types="node" />
/**
 * `lastOwnSaveAt` gets the same fix as `lastMadeLetter` (BL-1648; NS-48-R27, BL-1016): the planner's anchor reads the
 * newest made letter or waiting draft in a fixed, small number of statements, none of which returns a book's rows.
 * Fictional family Asha only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { entries } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { SYNC_SETTING } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { lastOwnSaveAt, lastMadeLetter } = await import('../src/lib/reminders/prefs');

const ME = 'user-asha-mama';
const eid = (i: number) => `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;
const hour = (i: number) => new Date(Date.UTC(2026, 0, 1) + i * 3_600_000).toISOString();

describe('[NS-48-R27] lastOwnSaveAt reads one newest row, not every letter', () => {
  let close: () => void = () => {};
  let raw: SqlDb;
  let seq = 0;
  let nowIso = '2026-10-05T19:00:00.000Z';
  const sql: Array<{ q: string; rows: number }> = [];
  const newId = () => `0199a5b0-1111-7000-8000-${String(++seq).padStart(12, '0')}`;
  const put = (i: number, over: Parameters<typeof letter>[0] = {}, childId = 'child-asha') =>
    entries.upsert({ db: raw, now: () => nowIso, newId }, letter({ id: eid(i), childId, ...over }), { childId, authorSignsAs: 'Mama' });
  const draft = (childId: string) =>
    store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha laughed.' });

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    raw = h.db;
    sql.length = 0;
    nowIso = '2026-10-05T19:00:00.000Z';
    // The store reads through this wrapper, so the spy sees how many rows each SELECT itself returns.
    const spy = {
      ...h.db,
      all: (q: string, ...p: never[]) => {
        const rows = h.db.all(q, ...p);
        sql.push({ q, rows: rows.length });
        return rows;
      },
      get: (q: string, ...p: never[]) => {
        const rows = h.db.all(q, ...p);
        sql.push({ q, rows: rows.length });
        return rows[0];
      },
    } as unknown as SqlDb;
    expect(store.openStore({ open: () => ({ db: spy, close: () => {} }), now: () => nowIso, newId }).ok).toBe(true);
    store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
  });
  afterEach(() => {
    store.closeStore();
    close();
  });
  const book = () => store.listChildren()[0]!.id;

  it('a 1,200-letter book is one statement over entries and one over drafts, and none returns more than one row', () => {
    for (let i = 0; i < 1200; i++) put(i, { capturedAt: hour(i) }, book());
    sql.length = 0;
    expect(lastOwnSaveAt()).toBe(Date.parse(hour(1199)));
    expect(sql.filter((s) => /\bFROM entries\b/.test(s.q)).length).toBe(1);
    expect(sql.filter((s) => /\bFROM drafts\b/.test(s.q)).length).toBe(1);
    expect(sql.every((s) => s.rows <= 1)).toBe(true);
  });

  it('the newest letter or the newest waiting draft, whichever is later', () => {
    put(1, { capturedAt: '2026-10-01T08:00:00.000Z' }, book());
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-01T08:00:00.000Z'));
    draft(book());
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-05T19:00:00.000Z'));
    put(2, { capturedAt: '2026-10-06T08:00:00.000Z' }, book());
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-06T08:00:00.000Z'));
  });

  it('a quiet-day mark and a deleted letter are not a made letter', () => {
    put(1, { capturedAt: '2026-10-01T08:00:00.000Z' }, book());
    put(2, { capturedAt: '2026-10-04T08:00:00.000Z', kind: 'not_much' }, book());
    put(3, { capturedAt: '2026-10-06T08:00:00.000Z' }, book());
    raw.run('UPDATE entries SET deleted_at = ? WHERE id = ?', '2026-10-07T08:00:00.000Z', eid(3));
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-01T08:00:00.000Z'));
  });

  it('only the phone user own letters count; with no account yet, only letters with no author', () => {
    put(1, { capturedAt: '2026-10-01T08:00:00.000Z' }, book());
    put(2, { capturedAt: '2026-10-06T08:00:00.000Z', authorId: ME }, book());
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-01T08:00:00.000Z'));
    store.setSetting(SYNC_SETTING.owner, ME);
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-06T08:00:00.000Z'));
    put(3, { capturedAt: '2026-10-08T08:00:00.000Z', authorId: 'user-dad' }, book());
    expect(lastOwnSaveAt()).toBe(Date.parse('2026-10-06T08:00:00.000Z'));
  });

  it('a draft being let go never counts, and null when nothing is made', () => {
    expect(lastOwnSaveAt()).toBeNull();
    const d = draft(book());
    expect(store.beginDiscard(d.id)).toBe(true);
    expect(lastOwnSaveAt()).toBeNull();
  });

  it('agrees with lastMadeLetter on the letter it finds', () => {
    put(1, { capturedAt: '2026-10-01T08:00:00.000Z' }, book());
    put(2, { capturedAt: '2026-10-03T08:00:00.000Z' }, book());
    expect(lastOwnSaveAt()).toBe(lastMadeLetter()?.at);
  });
});
