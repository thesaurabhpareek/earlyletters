/// <reference types="node" />
/**
 * [DATA-REQ-040] BL-1497 / BL-1498: the other four entry columns have their own phone-side rule (migration 13), and a
 * pulled row a local guard refuses is counted apart from a refused upload. Fictional family "Asha" only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyPullPage } from '../src/lib/sync/merge';
import { createSyncEngine } from '../src/lib/sync/engine';
import { takeOwnership } from '../src/lib/sync/ownership';
import { MIGRATIONS, migrate } from '../src/lib/db/migrations';
import type { PullResponse, PulledRow, RpcResult, SupabaseLike } from '../src/lib/sync/types';
import { PULLED_LETTER as EL, pulledPage } from './helpers/pulled-page';
import { fixture } from './helpers/store-fixture';

const NOW = '2026-10-20T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';
const BOOK2 = '0199a5b0-0000-7000-8000-0000000000a2';
const L1 = '0199a5b0-0000-7000-8000-0000000000b1';
const L2 = '0199a5b0-0000-7000-8000-0000000000b2';
const CAP = '2026-10-20T08:00:00.000Z';
const CAP2 = '2026-10-19T07:00:00.000Z';

const row = (id: string, v: string, over: Partial<PulledRow> = {}): PulledRow => ({
  id, child_id: ASHA, author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-20', captured_at: CAP,
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'You laughed at the rain.',
  machine_edits: [], final_text: 'You laughed at the rain.', in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  language: 'en', created_at: CAP, updated_at: NOW, deleted_at: null, own: true, v, ...over,
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
type F = ReturnType<typeof fixture>;
function phone(): F {
  const f = fixture();
  f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  f.db.transaction(() => applyPullPage(f.db, page([row(L1, '100'), row(L2, '101')]), NOW));
  return f;
}
const col = (f: F, c: string, id = L1) => f.db.get<Record<string, unknown>>(`SELECT ${c} AS x FROM entries WHERE id = ?`, id)?.x;
const pull = (f: F, rows: PulledRow[]) => { let o!: ReturnType<typeof applyPullPage>; f.db.transaction(() => { o = applyPullPage(f.db, page(rows), NOW); }); return o; };
const flags = (f: F) => f.db.all("SELECT key FROM settings WHERE key IN ('raw_takeover', 'provenance_takeover')");
/** A local entry that never synced: no synced_at, an empty raw, the way a voice-only letter is saved. */
function unsynced(f: F, id: string, over: { raw?: string; engine?: number; author?: string | null; child?: string | null } = {}) {
  f.db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text, in_book, updated_at, child_id, author_id)
     VALUES (?, 'letter', '2026-10-20', ?, 'spoken', 'verbatim', ?, ?, '[]', '', 0, ?, ?, ?)`,
    id, CAP, over.engine ?? 5, over.raw ?? '', NOW, over.child === undefined ? ASHA : over.child, over.author === undefined ? null : over.author,
  );
}
const M = { cap: 'captured_at is set once', eng: 'engine_version is set once', auth: 'author_id is set once', child: 'child_id is fixed once synced' };

describe('[BL-1497] captured_at is written only inside the takeover window', () => {
  it('refuses a change, with a message that holds no values; the same value passes', () => {
    const f = phone();
    let msg = '';
    try { f.db.run('UPDATE entries SET captured_at = ? WHERE id = ?', CAP2, L1); } catch (e) { msg = String((e as Error).message); }
    expect(msg).toContain(M.cap);
    expect(msg).not.toContain(CAP2);
    expect(col(f, 'captured_at')).toBe(CAP);
    f.db.run('UPDATE entries SET captured_at = ? WHERE id = ?', CAP, L1);
    f.close();
  });
  it('the window names one entry: another entry cannot use it', () => {
    const f = phone();
    f.db.run("INSERT INTO settings (key, value) VALUES ('provenance_takeover', ?)", L1);
    f.db.run('UPDATE entries SET captured_at = ? WHERE id = ?', CAP2, L1);
    expect(() => f.db.run('UPDATE entries SET captured_at = ? WHERE id = ?', CAP2, L2)).toThrow(M.cap);
    f.close();
  });
  it('the raw_transcript window does not open it', () => {
    const f = phone();
    f.db.run("INSERT INTO settings (key, value) VALUES ('raw_takeover', ?)", L1);
    expect(() => f.db.run('UPDATE entries SET captured_at = ? WHERE id = ?', CAP2, L1)).toThrow(M.cap);
    f.close();
  });
  it('the second-Keep takeover (a pulled own row) still takes the first keep\'s captured_at, and leaves no window', () => {
    const f = phone();
    const o = pull(f, [row(L1, '200', { captured_at: CAP2 })]);
    expect(o.refused).toBe(0);
    expect(col(f, 'captured_at')).toBe(CAP2);
    expect(col(f, 'captured_at', L2)).toBe(CAP);
    expect(flags(f)).toEqual([]);
    f.close();
  });
  it('a hostile writer inside a pull is refused, counted, undone as a whole, and the rest of the page lands', () => {
    const f = phone();
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}'
      BEGIN UPDATE entries SET captured_at = '1999-01-01T00:00:00.000Z' WHERE id = NEW.id; END`);
    const before = f.db.get<Record<string, unknown>>('SELECT * FROM entries WHERE id = ?', L1);
    const o = pull(f, [row(L1, '300', { updated_at: '2026-10-21T09:00:00.000Z' }), row(L2, '301', { raw_transcript: 'You giggled.' })]);
    expect(o.refused).toBe(1);
    expect(f.db.get('SELECT * FROM entries WHERE id = ?', L1)).toEqual(before);
    expect(col(f, 'raw_transcript', L2)).toBe('You giggled.');
    expect(f.db.get<{ cursor: string }>('SELECT cursor FROM sync_books WHERE child_id = ?', ASHA)?.cursor).toBe('300:00000000-0000-0000-0000-000000000000');
    expect(flags(f)).toEqual([]);
    expect(() => pull(f, [row(L1, '300', { updated_at: '2026-10-21T09:00:00.000Z' })])).not.toThrow(); // the retry does not wedge
    f.close();
  });
});

describe('[BL-1497] engine_version is written inside the window, while the words are missing, or from 0', () => {
  it('refuses a change on a letter that has words; the same value passes', () => {
    const f = phone();
    expect(() => f.db.run('UPDATE entries SET engine_version = 9 WHERE id = ?', L1)).toThrow(M.eng);
    expect(col(f, 'engine_version')).toBe(5);
    f.db.run('UPDATE entries SET engine_version = 5 WHERE id = ?', L1);
    f.close();
  });
  it('words arriving (raw still empty) may set it, through the real store statement shape', () => {
    const f = phone();
    unsynced(f, 'e-wait', { engine: 3 });
    f.db.run("UPDATE entries SET raw_transcript = 'You laughed.', engine_version = 4 WHERE id = 'e-wait' AND raw_transcript = ''");
    expect(col(f, 'engine_version', 'e-wait')).toBe(4);
    expect(() => f.db.run("UPDATE entries SET engine_version = 8 WHERE id = 'e-wait'")).toThrow(M.eng); // the words are in now
    f.close();
  });
  it('a version of 0 (a held waiting letter) may be set once', () => {
    const f = phone();
    unsynced(f, 'e-zero', { engine: 0, raw: 'You laughed.' });
    f.db.run("UPDATE entries SET engine_version = 5 WHERE id = 'e-zero'");
    expect(() => f.db.run("UPDATE entries SET engine_version = 6 WHERE id = 'e-zero'")).toThrow(M.eng);
    f.close();
  });
  it('the window names one entry, and the second-Keep takeover still takes engine_version', () => {
    const f = phone();
    f.db.run("INSERT INTO settings (key, value) VALUES ('provenance_takeover', ?)", L1);
    f.db.run('UPDATE entries SET engine_version = 7 WHERE id = ?', L1);
    expect(() => f.db.run('UPDATE entries SET engine_version = 7 WHERE id = ?', L2)).toThrow(M.eng);
    f.db.run("DELETE FROM settings WHERE key = 'provenance_takeover'");
    expect(pull(f, [row(L2, '210', { engine_version: 6 })]).refused).toBe(0);
    expect(col(f, 'engine_version', L2)).toBe(6);
    expect(flags(f)).toEqual([]);
    f.close();
  });
  it('a hostile writer inside a pull is refused and counted', () => {
    const f = phone();
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}'
      BEGIN UPDATE entries SET engine_version = 99 WHERE id = NEW.id; END`);
    const o = pull(f, [row(L1, '300', { updated_at: '2026-10-21T09:00:00.000Z' })]);
    expect(o.refused).toBe(1);
    expect(col(f, 'engine_version')).toBe(5);
    f.close();
  });
});

describe('[BL-1497] author_id goes from NULL to a value, never otherwise', () => {
  it('refuses a change and clearing; the same value passes', () => {
    const f = phone();
    let msg = '';
    try { f.db.run('UPDATE entries SET author_id = ? WHERE id = ?', OTHER, L1); } catch (e) { msg = String((e as Error).message); }
    expect(msg).toContain(M.auth);
    expect(msg).not.toContain(OTHER);
    expect(() => f.db.run('UPDATE entries SET author_id = NULL WHERE id = ?', L1)).toThrow(M.auth);
    f.db.run('UPDATE entries SET author_id = ? WHERE id = ?', ME, L1);
    expect(col(f, 'author_id')).toBe(ME);
    f.close();
  });
  it('the first-sign-in claim (NULL to the user) still works, and only NULL rows move', () => {
    const f = fixture();
    unsynced(f, 'e-mine');
    f.db.run("UPDATE entries SET author_id = ? WHERE id = 'e-mine'", OTHER); // set at once: NULL to a value
    unsynced(f, 'e-null');
    takeOwnership(f.db, ME, { now: NOW, newId: f.ctx.newId });
    expect(col(f, 'author_id', 'e-null')).toBe(ME);
    expect(col(f, 'author_id', 'e-mine')).toBe(OTHER);
    f.close();
  });
  it('a pulled own row for another author is skipped: it cannot rewrite author_id; a NULL one takes the server\'s', () => {
    const f = phone();
    const o = pull(f, [row(L1, '200', { author_id: OTHER })]);
    expect(o.refused).toBe(0);
    expect(col(f, 'author_id')).toBe(ME);
    unsynced(f, 'e-null');
    const n = pull(f, [row('e-null', '201')]);
    expect(n.refused).toBe(0);
    expect(col(f, 'author_id', 'e-null')).toBe(ME);
    f.close();
  });
  it('a hostile writer inside a pull is refused and counted', () => {
    const f = phone();
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}'
      BEGIN UPDATE entries SET author_id = '${OTHER}' WHERE id = NEW.id; END`);
    expect(pull(f, [row(L1, '300', { updated_at: '2026-10-21T09:00:00.000Z' })]).refused).toBe(1);
    expect(col(f, 'author_id')).toBe(ME);
    f.close();
  });
});

describe('[BL-1497] child_id moves only while the letter has never synced', () => {
  it('refuses a move after sync; the same value passes', () => {
    const f = phone();
    let msg = '';
    try { f.db.run('UPDATE entries SET child_id = ? WHERE id = ?', BOOK2, L1); } catch (e) { msg = String((e as Error).message); }
    expect(msg).toContain(M.child);
    expect(msg).not.toContain(BOOK2);
    expect(col(f, 'child_id')).toBe(ASHA);
    f.db.run('UPDATE entries SET child_id = ? WHERE id = ?', ASHA, L1);
    f.close();
  });
  it('an unsynced letter may move, the way the store upsert does, and may not once synced_at is set', () => {
    const f = phone();
    unsynced(f, 'e-new', { child: null });
    f.db.run("UPDATE entries SET child_id = ? WHERE id = 'e-new'", ASHA);
    f.db.run("UPDATE entries SET child_id = ? WHERE id = 'e-new'", BOOK2);
    f.db.run("UPDATE entries SET synced_at = ? WHERE id = 'e-new'", NOW);
    expect(() => f.db.run("UPDATE entries SET child_id = ? WHERE id = 'e-new'", ASHA)).toThrow(M.child);
    f.close();
  });
  it('a pulled row for another book does not move a synced letter', () => {
    const f = phone();
    expect(pull(f, [row(L1, '200', { child_id: BOOK2 })]).refused).toBe(0);
    expect(col(f, 'child_id')).toBe(ASHA);
    f.close();
  });
  it('a hostile writer inside a pull is refused and counted', () => {
    const f = phone();
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}'
      BEGIN UPDATE entries SET child_id = '${BOOK2}' WHERE id = NEW.id; END`);
    expect(pull(f, [row(L1, '300', { updated_at: '2026-10-21T09:00:00.000Z' })]).refused).toBe(1);
    expect(col(f, 'child_id')).toBe(ASHA);
    f.close();
  });
});

describe('[BL-1497] the migration', () => {
  it('is version 13, appended after 12, adds four triggers and writes no settings row', () => {
    const { db } = fixture();
    expect(MIGRATIONS.map((m) => m.version).slice(11)).toEqual([12, 13].slice(0, MIGRATIONS.length - 11));
    const names = ['entries_captured_at_set_once', 'entries_engine_version_set_once', 'entries_author_id_set_once', 'entries_child_id_fixed_once_synced'];
    const have = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'trigger'").map((r) => r.name);
    for (const n of names) expect(have).toContain(n);
    expect(MIGRATIONS[12].up.toString()).not.toMatch(/(INSERT|DELETE|UPDATE)\s+(INTO\s+|FROM\s+)?settings/i);
    expect(db.all('SELECT key FROM settings WHERE key LIKE \'%takeover%\'')).toEqual([]);
  });
  it('a phone on version 12 migrates to 13 with its rows untouched', () => {
    const f = phone();
    const rows = f.db.all('SELECT * FROM entries ORDER BY id');
    f.db.exec('DROP TRIGGER entries_captured_at_set_once; DROP TRIGGER entries_engine_version_set_once; DROP TRIGGER entries_author_id_set_once; DROP TRIGGER entries_child_id_fixed_once_synced');
    f.db.exec('PRAGMA user_version = 12');
    expect(migrate(f.db, { now: NOW, newId: f.ctx.newId }, MIGRATIONS)).toMatchObject({ from: 12, to: 13 });
    expect(f.db.all('SELECT * FROM entries ORDER BY id')).toEqual(rows);
    expect(() => f.db.run('UPDATE entries SET captured_at = ? WHERE id = ?', CAP2, L1)).toThrow(M.cap);
    f.close();
  });
});

describe('[BL-1497] source scan: provenance_takeover has one writer', () => {
  const src = join(__dirname, '..', 'src');
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
  it('only merge.ts and migrations.ts name it; merge.ts sets it once in takeProvenance and deletes it in a finally', () => {
    const named = walk(src).filter((p) => readFileSync(p, 'utf8').includes('provenance_takeover')).map((p) => p.slice(src.length + 1));
    expect(named.sort()).toEqual(['lib/db/migrations.ts', 'lib/sync/merge.ts']);
    const m = readFileSync(join(src, 'lib/sync/merge.ts'), 'utf8');
    expect(m.match(/INTO settings \(key, value\) VALUES \('provenance_takeover'/g) ?? []).toHaveLength(1);
    const body = m.slice(m.indexOf('function takeProvenance'), m.indexOf('/** Applies one sync_push answer'));
    expect(body).toContain("INTO settings (key, value) VALUES ('provenance_takeover'");
    expect(body).toMatch(/finally \{\s*db\.run\("DELETE FROM settings WHERE key = 'provenance_takeover'"\)/);
  });
});

describe('[BL-1498] a refused pulled row is counted apart from a refused upload', () => {
  it('the engine raises pulledRefused and leaves rejected alone; the next cycle is clean; no window is left', async () => {
    const f = fixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    const server: SupabaseLike = {
      rpc: (fn) => Promise.resolve({ data: fn === 'sync_pull' ? pulledPage(ME, [EL]) : { results: [] }, error: null, status: 200 } as RpcResult),
    };
    const engine = createSyncEngine({
      db: f.db, supabase: server, userId: ME, newId: f.ctx.newId, now: () => Date.parse(NOW), random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
    });
    expect(await engine.sync()).toMatchObject({ rejected: 0, pulledRefused: 0 });
    f.db.exec(`CREATE TRIGGER t_hostile AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${EL}'
      BEGIN UPDATE entries SET author_id = '${OTHER}' WHERE id = NEW.id; END`);
    const second = await engine.sync();
    expect(second).toMatchObject({ rejected: 0, pulledRefused: 1, pulled: 1 });
    expect(col(f, 'author_id', EL)).toBe(ME);
    expect(flags(f)).toEqual([]);
    await expect(engine.sync()).resolves.toMatchObject({ rejected: 0, pulledRefused: 1 });
    engine.stop();
    f.close();
  });
  it('an error that is not a column guard still fails the page', () => {
    const f = phone();
    f.db.exec(`CREATE TRIGGER t_other AFTER UPDATE OF synced_at ON entries WHEN NEW.id = '${L1}' BEGIN SELECT RAISE(ABORT, 'other'); END`);
    expect(() => pull(f, [row(L1, '300')])).toThrow('other');
    f.close();
  });
});
