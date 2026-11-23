/// <reference types="node" />
/**
 * BL-1564: the server holds children.nickname to 30 code points (CHECK char_length <= 30; book_update trims first).
 * The phone column has no check, so the outbox is where a too-long nickname must be stopped: a payload the server
 * refuses would wedge the queue. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { NICKNAME_MAX, enqueueBookUpdate } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const ME = '11111111-1111-1111-1111-111111111111';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: '2026-10-03T09:00:00.000Z', newId: id7 };

function ownedBook(): { db: SqlDb; id: string } {
  const { db } = nodeDb();
  migrate(db, { now: ctx.now, newId: id7 });
  const id = id7();
  insertBook(db, { id, name: 'Asha', birthday: '2025-04-12', at: ctx.now });
  takeOwnership(db, ME, ctx);
  return { db, id };
}

/** What the server's CHECK counts: code points. */
const points = (s: string) => Array.from(s).length;

function queuedNicknames(db: SqlDb): unknown[] {
  return db
    .all<{ payload: string }>("SELECT payload FROM sync_outbox WHERE type = 'book.update' ORDER BY seq")
    .map((r) => (JSON.parse(r.payload) as { data: Record<string, unknown> }).data.nickname);
}

const LATIN_31 = 'A'.repeat(31);
// Each akshara below is a consonant, virama and consonant (3 code points, 1 character a person sees).
const DEVANAGARI_31 = 'क्ष'.repeat(31);
const DEVANAGARI_PLAIN_31 = 'आ'.repeat(31);
const EMOJI_31 = '👩🏽‍👧'.repeat(31);

describe('BL-1564: nickname limit on the sync outbox', () => {
  it('the limit is the server limit', () => {
    expect(NICKNAME_MAX).toBe(30);
  });

  it.each([
    ['Latin', LATIN_31],
    ['Devanagari plain', DEVANAGARI_PLAIN_31],
    ['Devanagari conjuncts', DEVANAGARI_31],
    ['emoji with joiners', EMOJI_31],
  ])('a 31 character %s nickname never queues a payload the server would refuse', (_n, value) => {
    const { db, id } = ownedBook();
    enqueueBookUpdate(db, id, { nickname: value }, ctx);
    const queued = queuedNicknames(db);
    expect(queued).toHaveLength(1);
    const sent = queued[0] as string;
    expect(points(sent)).toBeLessThanOrEqual(NICKNAME_MAX);
    expect(sent.length).toBeGreaterThan(0);
    expect(value.startsWith(sent)).toBe(true);
  });

  it('cuts on a whole character: a conjunct is never split', () => {
    const { db, id } = ownedBook();
    enqueueBookUpdate(db, id, { nickname: DEVANAGARI_31 }, ctx);
    const sent = queuedNicknames(db)[0] as string;
    expect(sent).toBe('क्ष'.repeat(10)); // 10 x 3 = 30 code points, no dangling virama
  });

  it('stops before a character that would pass 30 code points, never inside it', () => {
    const { db, id } = ownedBook();
    enqueueBookUpdate(db, id, { nickname: 'ab' + DEVANAGARI_31 }, ctx);
    expect(queuedNicknames(db)[0]).toBe('ab' + 'क्ष'.repeat(9)); // 2 + 27 = 29; the next conjunct would make 32
  });

  it('a nickname that fits travels as typed, trimmed', () => {
    const { db, id } = ownedBook();
    enqueueBookUpdate(db, id, { nickname: '  Ash  ' }, ctx);
    expect(queuedNicknames(db)).toEqual(['Ash']);
  });

  it('clearing the nickname still travels, and other fields are left alone', () => {
    const { db, id } = ownedBook();
    enqueueBookUpdate(db, id, { nickname: null, name: 'Asha' }, ctx);
    const row = db.get<{ payload: string }>("SELECT payload FROM sync_outbox WHERE type = 'book.update'");
    expect((JSON.parse(row!.payload) as { data: unknown }).data).toEqual({ nickname: null, name: 'Asha' });
  });

  it('a nickname coalesced into a queued update is cut too', () => {
    const { db, id } = ownedBook();
    enqueueBookUpdate(db, id, { name: 'Asha B' }, ctx);
    enqueueBookUpdate(db, id, { nickname: LATIN_31 }, ctx);
    const sent = queuedNicknames(db).find((x) => x !== undefined) as string;
    expect(points(sent)).toBeLessThanOrEqual(NICKNAME_MAX);
  });

  it('a nickname pulled from the server longer than 30 is kept as it came and not re-sent', () => {
    const { db, id } = ownedBook();
    db.run('UPDATE children SET nickname = ? WHERE id = ?', LATIN_31, id);
    enqueueBookUpdate(db, id, { name: 'Asha B' }, ctx); // a later edit to another field
    expect(db.get<{ nickname: string }>('SELECT nickname FROM children WHERE id = ?', id)!.nickname).toBe(LATIN_31);
    expect(queuedNicknames(db)).toEqual([undefined]);
  });
});
