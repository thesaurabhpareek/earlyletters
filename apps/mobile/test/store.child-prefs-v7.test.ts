/// <reference types="node" />
/**
 * Local schema v7 (WP-F12-02; PRD V2 F12-REQ-004): a book's own columns stay in
 * `children`; what the person on this phone chose for it (signature, reminders,
 * hide, quiet) lives in `child_member_prefs`, and moves there from every older
 * schema with no value lost. Sync still sends the signature and the reminder
 * switch as prefs.upsert, and a pulled book brings them back. Fictional Asha family only.
 */
import { describe, expect, it, vi } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { children, type RepoContext } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { applyPullPage } from '../src/lib/sync/merge';
import { enqueueBookCreate, takeBatch } from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import type { PullResponse, PushOp } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { fixture } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const NOW = '2026-10-03T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
let n = 0;
const ctx = { now: NOW, newId: () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}` };
const cols = (db: SqlDb, table: string) => db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name);

describe('[F12-REQ-004] migration 7: per-person choices move to child_member_prefs', () => {
  function atV6(): SqlDb {
    const { db } = nodeDb();
    migrate(db, ctx, MIGRATIONS.filter((m) => m.version <= 6));
    db.run("INSERT INTO children (id, name, birthday, due_date, signs_as, reminders_on, created_at, updated_at) VALUES ('c1', 'Asha', '2026-03-01', NULL, 'Mama', 1, ?, ?)", NOW, NOW);
    db.run("INSERT INTO children (id, name, birthday, due_date, signs_as, reminders_on, created_at, updated_at, hidden_at) VALUES ('c2', 'Ravi', NULL, '2027-01-10', 'Amma', 0, ?, ?, ?)", NOW, NOW, NOW);
    db.run("INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at, created_by_me, role, server_state) VALUES ('c3', 'Nila', '2025-01-01', NULL, 'Papa', ?, ?, 0, 'parent', 'synced')", NOW, NOW);
    return db;
  }

  it('every book\'s signature, reminder switch and hide move with no value lost; the app reads them from child_member_prefs only', () => {
    const db = atV6();
    expect(migrate(db, ctx)).toMatchObject({ from: 6, to: LATEST_VERSION });
    // The two old columns stay until MOB-09 exists (review L on #166; the next test), but nothing reads them.
    expect(cols(db, 'children')).toEqual(expect.arrayContaining(['signs_as', 'reminders_on']));
    expect(cols(db, 'children')).toEqual(expect.arrayContaining(['created_by', 'first_run_batch', 'hidden_at']));
    expect(db.all('SELECT child_id, signs_as, reminders_on, hidden_at, quiet_at FROM child_member_prefs ORDER BY child_id')).toEqual([
      { child_id: 'c1', signs_as: 'Mama', reminders_on: 1, hidden_at: null, quiet_at: null },
      { child_id: 'c2', signs_as: 'Amma', reminders_on: 0, hidden_at: NOW, quiet_at: null },
      { child_id: 'c3', signs_as: 'Papa', reminders_on: 1, hidden_at: null, quiet_at: null },
    ]);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM children WHERE hidden_at IS NOT NULL')!.n).toBe(0);
    const repo: RepoContext = { db, now: () => NOW, newId: ctx.newId };
    expect(children.listVisible(repo).map((c) => [c.id, c.signsAs, c.remindersOn])).toEqual([['c1', 'Mama', true], ['c3', 'Papa', true]]);
    expect(children.listHidden(repo).map((c) => [c.id, c.signsAs, c.remindersOn])).toEqual([['c2', 'Amma', false]]);
  });

  /** The v6 build's books read (PR #146 db/repos/children.ts, COLS and LISTED), word for word. */
  const V6_BOOKS =
    "SELECT id, name, birthday, due_date, signs_as, reminders_on, family_can_read, role, created_by_me FROM children WHERE hidden_at IS NULL AND server_state NOT IN ('left', 'deleted') ORDER BY created_at ASC, id ASC";

  it('[review L on #166] a v6 build (build 1) opening a v7 file still reads its books, with the current signature and reminder choice (until MOB-09 ships)', () => {
    const db = atV6();
    migrate(db, ctx);
    const repo: RepoContext = { db, now: () => NOW, newId: ctx.newId };
    const v6 = () => db.all<{ id: string; signs_as: string; reminders_on: number }>(V6_BOOKS).map((r) => [r.id, r.signs_as, r.reminders_on]);
    // Every book is listed: a hide is per person now, so a book hidden here (c2) shows again on the older build. Nothing is lost.
    expect(v6()).toEqual([['c1', 'Mama', 1], ['c2', 'Amma', 0], ['c3', 'Papa', 1]]);
    // Books made, and choices changed, by the v7 build are mirrored into the kept columns.
    children.insert(repo, 'c4', { name: 'Tara', birthday: '2026-08-01', dueDate: null, signsAs: 'Mum' });
    expect(children.update(repo, 'c1', { signsAs: 'Mummy', remindersOn: false })).toBe(true);
    expect(v6()).toEqual([['c1', 'Mummy', 0], ['c2', 'Amma', 0], ['c3', 'Papa', 1], ['c4', 'Mum', 1]]);
    // And the v7 build reads only child_member_prefs: a stale mirror never reaches a screen.
    db.run("UPDATE children SET signs_as = 'stale' WHERE id = 'c1'");
    expect(children.get(repo, 'c1')?.signsAs).toBe('Mummy');
  });

  it('a phone that already signed in records itself as the creator of the books it started', () => {
    const db = atV6();
    db.run("UPDATE children SET created_by_me = 1, role = 'parent' WHERE id = 'c1'");
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    migrate(db, ctx);
    expect(db.all('SELECT id, created_by FROM children ORDER BY id')).toEqual([
      { id: 'c1', created_by: ME }, { id: 'c2', created_by: null }, { id: 'c3', created_by: null },
    ]);
  });

  it('queues nothing: no book changed for the server', () => {
    const db = atV6();
    migrate(db, ctx);
    expect(db.all('SELECT * FROM sync_outbox')).toEqual([]);
  });
});

describe('per-person choices on the current schema', () => {
  it('hide and quiet are this person\'s; the book itself is unchanged; both are reversible', () => {
    const f = fixture();
    children.insert(f.ctx, 'c1', { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    children.hide(f.ctx, 'c1');
    expect(children.listVisible(f.ctx)).toEqual([]);
    expect(children.listHidden(f.ctx).map((c) => c.id)).toEqual(['c1']);
    children.unhide(f.ctx, 'c1');
    children.setQuiet(f.ctx, 'c1', true);
    expect(children.get(f.ctx, 'c1')).toMatchObject({ id: 'c1', name: 'Asha', quiet: true });
    children.setQuiet(f.ctx, 'c1', false);
    expect(children.get(f.ctx, 'c1')).not.toHaveProperty('quiet');
    expect(f.db.get('SELECT hidden_at FROM children WHERE id = ?', 'c1')).toEqual({ hidden_at: null });
    f.close();
  });

  it('signed in, hide and quiet queue nothing, and a signature change sends only the two server fields (review of #166)', async () => {
    const store = await import('../src/lib/store');
    const h = nodeDb();
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId: ctx.newId }).ok).toBe(true);
    const id = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    takeOwnership(h.db, ME, ctx);
    h.db.run('DELETE FROM sync_outbox');
    store.hideChild(id);
    store.unhideChild(id);
    store.setChildQuiet(id, true);
    expect(h.db.all('SELECT type FROM sync_outbox')).toEqual([]);
    store.updateChild(id, { signsAs: 'Amma' });
    const payloads = h.db.all<{ type: string; payload: string }>('SELECT type, payload FROM sync_outbox');
    for (const p of payloads.filter((x) => x.type === 'prefs.upsert')) {
      for (const k of Object.keys((JSON.parse(p.payload) as PushOp).data)) expect(['signs_as', 'include_in_reminders']).toContain(k);
    }
    expect(payloads.some((x) => x.type === 'prefs.upsert')).toBe(true);
    store.closeStore();
    h.close();
  });

  it('a new book after sign-in sends its creation and my signature from child_member_prefs, and marks me its creator', () => {
    const f = fixture();
    takeOwnership(f.db, ME, ctx);
    children.insert(f.ctx, 'c9', { name: 'Leo', birthday: '2026-09-01', dueDate: null, signsAs: 'Mummy' });
    f.db.transaction(() => enqueueBookCreate(f.db, 'c9', ctx));
    const ops = takeBatch(f.db, { now: NOW }).ops as PushOp[];
    expect(ops.map((o) => [o.type, o.data])).toEqual([
      ['book.create', { name: 'Leo', date_of_birth: '2026-09-01', due_date: null }],
      ['prefs.upsert', { signs_as: 'Mummy', include_in_reminders: true }],
    ]);
    expect(f.db.get('SELECT created_by FROM children WHERE id = ?', 'c9')).toEqual({ created_by: ME });
    f.close();
  });

  it('the first sign-in sends first-run books in one batch, records that batch on each, and their signatures', () => {
    const f = fixture();
    children.insert(f.ctx, 'c1', { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    f.db.run("UPDATE children SET id = '0199a000-0000-7000-8000-0000000000a1' WHERE id = 'c1'");
    f.db.run("UPDATE child_member_prefs SET child_id = '0199a000-0000-7000-8000-0000000000a1' WHERE child_id = 'c1'");
    takeOwnership(f.db, ME, ctx);
    const ops = takeBatch(f.db, { now: NOW }).ops as PushOp[];
    expect(ops.map((o) => o.type)).toEqual(['book.first_run', 'prefs.upsert']);
    expect(ops[1].data).toEqual({ signs_as: 'Mama', include_in_reminders: true });
    expect(f.db.get('SELECT first_run_batch, created_by FROM children')).toEqual({ first_run_batch: ops[0].id, created_by: ME });
    f.close();
  });

  it('a pulled book brings my signature and reminder switch into child_member_prefs; hide and quiet stay as I set them', () => {
    const f = fixture();
    takeOwnership(f.db, ME, ctx);
    const page = (signs: string, reminders: boolean): PullResponse => ({
      reset: false, epoch: 1, epoch_started_at: NOW, more: false, gone: [],
      books: [{
        id: 'b1', access: 'parent', repull: false, meta_hash: signs, rows: [], cursor: '9:00000000-0000-0000-0000-000000000000', more: false,
        meta: { role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
          created_by_me: false, my_signs_as: signs, include_in_reminders: reminders, members: [] },
      }],
    });
    f.db.transaction(() => applyPullPage(f.db, page('Papa', true), NOW));
    expect(children.get(f.ctx, 'b1')).toMatchObject({ name: 'Asha', signsAs: 'Papa', remindersOn: true, createdByMe: false });
    children.setQuiet(f.ctx, 'b1', true);
    f.db.transaction(() => applyPullPage(f.db, page('Dada', false), NOW));
    expect(children.get(f.ctx, 'b1')).toMatchObject({ signsAs: 'Dada', remindersOn: false, quiet: true });
    f.close();
  });
});
