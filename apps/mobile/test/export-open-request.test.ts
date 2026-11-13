/**
 * BL-446, DATA-REQ-053 (P0): "Export works for everything not yet purged, including letters tombstoned by the request."
 *
 * A sole parent's deletion request tombstones her letters and closes her book on the server. The next pull (the real
 * merge, below) puts the letters in Recently deleted and unlists the book. Before the fix, Export read only listed
 * books and letters that were not deleted, so a person in the 30-day grace period who tapped Export got a file with
 * nothing in it. Now, while a request is open, the export also reads the closed book and the Recently deleted letters;
 * after Cancel (or with no request) it is as before. Runs the real repositories, the real merge and the real planner.
 * Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { children, entries, settings } from '../src/lib/db/repos';
import { applyPullPage } from '../src/lib/sync/merge';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';
import { OPEN_REQUEST_KEY, readOpenRequest, writeOpenRequest, type OpenRequest } from '../src/lib/account-deletion/open-request';
import type { FlagStore } from '../src/lib/account-deletion/api';
import { dataFiles, planExport, type SnapshotChild, type SnapshotEntry } from '../src/lib/export/build.logic';
import { deletionRequestOpen, exportScope } from '../src/lib/export/scope.logic';
import { fixture } from './helpers/store-fixture';
import { ashaSnapshot } from './helpers/asha-export';

const NOW = '2026-10-30T09:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const WHEN = '2026-11-29T09:00:00.000Z';
const SCHEDULED: OpenRequest = { state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: 'auth-1' };
const ME = '11111111-1111-1111-1111-111111111111';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';
const L1 = '0199a5b0-0000-7000-8000-0000000000b1';
const L2 = '0199a5b0-0000-7000-8000-0000000000b2';

const ownRow = (id: string, deletedAt: string | null): PulledRow => ({
  id, child_id: ASHA, author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-20', captured_at: '2026-10-20T08:00:00.000Z',
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: `You laughed at the rain ${id.slice(-2)}.`,
  machine_edits: [], final_text: `You laughed at the rain ${id.slice(-2)}.`, in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  language: 'en', created_at: '2026-10-20T08:00:00.000Z', updated_at: deletedAt ?? '2026-10-20T08:00:00.000Z', deleted_at: deletedAt, own: true, v: '100',
});

const bookPage = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW,
  books: [{
    id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', cursor: '100:00000000-0000-0000-0000-000000000000', more: false, rows,
    meta: {
      role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
      created_by_me: true, my_signs_as: 'Mama', include_in_reminders: true,
      members: [{ profile_id: ME, role: 'parent', is_me: true, joined_at: NOW, signs_as: null }],
    },
  }],
  gone: [],
});
const gonePage = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW, books: [],
  gone: [{ id: ASHA, reason: 'deleted', rows, cursor: '200:00000000-0000-0000-0000-000000000000', more: false }],
});

/** Mama's phone after the request: pulled with two letters, then the pull that the request caused. */
function phoneAfterRequest() {
  const f = fixture();
  f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  f.db.transaction(() => applyPullPage(f.db, bookPage([ownRow(L1, null), ownRow(L2, null)]), NOW));
  f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
  const flags: FlagStore = {
    get: (k) => settings.getSetting(f.ctx, k),
    set: (k, v) => settings.setSetting(f.ctx, k, v),
    remove: (k) => f.db.run('DELETE FROM settings WHERE key = ?', k),
  };
  const open = (userId: string | null = 'auth-1') => deletionRequestOpen(readOpenRequest(flags), userId, NOW_MS);
  /** What device.ts reads, on the real repositories. */
  const scope = (requestOpen: boolean) =>
    exportScope(
      {
        listed: () => children.listVisible(f.ctx),
        hidden: () => children.listHidden(f.ctx),
        closedByServer: () => children.listClosedByServer(f.ctx),
        live: (id) => entries.listForChild(f.ctx, id),
        deleted: (id) => entries.listDeletedForChild(f.ctx, id),
      },
      requestOpen,
    );
  /** The ids that end up in data/entries.json, through the real planner. */
  const exported = async (requestOpen: boolean): Promise<string[]> => {
    const s = scope(requestOpen);
    const base = ashaSnapshot();
    const kids: SnapshotChild[] = s.map((b) => ({ ...b.book, hidden: b.hidden, role: 'parent' as const }));
    const rows: SnapshotEntry[] = s.flatMap((b) => b.letters.map((e) => ({ ...e, childId: e.childId ?? b.book.id, own: true, audioOnPhone: false, audioSizeOnPhone: null })));
    const snap = { ...base, children: kids, entries: rows, waiting: [], otherVersions: [] };
    const { files } = await dataFiles(snap, planExport(snap), new Map(), async (t) => `sha-${t.length}`);
    const file = files.find((t) => t.path === 'data/entries.json');
    return (JSON.parse(file?.text ?? '{}').entries ?? []).map((e: { id: string }) => e.id).sort();
  };
  return { f, flags, open, scope, exported };
}

describe('[BL-446] export while an account-deletion request is open', () => {
  it('the situation: after the request\'s pull the book is unlisted and both letters are in Recently deleted', () => {
    const { f } = phoneAfterRequest();
    expect(children.listVisible(f.ctx)).toEqual([]);
    expect(entries.listForChild(f.ctx, ASHA)).toEqual([]);
    expect(entries.listDeletedForChild(f.ctx, ASHA).map((e) => e.id).sort()).toEqual([L1, L2]);
    f.close();
  });

  it('with no request noted, the export is as it always was: nothing from a closed book (the old behaviour, still the rule when no request is open)', async () => {
    const { f, open, exported } = phoneAfterRequest();
    expect(open()).toBe(false);
    expect(await exported(open())).toEqual([]);
    f.close();
  });

  it('with the request open, the export holds the book and every letter the request tombstoned (DATA-REQ-053)', async () => {
    const { f, flags, open, scope, exported } = phoneAfterRequest();
    writeOpenRequest(flags, SCHEDULED);
    expect(open()).toBe(true);
    expect(scope(open()).map((b) => b.book.id)).toEqual([ASHA]);
    expect(await exported(open())).toEqual([L1, L2]);
    f.close();
  });

  it('a held request and one that is executing count as open; a cancelled one does not; another account\'s note does not', () => {
    const { f, flags, open } = phoneAfterRequest();
    writeOpenRequest(flags, { ...SCHEDULED, state: 'held' });
    expect(open()).toBe(true);
    writeOpenRequest(flags, { state: 'executing', requestId: 'req-1', scheduledFor: WHEN, userId: 'auth-1' });
    expect(open()).toBe(true);
    expect(open('auth-2')).toBe(false);
    expect(open(null)).toBe(true); // signed out: the note stands (it is how the phone says "sign in to cancel")
    writeOpenRequest(flags, { state: 'cancelled', at: NOW, userId: 'auth-1' });
    expect(open()).toBe(false);
    writeOpenRequest(flags, null);
    expect(flags.get(OPEN_REQUEST_KEY)).toBeNull();
    expect(open()).toBe(false);
    f.close();
  });

  it('after Cancel the book is listed again, its letters are back where they were, and they export once (not twice)', async () => {
    const { f, flags, open, exported } = phoneAfterRequest();
    writeOpenRequest(flags, SCHEDULED);
    // Cancel: the server restores the book and letters; the next pull brings them back live.
    writeOpenRequest(flags, null);
    f.db.run("UPDATE children SET server_state = 'synced' WHERE id = ?", ASHA);
    f.db.run('UPDATE entries SET deleted_at = NULL WHERE child_id = ?', ASHA);
    expect(children.listVisible(f.ctx).map((b) => b.id)).toEqual([ASHA]);
    expect(open()).toBe(false);
    expect(await exported(open())).toEqual([L1, L2]);
    // Even if a stale note were still there, a listed book is not read twice.
    writeOpenRequest(flags, SCHEDULED);
    expect(await exported(open())).toEqual([L1, L2]);
    f.close();
  });

  it('a book the person left (not closed by the server) is not pulled in by an open request', async () => {
    const { f, flags, open, exported } = phoneAfterRequest();
    f.db.run("UPDATE children SET server_state = 'left' WHERE id = ?", ASHA);
    writeOpenRequest(flags, SCHEDULED);
    expect(await exported(open())).toEqual([]);
    f.close();
  });

  it('the app\'s export reads through the scope, not around it (device.ts)', () => {
    const src = readFileSync(join(__dirname, '../src/lib/export/device.ts'), 'utf8');
    expect(src).toContain('exportScope(');
    expect(src).toContain('deletionRequestOpen(readOpenRequest(');
    expect(src).not.toMatch(/listEntriesForChild\(c\.id\)/);
  });
});
