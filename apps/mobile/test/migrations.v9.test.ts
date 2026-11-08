/// <reference types="node" />
/**
 * Local schema v9 (SR-C-06, CR-39; RT-REV-02, BL-377, WP-F06-08b): Review's own choices get a place on the draft.
 * Columns only, every existing draft and letter kept byte for byte, nothing queued. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate, userVersion } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';

const NOW = '2026-10-03T09:00:00.000Z';
let n = 0;
const ctx = { now: NOW, newId: () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}` };
const cols = (db: SqlDb, table: string) => db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name);
const REVIEW_COLS = ['review_put_back', 'review_view', 'review_text', 'review_base'];
const RAW = 'um Asha, you you laughed at the rain today.';

function atV8WithADraft(): SqlDb {
  const { db } = nodeDb();
  migrate(db, ctx, MIGRATIONS.filter((m) => m.version <= 8));
  expect(userVersion(db)).toBe(8);
  db.run("INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES ('c1', 'Asha', '2026-03-01', NULL, 'Mama', ?, ?)", NOW, NOW);
  db.run(
    `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, raw_transcript, typed_text, state)
     VALUES ('d1', 'c1', 'spoken', NULL, ?, 'file:///Documents/recording-1.m4a', 31000, ?, NULL, 'ready')`,
    NOW, RAW,
  );
  return db;
}

describe('[SR-C-06] migration 9: Review\'s choices live on the draft', () => {
  it('is the next version after 8 and the latest', () => {
    expect(MIGRATIONS.find((m) => m.version === 9)).toBeDefined();
    expect(LATEST_VERSION).toBe(9);
  });

  it('adds the four review columns to drafts only, null on an existing draft, and queues nothing', () => {
    const db = atV8WithADraft();
    const before = db.get<Record<string, unknown>>('SELECT * FROM drafts WHERE id = ?', 'd1')!;
    const outbox = db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n;
    expect(migrate(db, ctx)).toMatchObject({ from: 8, to: LATEST_VERSION });
    expect(cols(db, 'drafts')).toEqual(expect.arrayContaining(REVIEW_COLS));
    for (const c of REVIEW_COLS) expect(cols(db, 'entries')).not.toContain(c);
    const after = db.get<Record<string, unknown>>('SELECT * FROM drafts WHERE id = ?', 'd1')!;
    for (const [k, v] of Object.entries(before)) expect(after[k]).toEqual(v); // raw_transcript and the rest, untouched
    for (const c of REVIEW_COLS) expect(after[c]).toBeNull();
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n).toBe(outbox);
  });

  it('is safe on a database that already has the columns (a step re-run after a kill)', () => {
    const db = atV8WithADraft();
    MIGRATIONS.find((m) => m.version === 9)!.up(db, ctx);
    db.exec('PRAGMA user_version = 8');
    expect(() => migrate(db, ctx)).not.toThrow();
    expect(userVersion(db)).toBe(LATEST_VERSION);
  });

  it('a fresh install has the columns', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    expect(cols(db, 'drafts')).toEqual(expect.arrayContaining(REVIEW_COLS));
  });
});
