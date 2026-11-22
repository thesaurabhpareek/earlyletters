/// <reference types="node" />
/**
 * [DATA-REQ-040] raw_transcript is set once on this phone (BL-412, migration 12, exec ruling D6).
 * Two triggers (entries, drafts); the one bypass is takeProvenance's, scoped to one entry id and gone in the same
 * transaction. Fictional family "Asha" only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { removeBook, removeEverything } from '../src/lib/db/repos/wipe';
import { applyPullPage } from '../src/lib/sync/merge';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';
import { createSyncEngine } from '../src/lib/sync/engine';
import { PULLED_LETTER as EL, pulledPage } from './helpers/pulled-page';
import type { RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { fixture, insertBook } from './helpers/store-fixture';

const NOW = '2026-10-20T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';
const L1 = '0199a5b0-0000-7000-8000-0000000000b1';
const L2 = '0199a5b0-0000-7000-8000-0000000000b2';
const FIRST = 'You laughed at the rain.';
const SECOND = 'You giggled at the puddle.';
const MSG = 'raw_transcript is immutable';

const row = (id: string, raw: string, v: string): PulledRow => ({
  id, child_id: ASHA, author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-20', captured_at: '2026-10-20T08:00:00.000Z',
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: raw,
  machine_edits: [], final_text: raw, in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  language: 'en', created_at: '2026-10-20T08:00:00.000Z', updated_at: NOW, deleted_at: null, own: true, v,
});
const page = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW,
  books: [{
    id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', rows, cursor: `${rows[0]?.v ?? '1'}:00000000-0000-0000-0000-000000000000`, more: false,
    meta: {
      role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
      created_by_me: true, my_signs_as: 'Mama', include_in_reminders: true, members: [],
    },
  }],
  gone: [],
});

function phone() {
  const f = fixture();
  f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  f.db.transaction(() => applyPullPage(f.db, page([row(L1, FIRST, '100'), row(L2, FIRST, '101')]), NOW));
  return f;
}
const rawOf = (f: ReturnType<typeof fixture>, id: string) => f.db.get<{ raw_transcript: string }>('SELECT raw_transcript FROM entries WHERE id = ?', id)?.raw_transcript;
const flag = (f: ReturnType<typeof fixture>) => f.db.get('SELECT 1 AS x FROM settings WHERE key = ?', 'raw_takeover');
const update = (f: ReturnType<typeof fixture>, sql: string, ...p: string[]) => () => f.db.run(sql, ...p);
function draftWith(f: ReturnType<typeof fixture>, raw: string | null) {
  insertBook(f.db, { id: 'child-asha' });
  f.db.run(
    `INSERT INTO drafts (id, child_id, capture_mode, created_at, audio_uri, audio_duration_ms, raw_transcript, state)
     VALUES ('d1', 'child-asha', 'spoken', ?, 'file:///a.m4a', 1000, ?, 'ready')`, NOW, raw,
  );
}

describe('[DATA-REQ-040] entries.raw_transcript is set once', () => {
  it('refuses a change of a set raw, with a message that holds no words', () => {
    const f = phone();
    let msg = '';
    try { f.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', SECOND, L1); } catch (e) { msg = String((e as Error).message); }
    expect(msg).toContain(MSG);
    expect(msg).not.toContain(FIRST);
    expect(msg).not.toContain(SECOND);
    expect(rawOf(f, L1)).toBe(FIRST);
    f.close();
  });
  it('refuses clearing a set raw', () => {
    const f = phone();
    expect(update(f, "UPDATE entries SET raw_transcript = '' WHERE id = ?", L1)).toThrow(MSG);
    f.close();
  });
  it('lets empty become the first words, and the same value be written again', () => {
    const f = phone();
    f.db.run('INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text, in_book, updated_at, child_id) VALUES (?, ?, ?, ?, ?, ?, 5, ?, ?, ?, 0, ?, ?)',
      'e-empty', 'letter', '2026-10-20', NOW, 'spoken', 'clean', '', '[]', '', NOW, ASHA);
    f.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', FIRST, 'e-empty');
    expect(rawOf(f, 'e-empty')).toBe(FIRST);
    f.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', FIRST, 'e-empty'); // names the column, same value
    f.db.run('UPDATE entries SET raw_transcript = ?, final_text = ? WHERE id = ?', FIRST, 'x', L1);
    expect(rawOf(f, L1)).toBe(FIRST);
    f.close();
  });
  it('an update that does not name the column is untouched', () => {
    const f = phone();
    f.db.run("UPDATE entries SET final_text = 'You laughed.' WHERE id = ?", L1);
    expect(rawOf(f, L1)).toBe(FIRST);
    f.close();
  });
});

describe('[DATA-REQ-040] drafts.raw_transcript is set once', () => {
  it('NULL to words and empty to words pass; a set raw cannot change or clear; same value passes', () => {
    const f = fixture();
    draftWith(f, null);
    f.db.run("UPDATE drafts SET raw_transcript = ? WHERE id = 'd1'", FIRST);
    expect(() => f.db.run("UPDATE drafts SET raw_transcript = ? WHERE id = 'd1'", SECOND)).toThrow(MSG);
    expect(() => f.db.run("UPDATE drafts SET raw_transcript = NULL WHERE id = 'd1'")).toThrow(MSG);
    f.db.run("UPDATE drafts SET raw_transcript = ? WHERE id = 'd1'", FIRST);
    f.db.run("UPDATE drafts SET raw_transcript = ? WHERE id = 'd1'", FIRST);
    f.close();
  });
  it('an empty draft raw becomes the first words', () => {
    const f = fixture();
    draftWith(f, '');
    f.db.run("UPDATE drafts SET raw_transcript = ? WHERE id = 'd1'", FIRST);
    f.close();
  });
  it('a draft has no bypass, even with the flag set', () => {
    const f = fixture();
    draftWith(f, FIRST);
    f.db.run("INSERT INTO settings (key, value) VALUES ('raw_takeover', 'd1')");
    expect(() => f.db.run("UPDATE drafts SET raw_transcript = ? WHERE id = 'd1'", SECOND)).toThrow(MSG);
    f.close();
  });
  it('the held-draft pull write (COALESCE) still passes', () => {
    const f = fixture();
    draftWith(f, FIRST);
    f.db.run("UPDATE drafts SET raw_transcript = COALESCE(raw_transcript, ?) WHERE id = 'd1'", SECOND);
    f.close();
  });
});

describe('[DATA-REQ-040] the one bypass: takeProvenance, one entry id, same transaction', () => {
  it('a pulled own row with the first keep\'s raw replaces the raw, and no flag is left', () => {
    const f = phone();
    f.db.transaction(() => applyPullPage(f.db, page([row(L1, SECOND, '200')]), NOW));
    expect(rawOf(f, L1)).toBe(SECOND);
    expect(rawOf(f, L2)).toBe(FIRST);
    expect(flag(f)).toBeNull();
    f.close();
  });
  it('the flag names one entry: another entry cannot use it', () => {
    const f = phone();
    f.db.run("INSERT INTO settings (key, value) VALUES ('raw_takeover', ?)", L1);
    f.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', SECOND, L1);
    expect(() => f.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', SECOND, L2)).toThrow(MSG);
    expect(rawOf(f, L2)).toBe(FIRST);
    f.close();
  });
  it('an error inside the window still clears the flag (finally), and a rolled back pull leaves none', () => {
    const f = phone();
    f.db.exec("CREATE TRIGGER t_fail AFTER UPDATE OF raw_transcript ON entries BEGIN SELECT RAISE(ABORT, 'boom'); END");
    expect(() => f.db.transaction(() => applyPullPage(f.db, page([row(L1, SECOND, '200')]), NOW))).toThrow('boom');
    expect(flag(f)).toBeNull();
    expect(rawOf(f, L1)).toBe(FIRST);
    f.close();
  });
  it('no flag after a pull that changes nothing, or an empty pulled raw', () => {
    const f = phone();
    f.db.transaction(() => applyPullPage(f.db, page([row(L1, FIRST, '200'), row(L2, '', '201')]), NOW));
    expect(rawOf(f, L1)).toBe(FIRST);
    expect(rawOf(f, L2)).toBe(FIRST);
    expect(flag(f)).toBeNull();
    f.close();
  });
});

describe('[DATA-REQ-040] fail closed without wedging the pull', () => {
  it('another writer inside a pull that changes a set raw is refused and counted; the rest of the page lands; the retry does not throw', () => {
    const f = phone();
    // A bug of the future: some other code path rewrites the raw while L1 is merged.
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}'
      BEGIN UPDATE entries SET raw_transcript = 'tampered' WHERE id = NEW.id; END`);
    const p = page([row(L1, FIRST, '300'), row('0199a5b0-0000-7000-8000-0000000000b3', SECOND, '301')]);
    let out!: ReturnType<typeof applyPullPage>;
    expect(() => f.db.transaction(() => { out = applyPullPage(f.db, p, NOW); })).not.toThrow();
    expect(out.refused).toBe(1);
    expect(rawOf(f, L1)).toBe(FIRST);
    expect(rawOf(f, '0199a5b0-0000-7000-8000-0000000000b3')).toBe(SECOND);
    expect(f.db.get<{ cursor: string }>('SELECT cursor FROM sync_books WHERE child_id = ?', ASHA)?.cursor).toBe(p.books![0].cursor);
    expect(flag(f)).toBeNull();
    expect(() => f.db.transaction(() => applyPullPage(f.db, p, NOW))).not.toThrow();
    f.close();
  });
  it('a refused row is undone as a whole (ROLLBACK TO), not left half merged; only the raw guard is swallowed', () => {
    const f = phone();
    const before = f.db.get<Record<string, unknown>>('SELECT * FROM entries WHERE id = ?', L1)!;
    // The abort comes late: after the merge already moved server_version and synced_at (statement 2), at takeProvenance's statement.
    f.db.exec(`CREATE TRIGGER t_late AFTER UPDATE OF engine_version ON entries WHEN NEW.id = '${L1}'
      BEGIN UPDATE entries SET raw_transcript = 'tampered' WHERE id = NEW.id; END`);
    let out!: ReturnType<typeof applyPullPage>;
    f.db.transaction(() => { out = applyPullPage(f.db, page([{ ...row(L1, FIRST, '999'), updated_at: '2026-10-21T09:00:00.000Z' }]), '2026-10-21T09:00:00.000Z'); });
    expect(out.refused).toBe(1);
    expect(f.db.get('SELECT * FROM entries WHERE id = ?', L1)).toEqual(before); // every column as it was
    expect(flag(f)).toBeNull();
    f.close();
  });
  it('an error that is not the raw guard still fails the page, as before', () => {
    const f = phone();
    f.db.exec(`CREATE TRIGGER t_other AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}' BEGIN SELECT RAISE(ABORT, 'other'); END`);
    expect(() => f.db.transaction(() => applyPullPage(f.db, page([row(L1, FIRST, '300')]), NOW))).toThrow('other');
    f.close();
  });
});

describe('[DATA-REQ-040] erase and delete paths are unaffected', () => {
  it('removeBook, removeEverything, and a delete then re-pull of the same id work', () => {
    const f = phone();
    removeBook(f.ctx, ASHA);
    expect(rawOf(f, L1)).toBeUndefined();
    const g = phone();
    draftWith(g, FIRST);
    removeEverything(g.ctx);
    expect(g.db.all('SELECT id FROM entries')).toEqual([]);
    expect(g.db.all('SELECT id FROM drafts')).toEqual([]);
    f.close();
    g.close();
  });
  it('a restore pull (the server\'s words for an own row already here, unchanged) replays cleanly', () => {
    const f = phone();
    for (let i = 0; i < 3; i++) f.db.transaction(() => applyPullPage(f.db, page([row(L1, FIRST, String(400 + i))]), NOW));
    expect(rawOf(f, L1)).toBe(FIRST);
    f.close();
  });
});

describe('[DATA-REQ-040] source scan: takeProvenance is the only writer of the bypass', () => {
  const src = join(__dirname, '..', 'src');
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
  const named = walk(src).filter((p) => readFileSync(p, 'utf8').includes('raw_takeover')).map((p) => p.slice(src.length + 1));
  it('only merge.ts (the writer) and migrations.ts (the trigger) name it', () => {
    expect(named.sort()).toEqual(['lib/db/migrations.ts', 'lib/sync/merge.ts']);
  });
  it('merge.ts sets it in one place, inside takeProvenance, and deletes it in a finally', () => {
    const m = readFileSync(join(src, 'lib/sync/merge.ts'), 'utf8');
    const writes = m.match(/INTO settings \(key, value\) VALUES \('raw_takeover'/g) ?? [];
    expect(writes).toHaveLength(1);
    const body = m.slice(m.indexOf('function takeProvenance'), m.indexOf('/** Applies one sync_push answer'));
    expect(body).toContain("INTO settings (key, value) VALUES ('raw_takeover'");
    expect(body).toMatch(/finally \{\s*db\.run\("DELETE FROM settings WHERE key = 'raw_takeover'"\)/);
  });
  it('no source writes the keys through the settings helpers or a dynamic key', () => {
    expect(walk(src).filter((p) => /['"`]raw_takeover/.test(readFileSync(p, 'utf8')) && !/migrations\.ts|sync\/merge\.ts/.test(p))).toEqual([]);
  });
});

describe('[DATA-REQ-040] the engine: a refused row is reported, the cycle finishes, the next cycle is clean', () => {
  it('report.pulledRefused counts it (BL-1498; report.rejected stays 0), lastSyncedAt is written, no flag is left, and the next cycle does not throw', async () => {
    const f = fixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    const server: SupabaseLike = {
      rpc: (fn) => Promise.resolve({ data: fn === 'sync_pull' ? pulledPage(ME, [EL]) : { results: [] }, error: null, status: 200 } as RpcResult),
    };
    const engine = createSyncEngine({
      db: f.db, supabase: server, userId: ME, newId: f.ctx.newId, now: () => Date.parse(NOW), random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
    });
    const first = await engine.sync();
    expect(first.rejected).toBe(0);
    expect(first.pulledRefused).toBe(0);
    expect(rawOf(f, EL)).toBe('Asha laughed.');
    expect(flag(f)).toBeNull();
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${EL}'
      BEGIN UPDATE entries SET raw_transcript = 'tampered' WHERE id = NEW.id; END`);
    const second = await engine.sync();
    expect(second.pulledRefused).toBe(1);
    expect(second.rejected).toBe(0); // a refused pulled row is not a refused upload (BL-1498)
    expect(second.pulled).toBe(1);
    expect(rawOf(f, EL)).toBe('Asha laughed.');
    expect(flag(f)).toBeNull(); // after every sync
    await expect(engine.sync()).resolves.toMatchObject({ rejected: 0, pulledRefused: 1 });
    expect(flag(f)).toBeNull();
    engine.stop();
    f.close();
  });
});
