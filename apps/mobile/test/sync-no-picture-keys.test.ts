/// <reference types="node" />
/**
 * [NS-01-R15] Sync carries no picture key: ENTRY_DATA_KEYS and the outbox
 * payload of a saved letter never hold photo_path, photo_text, place or photo.
 * A picture never leaves the phone through sync (ADR 0028). Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { ENTRY_DATA_KEYS } from '../../../packages/api/server';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { SYNC_SETTING, enqueueEntryUpsert, writeSetting } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';
import { insertBook } from './helpers/store-fixture';

const PICTURE_KEYS = ['photo_path', 'photo_text', 'place', 'photo'] as const;
const ME = '11111111-1111-1111-1111-111111111111';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const NOW = '2026-10-03T09:00:00.000Z';

describe('[NS-01-R15] sync carries no picture key', () => {
  it('ENTRY_DATA_KEYS holds none of the picture keys', () => {
    expect(MIGRATIONS.length).toBe(LATEST_VERSION);
    for (const k of PICTURE_KEYS) expect(ENTRY_DATA_KEYS as readonly string[], k).not.toContain(k);
  });

  it('the outbox payload of a saved letter holds only ENTRY_DATA_KEYS and no picture key', () => {
    const { db } = nodeDb();
    migrate(db, { now: NOW, newId: id7 });
    const child = id7();
    insertBook(db, { id: child, name: 'Asha', birthday: '2025-04-12', at: NOW });
    writeSetting(db, SYNC_SETTING.owner, ME);
    const id = id7();
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id) VALUES (?, 'letter', '2026-09-29', ?, 'typed', 'verbatim', 2, ?, '[]', ?, 1, ?, ?, ?)`,
      id, NOW, 'She walked to me.', 'She walked to me.', NOW, child, ME,
    );
    enqueueEntryUpsert(db, id, ['text'], { now: NOW, newId: id7 });
    const rows = db.all<{ payload: string }>("SELECT payload FROM sync_outbox WHERE type = 'entry.upsert'");
    expect(rows.length, 'the arrange step queued no op, so the check below would prove nothing').toBe(1);
    const keys = Object.keys((JSON.parse(rows[0].payload) as { data: Record<string, unknown> }).data);
    for (const k of PICTURE_KEYS) expect(keys, k).not.toContain(k);
    for (const k of keys) expect(ENTRY_DATA_KEYS as readonly string[], `${k} is not a contract key`).toContain(k);
  });
});
