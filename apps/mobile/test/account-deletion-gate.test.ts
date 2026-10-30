/// <reference types="node" />
/**
 * The deletion screen's gate (coordinator D-117; critics' pass 30 Oct 2026, M1). A request to delete the account
 * tombstones a sole parent's book with the rest of her letters; the next pull returns that book as gone ("deleted"); the
 * phone stops listing it; and with no listed book the app drew the first-run welcome: no Settings, no Delete account, no
 * "Cancel deletion". These tests pin the answer, each at the level where the bug lives:
 *  - the pure model (lib/account-deletion/open-request.ts): the note, its transitions and the screen choice, including
 *    that the welcome (and so "Begin the book") is never the answer while a request is open;
 *  - merge.ts: a pull that closes the book as "deleted" on a phone with an open request leaves the phone on the
 *    deletion screen, a co-parent's phone (whose book is not closed) on the app, and a cancelled request's pull brings
 *    the book back and lists it;
 *  - the screens' source: the welcome route asks the gate first, and the deletion screen offers only what it was ruled
 *    to offer.
 * The real SQL (request, pull, cancel, pull) is in test/account-deletion-two-phone.test.ts.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { accountDeletionCopy as c } from '@scribe/content';
import { children, settings } from '../src/lib/db/repos';
import { applyPullPage } from '../src/lib/sync/merge';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';
import {
  CANCELLED_WAIT_MS, chooseScreen, countedNote, deletionView, liveNote, NOTE_GRACE_MS, noteAfterCancel, noteAfterRead, noteExpiresAtMs,
  noteIsDead, noteIsStale, noteOfAccount, noteWithBook, OPEN_REQUEST_KEY,
  openRequestOf, parseOpenRequest, readOpenRequest, writeOpenRequest, type OpenRequest, type PhoneScreen,
} from '../src/lib/account-deletion/open-request';
import { decideGate, type GateInputs } from '../src/lib/account-deletion/first-run-gate.logic';
import { parseStatus } from '../src/lib/account-deletion/logic';
import type { FlagStore } from '../src/lib/account-deletion/api';
import { fixture } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const NOW = '2026-10-30T09:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const WHEN = '2026-11-29T09:00:00.000Z';
const SCHEDULED: OpenRequest = { state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN };
const HELD: OpenRequest = { state: 'held', requestId: 'req-1', scheduledFor: WHEN };
const EXECUTING: OpenRequest = { state: 'executing', requestId: 'req-1' };
/** An executing request as the server's row now gives it: with the request's own date. */
const EXECUTING_DATED: OpenRequest = { state: 'executing', requestId: 'req-1', scheduledFor: WHEN };
const CANCELLED: OpenRequest = { state: 'cancelled', at: NOW };

function memoryFlags(): FlagStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v), remove: (k) => void map.delete(k) };
}

describe('the note: what the phone remembers of an open request', () => {
  it('round-trips each shape, and reads nothing else', () => {
    for (const n of [SCHEDULED, HELD, EXECUTING, EXECUTING_DATED, CANCELLED, { ...CANCELLED, userId: 'user-mama' }, { ...EXECUTING_DATED, userId: 'user-mama' }]) {
      expect(parseOpenRequest(JSON.stringify(n))).toEqual(n);
    }
    for (const bad of [null, '', 'x', '{}', '[]', '{"state":"scheduled"}', '{"state":"scheduled","requestId":"r"}', '{"state":"scheduled","requestId":"r","scheduledFor":"soon"}',
      '{"state":"open","requestId":"r","scheduledFor":"2026-11-29T09:00:00.000Z"}', '{"state":"cancelled"}', '{"state":"executing"}']) {
      expect(parseOpenRequest(bad), String(bad)).toBeNull();
    }
  });

  it('is written only when it changes, and cleared by null', () => {
    const f = memoryFlags();
    const set = vi.spyOn(f, 'set');
    writeOpenRequest(f, SCHEDULED);
    writeOpenRequest(f, SCHEDULED);
    expect(set).toHaveBeenCalledTimes(1);
    expect(readOpenRequest(f)).toEqual(SCHEDULED);
    writeOpenRequest(f, null);
    expect(f.map.has(OPEN_REQUEST_KEY)).toBe(false);
    expect(readOpenRequest(f)).toBeNull();
  });

  it('holds only the request: no name, no letter, no child (the value is the server\'s own id and date)', () => {
    const f = memoryFlags();
    writeOpenRequest(f, SCHEDULED);
    expect(JSON.parse(f.map.get(OPEN_REQUEST_KEY)!)).toEqual({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN });
  });

  it('follows what the server says about the open request', () => {
    const phone = { hasBook: false, hasDeletedBook: true, nowIso: NOW };
    const open = { state: 'scheduled' as const, requestId: 'req-2', scheduledFor: WHEN };
    expect(openRequestOf({ state: 'none' })).toBeNull();
    expect(openRequestOf(open)).toEqual({ state: 'scheduled', requestId: 'req-2', scheduledFor: WHEN });
    expect(openRequestOf({ state: 'executing', requestId: 'req-2' })).toEqual({ state: 'executing', requestId: 'req-2' });
    // An executing row carries the request's own date, which is what dates the note.
    expect(openRequestOf({ state: 'executing', requestId: 'req-2', scheduledFor: WHEN })).toEqual({ state: 'executing', requestId: 'req-2', scheduledFor: WHEN });
    expect(parseStatus([{ id: 'req-2', status: 'executing', scheduled_for: WHEN }])).toEqual({ state: 'executing', requestId: 'req-2', scheduledFor: WHEN });
    // A request found replaces whatever was remembered (a second phone, a sign-in again).
    expect(noteAfterRead(null, open, phone)).toEqual({ state: 'scheduled', requestId: 'req-2', scheduledFor: WHEN });
    expect(noteAfterRead(CANCELLED, open, phone)).toEqual({ state: 'scheduled', requestId: 'req-2', scheduledFor: WHEN });
    // None found: nothing was open, nothing is remembered; a cancelled wait is left to be the wait it is.
    expect(noteAfterRead(null, { state: 'none' }, phone)).toBeNull();
    expect(noteAfterRead(CANCELLED, { state: 'none' }, phone)).toEqual(CANCELLED);
  });

  it('[S-B] a request that was open and is gone (cancelled on another phone) leaves a phone whose book the server closed waiting for it, and never the welcome', () => {
    const closed = { hasBook: false, hasDeletedBook: true, nowIso: NOW };
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, closed)).toEqual({ state: 'cancelled', at: NOW });
    expect(noteAfterRead(HELD, { state: 'none' }, closed)).toEqual({ state: 'cancelled', at: NOW });
    // A phone that still lists a book has nothing to wait for.
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, { ...closed, hasBook: true })).toBeNull();
  });

  it('[S-B] with no closed book on the phone nothing is coming back: a none-read clears the note and the screen is the welcome, never "on their way back"', () => {
    const nothingToRestore = { hasBook: false, hasDeletedBook: false, nowIso: NOW };
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, nothingToRestore)).toBeNull();
    expect(noteAfterRead(HELD, { state: 'none' }, nothingToRestore)).toBeNull();
    expect(chooseScreen({ hasBook: false, note: noteAfterRead(SCHEDULED, { state: 'none' }, nothingToRestore), nowMs: NOW_MS, signedIn: true, hasDeletedBook: false, checked: true })).toBe('welcome');
    // An executing note whose request is gone is over, not cancelled.
    expect(noteAfterRead(EXECUTING_DATED, { state: 'none' }, { ...nothingToRestore, hasDeletedBook: true })).toBeNull();
  });

  it('a note belongs to the account that was asked: another account signing in on the phone does not inherit it', () => {
    const mine = { state: 'scheduled' as const, requestId: 'req-1', scheduledFor: WHEN, userId: 'user-mama' };
    expect(openRequestOf({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN }, 'user-mama')).toEqual(mine);
    expect(parseOpenRequest(JSON.stringify(mine))).toEqual(mine);
    // The same account finds its request gone: cancelled elsewhere, so the phone waits for its book.
    const closed = { hasBook: false, hasDeletedBook: true, nowIso: NOW };
    expect(noteAfterRead(mine, { state: 'none' }, { ...closed, userId: 'user-mama' })).toEqual({ state: 'cancelled', at: NOW, userId: 'user-mama' });
    // Another account finds nothing open for itself: the note was never about it, so it goes (no "your book is coming back").
    expect(noteAfterRead(mine, { state: 'none' }, { ...closed, userId: 'user-papa' })).toBeNull();
    // An account that does have a request open replaces the note.
    expect(noteAfterRead(mine, { state: 'scheduled', requestId: 'req-7', scheduledFor: WHEN }, { ...closed, userId: 'user-papa' }))
      .toEqual({ state: 'scheduled', requestId: 'req-7', scheduledFor: WHEN, userId: 'user-papa' });
  });

  it('a cancel leaves a sole parent waiting for her book and a co-parent with nothing', () => {
    expect(noteAfterCancel({ hasBook: false }, NOW)).toEqual({ state: 'cancelled', at: NOW });
    expect(noteAfterCancel({ hasBook: false, userId: 'user-mama' }, NOW)).toEqual({ state: 'cancelled', at: NOW, userId: 'user-mama' });
    expect(noteAfterCancel({ hasBook: true }, NOW)).toBeNull();
    expect(noteWithBook(CANCELLED)).toBeNull();
    expect(noteWithBook(SCHEDULED)).toEqual(SCHEDULED); // an open request is still open, and can still be cancelled
    expect(noteWithBook(null)).toBeNull();
  });

  it('a cancelled wait that has outlasted the pull it was waiting for no longer holds anything back', () => {
    expect(liveNote(CANCELLED, NOW_MS + CANCELLED_WAIT_MS)).toEqual(CANCELLED);
    expect(liveNote(CANCELLED, NOW_MS + CANCELLED_WAIT_MS + 1)).toBeNull();
    expect(liveNote(SCHEDULED, NOW_MS + 400 * 86_400_000)).toEqual(SCHEDULED); // an open request has no time limit
  });
});

describe('the screen choice (welcome vs the app vs the deletion screen)', () => {
  const base = { nowMs: NOW_MS, signedIn: true, hasDeletedBook: false, checked: false };

  it('a phone with a book is the app, whatever the note says (a co-parent\'s book is not closed by the request)', () => {
    for (const note of [null, SCHEDULED, HELD, EXECUTING, CANCELLED]) expect(chooseScreen({ ...base, hasBook: true, note })).toBe('app');
  });

  it('a phone with no book and an open request is the deletion screen, from every state of it', () => {
    for (const note of [SCHEDULED, HELD, EXECUTING, CANCELLED]) {
      expect(chooseScreen({ ...base, hasBook: false, note })).toBe('deletion');
      expect(chooseScreen({ ...base, hasBook: false, note, signedIn: false })).toBe('deletion');
    }
  });

  it('a phone with no book and nothing open is the first-run welcome', () => {
    expect(chooseScreen({ ...base, hasBook: false, note: null })).toBe('welcome');
    expect(chooseScreen({ ...base, hasBook: false, note: null, signedIn: false })).toBe('welcome');
  });

  it('PIN: the welcome, and so "Begin the book", is never the answer while a request is open and no book is listed', () => {
    const answers = new Set<PhoneScreen>();
    for (const note of [SCHEDULED, HELD, EXECUTING, EXECUTING_DATED, CANCELLED]) {
      for (const signedIn of [true, false]) {
        for (const hasDeletedBook of [true, false]) {
          for (const checked of [true, false]) {
            for (const confirmed of [true, false]) {
              // The note names the account signed in, so it is hers and counts.
              const userId = signedIn ? 'user-mama' : null;
              answers.add(chooseScreen({ hasBook: false, note: { ...note, userId: 'user-mama' }, nowMs: NOW_MS, signedIn, hasDeletedBook, checked, userId, confirmed }));
              answers.add(chooseScreen({ hasBook: false, note, nowMs: NOW_MS, signedIn, hasDeletedBook, checked }));
            }
          }
        }
      }
    }
    expect([...answers]).toEqual(['deletion']);
  });

  it('a book the server closed, signed in, with the server not yet asked, waits on paper, not on the welcome', () => {
    expect(chooseScreen({ ...base, hasBook: false, note: null, hasDeletedBook: true })).toBe('checking');
    // Asked (answered, failed or timed out), or signed out, or no such book: the welcome, as before.
    expect(chooseScreen({ ...base, hasBook: false, note: null, hasDeletedBook: true, checked: true })).toBe('welcome');
    expect(chooseScreen({ ...base, hasBook: false, note: null, hasDeletedBook: true, signedIn: false })).toBe('welcome');
    expect(chooseScreen({ ...base, hasBook: false, note: null, hasDeletedBook: false })).toBe('welcome');
  });

  it('a cancelled wait that has run out is a phone with no book: the welcome', () => {
    expect(chooseScreen({ ...base, hasBook: false, note: CANCELLED, nowMs: NOW_MS + CANCELLED_WAIT_MS + 1 })).toBe('welcome');
  });
});

describe('the deletion screen: one title, the date, Cancel deletion, a way to sign out, and nothing else', () => {
  const o = { signedIn: true, date: 'November 29, 2026', tryAgainLabel: 'Try again' };

  it('scheduled and signed in: the scheduled page\'s own words, Cancel deletion first, Sign out of this phone beneath', () => {
    const v = deletionView(SCHEDULED, o);
    expect(v.title).toBe(c.scheduled.heading);
    expect(v.body).toBe('Your account will be deleted on November 29, 2026. You can cancel any time before then, here or by signing in again.');
    expect(v.actions).toEqual(['cancel', 'signOut']);
    expect(v.labels.cancel).toBe(c.scheduled.cancelButton);
    expect(v.labels.signOut).toBe(c.scheduled.doneButton);
    expect(deletionView(HELD, o)).toEqual(v);
  });

  it('signed out: it still says the request is open, with the date, and offers Sign in (the way to cancel)', () => {
    const v = deletionView(SCHEDULED, { ...o, signedIn: false });
    expect(v.body).toBe('Your account will be deleted on November 29, 2026. Sign in to cancel the deletion.');
    expect(v.actions).toEqual(['signIn']);
    expect(v.labels.signIn).toBe(c.signedOut.button);
  });

  it('[M-A] executing: it only explains (nothing can be cancelled any more) but is never a dead end: Sign out, or Sign in when signed out', () => {
    expect(deletionView(EXECUTING, o)).toMatchObject({ title: c.open.executingTitle, body: c.executing, actions: ['signOut'] });
    expect(deletionView(EXECUTING, { ...o, signedIn: false })).toMatchObject({ actions: ['signIn'] });
    expect(deletionView(EXECUTING_DATED, o).actions).toEqual(['signOut']);
    expect(deletionView(EXECUTING, o).labels.signOut).toBe(c.scheduled.doneButton);
    expect(deletionView(EXECUTING, { ...o, signedIn: false }).labels.signIn).toBe(c.signedOut.button);
  });

  it('[M-A] PIN: no state of the deletion screen, signed in or out, is without a button', () => {
    for (const note of [SCHEDULED, HELD, EXECUTING, EXECUTING_DATED, CANCELLED]) {
      for (const signedIn of [true, false]) expect(deletionView(note, { ...o, signedIn }).actions.length, `${note.state} signedIn=${signedIn}`).toBeGreaterThan(0);
    }
  });

  it('cancelled: it says the book is coming back and offers Try again (a pull), or Sign in when signed out', () => {
    expect(deletionView(CANCELLED, o)).toMatchObject({ title: c.open.restoringTitle, body: c.open.restoringBody, actions: ['retry'] });
    expect(deletionView(CANCELLED, { ...o, signedIn: false }).actions).toEqual(['signIn']);
  });

  it('never offers a way to a book, Settings or the welcome, and its words obey the content rules', () => {
    for (const note of [SCHEDULED, HELD, EXECUTING, EXECUTING_DATED, CANCELLED]) {
      for (const signedIn of [true, false]) {
        const v = deletionView(note, { ...o, signedIn });
        expect(v.actions.every((a) => ['cancel', 'signOut', 'signIn', 'retry'].includes(a))).toBe(true);
        for (const text of [v.title, v.body, ...v.actions.map((a) => v.labels[a])]) {
          expect(text).not.toMatch(/Begin the book|I already have a book|I was invited|Settings/);
          expect(text).not.toMatch(/[–—‘’“”…]/);
          expect(text).not.toMatch(/\b(she|he|her|him|his|hers)\b/i);
        }
      }
    }
  });
});

// ── merge.ts: what a pull does to a phone with an open request ────────────────────────────────────────────────────

const ME = '11111111-1111-1111-1111-111111111111';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';

const ownRow = (id: string, deletedAt: string | null): PulledRow => ({
  id, child_id: ASHA, author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-20', captured_at: '2026-10-20T08:00:00.000Z',
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'You laughed at the rain.',
  machine_edits: [], final_text: 'You laughed at the rain.', in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  language: 'en', created_at: '2026-10-20T08:00:00.000Z', updated_at: deletedAt ?? '2026-10-20T08:00:00.000Z', deleted_at: deletedAt, own: true, v: '100',
});

const meta = (members: { is_me: boolean; role: 'parent' | 'contributor' }[]) => ({
  role: 'parent' as const, name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
  created_by_me: true, my_signs_as: 'Mama', include_in_reminders: true,
  members: members.map((m, i) => ({ profile_id: i === 0 ? ME : `22222222-2222-2222-2222-22222222222${i}`, role: m.role, is_me: m.is_me, joined_at: NOW, signs_as: null })),
});

const bookPage = (members: Parameters<typeof meta>[0], rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW,
  books: [{ id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', meta: meta(members), rows, cursor: '100:00000000-0000-0000-0000-000000000000', more: false }],
  gone: [],
});

const gonePage = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW, books: [],
  gone: [{ id: ASHA, reason: 'deleted', rows, cursor: '200:00000000-0000-0000-0000-000000000000', more: false }],
});

/** A phone that has pulled Asha's book with two letters, signed in as Mama. */
function mamasPhone() {
  const f = fixture();
  f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  const L1 = '0199a5b0-0000-7000-8000-0000000000b1';
  const L2 = '0199a5b0-0000-7000-8000-0000000000b2';
  f.db.transaction(() => applyPullPage(f.db, bookPage([{ is_me: true, role: 'parent' }], [ownRow(L1, null), ownRow(L2, null)]), NOW));
  expect(children.listVisible(f.ctx).map((b) => b.id)).toEqual([ASHA]);
  const flags: FlagStore = {
    get: (k) => settings.getSetting(f.ctx, k),
    set: (k, v) => settings.setSetting(f.ctx, k, v),
    remove: (k) => f.db.run('DELETE FROM settings WHERE key = ?', k),
  };
  const hasDeleted = () => f.db.get("SELECT 1 AS x FROM children WHERE server_state = 'deleted' LIMIT 1") !== null;
  const screen = (o: { signedIn?: boolean; checked?: boolean } = {}) =>
    chooseScreen({
      hasBook: children.listVisible(f.ctx).length > 0, note: readOpenRequest(flags), nowMs: NOW_MS,
      signedIn: o.signedIn ?? true, hasDeletedBook: hasDeleted(), checked: o.checked ?? false,
    });
  return { f, flags, L1, L2, screen };
}

describe('[M1] merge.ts: a sole parent\'s book closed by her request', () => {
  it('BEFORE the fix, in words: a pull that closes the book leaves a phone with no listed book (the welcome\'s condition)', () => {
    const { f, L1, L2 } = mamasPhone();
    f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
    expect(f.db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', ASHA)).toEqual({ server_state: 'deleted' });
    expect(children.listVisible(f.ctx)).toEqual([]);
    // Her letters are in Recently deleted (deleted_at set), kept on the phone.
    expect(f.db.all('SELECT id FROM entries WHERE deleted_at IS NOT NULL')).toHaveLength(2);
    f.close();
  });

  it('with the request noted, the closed book leaves the phone on the deletion screen, not the welcome', () => {
    const { f, flags, L1, L2, screen } = mamasPhone();
    writeOpenRequest(flags, SCHEDULED); // what use-account-deletion writes when the request is answered
    expect(screen()).toBe('app'); // before the pull the book is still listed
    f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
    expect(children.listVisible(f.ctx)).toEqual([]);
    expect(screen()).toBe('deletion');
    expect(screen({ signedIn: false })).toBe('deletion');
    f.close();
  });

  it('a phone with no note (another phone of the same account) waits on paper until the server is asked, then follows the answer', () => {
    const { f, flags, L1, L2, screen } = mamasPhone();
    f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
    expect(screen()).toBe('checking'); // never the welcome while it is not known
    // The server answers that a request is open: noted, deletion screen.
    writeOpenRequest(flags, noteAfterRead(readOpenRequest(flags), { state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN }, { hasBook: false, hasDeletedBook: true, nowIso: NOW }));
    expect(screen({ checked: true })).toBe('deletion');
    f.close();
  });

  it('a phone whose server read finds nothing open (the book was deleted on its own, not with the account) goes on to the welcome', () => {
    const { f, flags, L1, L2, screen } = mamasPhone();
    f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
    writeOpenRequest(flags, noteAfterRead(readOpenRequest(flags), { state: 'none' }, { hasBook: false, hasDeletedBook: true, nowIso: NOW }));
    expect(screen({ checked: true })).toBe('welcome');
    f.close();
  });

  it('[co-parent] the book is not closed: it stays in the pull, stays listed, and the phone stays on the app with Settings reachable', () => {
    const { f, flags, L1, L2, screen } = mamasPhone();
    writeOpenRequest(flags, SCHEDULED);
    // The server keeps the shared book, hides Mama's letters from the co-parent and tombstones them for her (deleted_at set).
    const shared = bookPage([{ is_me: true, role: 'parent' }, { is_me: false, role: 'parent' }], [ownRow(L1, NOW), ownRow(L2, NOW)]);
    f.db.transaction(() => applyPullPage(f.db, shared, NOW));
    expect(f.db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', ASHA)).toEqual({ server_state: 'synced' });
    expect(children.listVisible(f.ctx).map((b) => b.id)).toEqual([ASHA]);
    expect(screen()).toBe('app');
    // Her letters wait in Recently deleted, as the page said.
    expect(f.db.all('SELECT id FROM entries WHERE deleted_at IS NOT NULL')).toHaveLength(2);
    f.close();
  });
});

describe('[M1] merge.ts: a cancelled request brings the book back', () => {
  it('a book that returns in the pull is listed again and its letters leave Recently deleted', () => {
    const { f, flags, L1, L2, screen } = mamasPhone();
    writeOpenRequest(flags, SCHEDULED);
    f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
    expect(screen()).toBe('deletion');

    // She cancels: the phone notes it, waits for the book, and is still not the welcome.
    writeOpenRequest(flags, noteAfterCancel({ hasBook: false }, NOW));
    expect(screen()).toBe('deletion');
    expect(deletionView(readOpenRequest(flags)!, { signedIn: true, date: '', tryAgainLabel: 'Try again' }).title).toBe(c.open.restoringTitle);

    // The next pull: the server lists the book again (children.deleted_at cleared) with her letters live again.
    f.db.transaction(() => applyPullPage(f.db, bookPage([{ is_me: true, role: 'parent' }], [ownRow(L1, null), ownRow(L2, null)]), NOW));
    expect(f.db.get<{ server_state: string }>('SELECT server_state FROM children WHERE id = ?', ASHA)).toEqual({ server_state: 'synced' });
    expect(children.listVisible(f.ctx).map((b) => b.id)).toEqual([ASHA]);
    expect(f.db.all('SELECT id FROM entries WHERE deleted_at IS NOT NULL')).toEqual([]);
    expect(screen()).toBe('app');

    // And the wait is over.
    writeOpenRequest(flags, noteWithBook(readOpenRequest(flags)));
    expect(readOpenRequest(flags)).toBeNull();
    f.close();
  });
});

const MAMA_ID = '11111111-1111-1111-1111-111111111111';
const PAPA_ID = '22222222-2222-2222-2222-222222222222';
const gateBase: GateInputs = {
  hasBook: false, hasDeletedBook: false, note: null, nowMs: NOW_MS, signedIn: true, userId: MAMA_ID, checked: false, confirmed: false,
  wasDeletion: false, pathname: '/onboarding',
};

// ── M-A: a note whose date has long passed ────────────────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
/** The request's day (WHEN is 29 Nov 09:00 UTC) and the instants around the end of the grace. */
const DATE_MS = Date.parse(WHEN);
const END_OF_GRACE = DATE_MS + NOTE_GRACE_MS;

describe('[M-A] after day 30 a sole parent\'s phone is not left on the deletion screen for good', () => {
  const phone = { hasBook: false, hasDeletedBook: true, checked: true };

  it('the grace is 48 hours, twice the execution window the screen itself names ("up to a day")', () => {
    expect(NOTE_GRACE_MS).toBe(48 * 3_600_000);
    expect(c.executing).toMatch(/up to a day/);
  });

  it('a note is stale only once its date has passed by MORE than the grace; a cancelled wait and an undated note never are', () => {
    expect(noteIsStale(SCHEDULED, DATE_MS - 1)).toBe(false);
    expect(noteIsStale(SCHEDULED, DATE_MS + 1)).toBe(false); // the date has passed, the purge is running or has not run: still open
    expect(noteIsStale(SCHEDULED, END_OF_GRACE)).toBe(false);
    expect(noteIsStale(SCHEDULED, END_OF_GRACE + 1)).toBe(true);
    expect(noteIsStale(HELD, END_OF_GRACE + 1)).toBe(true);
    expect(noteIsStale(EXECUTING_DATED, END_OF_GRACE + 1)).toBe(true);
    expect(noteIsStale(EXECUTING, END_OF_GRACE + 365 * DAY)).toBe(false); // no date, nothing to measure from (it still has its exit)
    expect(noteIsStale(CANCELLED, NOW_MS + 365 * DAY)).toBe(false); // has its own wait
    expect(noteIsStale(null, END_OF_GRACE + 1)).toBe(false);
    expect(noteExpiresAtMs(SCHEDULED)).toBe(END_OF_GRACE);
    expect(noteExpiresAtMs(EXECUTING_DATED)).toBe(END_OF_GRACE);
    expect(noteExpiresAtMs(CANCELLED)).toBe(NOW_MS + CANCELLED_WAIT_MS);
    expect(noteExpiresAtMs(EXECUTING)).toBeNull();
    expect(noteExpiresAtMs(null)).toBeNull();
  });

  it('THE PROBE: signed out, no book, a scheduled note with a past date: not the deletion screen (the account no longer exists), the welcome', () => {
    const past = { ...SCHEDULED, scheduledFor: new Date(NOW_MS - 12 * DAY).toISOString() };
    expect(chooseScreen({ ...phone, note: past, nowMs: NOW_MS, signedIn: false })).toBe('welcome');
    // The same note, before the grace has run out: still the screen that says Sign in to cancel.
    const justPast = { ...SCHEDULED, scheduledFor: new Date(NOW_MS - 47 * 3_600_000).toISOString() };
    expect(chooseScreen({ ...phone, note: justPast, nowMs: NOW_MS, signedIn: false })).toBe('deletion');
    expect(deletionView(justPast, { signedIn: false, date: 'x', tryAgainLabel: 'Try again' }).actions).toEqual(['signIn']);
  });

  it('every dated state is dead after the grace when signed out, whatever the phone holds', () => {
    for (const note of [SCHEDULED, HELD, EXECUTING_DATED]) {
      for (const hasDeletedBook of [true, false]) {
        expect(chooseScreen({ ...phone, hasDeletedBook, note, nowMs: END_OF_GRACE + 1, signedIn: false }), `${note.state} deleted=${hasDeletedBook}`).toBe('welcome');
        expect(chooseScreen({ ...phone, hasDeletedBook, note, nowMs: END_OF_GRACE, signedIn: false }), `${note.state} at the end of the grace`).toBe('deletion');
      }
    }
  });

  it('a request still before its date is untouched, signed in or out, asked or not: what a live request shows does not change', () => {
    for (const signedIn of [true, false]) {
      for (const checked of [true, false]) {
        for (const note of [SCHEDULED, HELD, EXECUTING_DATED]) {
          expect(chooseScreen({ ...phone, note, nowMs: NOW_MS, signedIn, checked }), `${note.state} signedIn=${signedIn} checked=${checked}`).toBe('deletion');
          expect(chooseScreen({ ...phone, note, nowMs: DATE_MS + 3_600_000, signedIn, checked }), `${note.state} an hour past the date`).toBe('deletion');
        }
      }
    }
  });

  it('signed in, a note past the grace waits on paper while the server is asked, then follows the answer: dead unless it says the request is open (a held request)', () => {
    const at = END_OF_GRACE + 1;
    expect(chooseScreen({ ...phone, note: HELD, nowMs: at, signedIn: true, checked: false })).toBe('checking');
    expect(chooseScreen({ ...phone, note: HELD, nowMs: at, signedIn: true, checked: true, confirmed: false })).toBe('welcome'); // unreadable, or none
    expect(chooseScreen({ ...phone, note: HELD, nowMs: at, signedIn: true, checked: true, confirmed: true })).toBe('deletion');
    expect(chooseScreen({ ...phone, hasDeletedBook: false, note: HELD, nowMs: at, signedIn: true, checked: false })).toBe('checking');
  });

  it('a read that finds nothing open after the grace clears the note, even on a phone holding a closed book (no "on their way back" for a purged account)', () => {
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, { hasBook: false, hasDeletedBook: true, nowIso: new Date(END_OF_GRACE + 1).toISOString() })).toBeNull();
    expect(noteAfterRead(EXECUTING_DATED, { state: 'none' }, { hasBook: false, hasDeletedBook: true, nowIso: new Date(END_OF_GRACE + 1).toISOString() })).toBeNull();
    // Within the grace the same read is a request cancelled elsewhere, as before.
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, { hasBook: false, hasDeletedBook: true, nowIso: new Date(END_OF_GRACE).toISOString() })).toEqual({ state: 'cancelled', at: new Date(END_OF_GRACE).toISOString() });
  });

  it('the dead note is removed by the caller (an effect), decided here: signed out at once, signed in only after the server was asked and did not confirm', () => {
    const dead = { note: SCHEDULED, nowMs: END_OF_GRACE + 1, userId: null as string | null };
    expect(noteIsDead({ ...dead, signedIn: false, checked: false, confirmed: false })).toBe(true);
    expect(noteIsDead({ ...dead, signedIn: true, userId: 'u', note: { ...SCHEDULED, userId: 'u' }, checked: false, confirmed: false })).toBe(false); // the answer may confirm it
    expect(noteIsDead({ ...dead, signedIn: true, userId: 'u', note: { ...SCHEDULED, userId: 'u' }, checked: true, confirmed: false })).toBe(true);
    expect(noteIsDead({ ...dead, signedIn: true, userId: 'u', note: { ...SCHEDULED, userId: 'u' }, checked: true, confirmed: true })).toBe(false);
    // Before the end of the grace, and a note that is not there, are never dead.
    expect(noteIsDead({ ...dead, nowMs: END_OF_GRACE, signedIn: false, checked: true, confirmed: false })).toBe(false);
    expect(noteIsDead({ ...dead, note: null, signedIn: false, checked: true, confirmed: false })).toBe(false);
    // A cancelled wait that has run out is dead too (it was only ever hidden by liveNote).
    expect(noteIsDead({ note: CANCELLED, nowMs: NOW_MS + CANCELLED_WAIT_MS + 1, signedIn: false, userId: null, checked: false, confirmed: false })).toBe(true);
    expect(noteIsDead({ note: CANCELLED, nowMs: NOW_MS + CANCELLED_WAIT_MS, signedIn: false, userId: null, checked: false, confirmed: false })).toBe(false);
  });

  it('the first render never writes: decideGate only says what to clear', () => {
    const d = decideGate({ ...gateBase, note: SCHEDULED, nowMs: END_OF_GRACE + 1, signedIn: false, userId: null });
    expect(d).toMatchObject({ screen: 'welcome', request: null, clear: true, leave: false });
  });
});

// ── S-A: a note belongs to the account that was asked ─────────────────────────────────────────────────────────────────

describe('[S-A] account A asks for deletion and signs out; account B signs in on the same phone', () => {
  const notesA: OpenRequest = { ...SCHEDULED, userId: MAMA_ID };

  it('a note counts only for the account that was asked; signed out it stands; one that names no account counts for no signed-in account', () => {
    expect(noteOfAccount(notesA, MAMA_ID)).toEqual(notesA);
    expect(noteOfAccount(notesA, PAPA_ID)).toBeNull();
    expect(noteOfAccount(notesA, null)).toEqual(notesA); // signed out: "Sign in to cancel"
    expect(noteOfAccount(SCHEDULED, PAPA_ID)).toBeNull(); // names no one (none is written without one)
    expect(noteOfAccount({ ...CANCELLED, userId: MAMA_ID }, PAPA_ID)).toBeNull();
    expect(noteOfAccount(null, PAPA_ID)).toBeNull();
    expect(countedNote(notesA, PAPA_ID, NOW_MS)).toBeNull();
    expect(countedNote({ ...CANCELLED, userId: MAMA_ID }, MAMA_ID, NOW_MS + CANCELLED_WAIT_MS + 1)).toBeNull();
  });

  it('THE RACE: the status answer lands for B before B\'s consent or claim is done; the note is A\'s, so it is not B\'s, and B is never told her book is on its way back', () => {
    // userId is the session's own user (known during checkingConsent), not currentAuthUserId() (null until consent).
    const closed = { hasBook: false, hasDeletedBook: true, nowIso: NOW };
    expect(noteAfterRead(notesA, { state: 'none' }, { ...closed, userId: PAPA_ID })).toBeNull();
    // What the first-run gate had before this fix: the read was fed null, and A's note counted as B's.
    expect(noteAfterRead({ ...SCHEDULED, userId: MAMA_ID }, { state: 'none' }, { ...closed, userId: null })).toEqual({ state: 'cancelled', at: NOW });
  });

  it('B sees neither A\'s date nor A\'s Cancel deletion button: not the deletion screen, and the note is cleared', () => {
    const d = decideGate({ ...gateBase, note: notesA, userId: PAPA_ID });
    expect(d.screen).toBe('welcome');
    expect(d.request).toBeNull();
    expect(d.clear).toBe(true);
    // A cancelled wait of A's is not B's either.
    const w = decideGate({ ...gateBase, note: { ...CANCELLED, userId: MAMA_ID }, userId: PAPA_ID });
    expect(w).toMatchObject({ screen: 'welcome', request: null, clear: true });
    // With a book on the phone the note is still cleared (it would otherwise come back the day the book is lost).
    expect(decideGate({ ...gateBase, hasBook: true, note: notesA, userId: PAPA_ID })).toMatchObject({ screen: 'app', clear: true });
  });

  it('A, signed in again, still has her own note and her own screen; signed out, the note stands', () => {
    expect(decideGate({ ...gateBase, note: notesA, userId: MAMA_ID })).toMatchObject({ screen: 'deletion', request: notesA, clear: false });
    expect(decideGate({ ...gateBase, note: notesA, userId: null, signedIn: false })).toMatchObject({ screen: 'deletion', request: notesA, clear: false });
  });
});

// ── S-B: a note must not go stale unseen ──────────────────────────────────────────────────────────────────────────────

describe('[S-B] a book is listed and a request is still noted: ask once in the background', () => {
  const mine: OpenRequest = { ...SCHEDULED, userId: MAMA_ID };

  it('a signed-in phone with a book and an open note asks the server; nothing else does', () => {
    expect(decideGate({ ...gateBase, hasBook: true, note: mine }).refreshWithBook).toBe(true);
    expect(decideGate({ ...gateBase, hasBook: true, note: { ...HELD, userId: MAMA_ID } }).refreshWithBook).toBe(true);
    expect(decideGate({ ...gateBase, hasBook: true, note: { ...EXECUTING_DATED, userId: MAMA_ID } }).refreshWithBook).toBe(true);
    expect(decideGate({ ...gateBase, hasBook: true, note: null }).refreshWithBook).toBe(false);
    expect(decideGate({ ...gateBase, hasBook: true, note: { ...CANCELLED, userId: MAMA_ID } }).refreshWithBook).toBe(false); // the book is back: recordBookBack
    expect(decideGate({ ...gateBase, hasBook: true, note: mine, signedIn: false, userId: null }).refreshWithBook).toBe(false);
    expect(decideGate({ ...gateBase, hasBook: true, note: mine, userId: PAPA_ID }).refreshWithBook).toBe(false); // another account's: cleared, not asked about
  });

  it('with the book back after a cancel elsewhere, the read finds none and the note is gone, not "cancelled": no false "on their way back" the day the book is lost', () => {
    const afterRead = noteAfterRead(mine, { state: 'none' }, { hasBook: true, hasDeletedBook: false, nowIso: NOW, userId: MAMA_ID });
    expect(afterRead).toBeNull();
    // She loses her only book later: the first frame is the welcome, not a deletion screen with a button that cancels nothing.
    expect(chooseScreen({ hasBook: false, note: afterRead, nowMs: NOW_MS, signedIn: true, hasDeletedBook: false, checked: false, userId: MAMA_ID })).toBe('welcome');
  });
});

// ── S-C: the gate's replace to the Book keeps the join sheet ───────────────────────────────────────────────────────────

describe('[S-C] the book arrives while the deletion screen was up: to the Book, but never over the invite and join sheet', () => {
  const back = { ...gateBase, hasBook: true, wasDeletion: true };

  it('goes to the Book from the screen itself and from the sign-in sheet over it', () => {
    for (const pathname of ['/onboarding', '/sign-in', '/sign-in/code']) {
      expect(decideGate({ ...back, pathname }), pathname).toMatchObject({ leave: true, screen: 'deletion' });
    }
  });

  it('does not replace anything while the invite, join or any other route is on top', () => {
    for (const pathname of ['/invite', '/invite/accept', '/book', '/settings', '/settings/delete-account', '/', '/write']) {
      const d = decideGate({ ...back, pathname });
      expect(d.leave, pathname).toBe(false);
      // The screen under the sheet holds still, and the person can still see the restoring state when the sheet closes.
      expect(d.screen, pathname).toBe('deletion');
    }
  });

  it('nothing leaves unless the deletion screen was up and a book is listed', () => {
    expect(decideGate({ ...back, wasDeletion: false }).leave).toBe(false);
    expect(decideGate({ ...back, hasBook: false }).leave).toBe(false);
  });

  it('a book that arrives while the sheet is on top is followed to the Book once the sheet closes onto the screen', () => {
    expect(decideGate({ ...back, pathname: '/invite' }).leave).toBe(false);
    expect(decideGate({ ...back, pathname: '/onboarding' }).leave).toBe(true);
  });
});

// ── The screens' source ───────────────────────────────────────────────────────────────────────────────────────────

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const read = (...p: string[]) => code(readFileSync(join(SRC, ...p), 'utf8'));

describe('the hook feeds the pure decision, and the stores are written where the flow says', () => {
  it('[S-2] the gate hook passes the stored note, the session user and the route to decideGate, and acts on its answer', () => {
    const s = read('lib', 'account-deletion', 'use-first-run-gate.ts');
    expect(s).toMatch(/decideGate\(\{\s*hasBook, hasDeletedBook, note, nowMs: Date\.now\(\), signedIn: auth\.signedIn, userId, checked, confirmed,\s*wasDeletion: wasDeletion\.current, pathname,\s*\}\)/);
    expect(s).toContain('const userId = authUserId(auth.state);');
    expect(s).toContain('const note = useMemo(() => parseOpenRequest(raw), [raw]);');
    expect(s).toContain('if (gate.deletionShown) wasDeletion.current = true;');
    expect(s).toContain('return { screen: gate.screen, request: gate.request };');
    // The leave is the guarded one: the effect runs on gate.leave, which decideGate answers with welcomeMayLeave.
    expect(s).toMatch(/const leave = gate\.leave;\s*useEffect\(\(\) => \{\s*if \(leave\) router\.replace\('\/book'\);\s*\}, \[leave\]\);/);
    expect(s.match(/router\.replace\(/g)).toHaveLength(1);
    // Writes are in effects, not in render: the dead note is removed there, with the value that was judged.
    expect(s).toMatch(/useEffect\(\(\) => \{\s*if \(clear\) clearDeadNote\(raw\);\s*\}, \[clear, raw\]\);/);
    expect(s).toContain('if (s.ok) recordStatus(s.value, askedAs);');
    expect(s).toContain('recordBookBack()');
  });

  it('[S-C] decideGate reuses the welcome\'s own allow-list for the replace', () => {
    const s = read('lib', 'account-deletion', 'first-run-gate.logic.ts');
    expect(s).toContain("import { welcomeMayLeave } from '@/components/family/welcome-handoff.logic';");
    expect(s).toContain("leave: leaving && welcomeMayLeave('welcome', i.pathname),");
  });

  it('[S-2] the Delete account hook notes the request when the server answers it, before anything that can wait or fail, and notes a cancel', () => {
    const s = read('lib', 'account-deletion', 'use-account-deletion.ts');
    expect(s).toContain('recordRequested(r.value);');
    expect(s.indexOf('recordRequested(r.value);')).toBeLessThan(s.indexOf("analytics.track('account_deletion'"));
    expect(s.indexOf('recordRequested(r.value);')).toBeLessThan(s.indexOf('await withdrawAnalytics()'));
    expect(s).toContain('recordCancelled();');
    expect(s.indexOf('const r = await cancelDeletion(client);')).toBeLessThan(s.indexOf('recordCancelled();'));
    expect(s).toContain('recordStatus(s.value, askedAs);');
    expect(s.indexOf('const askedAs = signedInUserId();')).toBeLessThan(s.indexOf('await Promise.all([loadStatus(client)'));
  });

  it('[M-A, S-1, notes 3 and 4] the deletion screen answers a press, speaks it, shows no failure before one, and exits from executing', () => {
    const s = read('components', 'settings', 'open-deletion.tsx');
    expect(s).toContain("kind={working ? 'loading' : failure ? 'error' : 'empty'}");
    expect(s).toContain('const failure = acted ? failureLine(d.error) : null;');
    expect(s).toContain('announce(c.open.cancelling);');
    expect(s).toContain('announce(`${c.open.restoringTitle}. ${c.open.restoringBody}`);');
    expect(s).toContain('announce(failure);');
    expect(s).toContain('announce(c.open.notYet);');
    expect(s).toContain('const [first, ...rest] = working ? [] : view.actions;');
    expect(s).toContain('accessibilityLabel={c.open.checking}');
  });
});

describe('the routes use the gate', () => {
  it('the first-run route asks the gate before it draws the welcome, and draws the deletion screen or paper when told to', () => {
    const s = read('app', 'onboarding.tsx');
    expect(s).toMatch(/export default function Onboarding\(\) \{\s*const gate = useFirstRunGate\(\);\s*if \(gate\.screen === 'deletion' && gate\.request\) return <OpenDeletionScreen request=\{gate\.request\} \/>;\s*if \(gate\.screen === 'checking'\) return <CheckingScreen \/>;\s*return <FirstRun \/>;\s*\}/);
    // The welcome (and its "Begin the book") lives only in FirstRun, which is not the default export.
    expect(s).toMatch(/\nfunction FirstRun\(\) \{/);
  });

  it('every tab that has no book still sends the person to that one route', () => {
    for (const f of [['(tabs)', 'index.tsx'], ['(tabs)', 'book.tsx'], ['(tabs)', 'family.tsx']]) expect(read('app', ...f), f.join('/')).toMatch(/<Redirect href="\/onboarding" \/>/);
  });

  it('the deletion screen offers only Cancel deletion, a confirmed sign out, Sign in and Try again: no book, no Settings', () => {
    const s = read('components', 'settings', 'open-deletion.tsx');
    // Scheduled and held say first that the request stays open; executing has nothing to promise and signs out at once.
    expect(s).toContain("signOut: () => (request.state === 'executing' ? void d.signOut() : confirmSignOut(date, () => void d.signOut())),");
    expect(s).toContain("signIn: () => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } }),");
    expect(s).not.toMatch(/'\/settings|addChild|\/onboarding|\/book'/);
    expect(s).toContain('<StateScreen');
  });

  it('the gate hook is quiet at launch: one read of the open request, only signed in with no book, never awaited by a screen', () => {
    const s = read('lib', 'account-deletion', 'use-first-run-gate.ts');
    expect(s).toContain('if (!client || !wantRead) return;');
    expect(s).toContain('const wantRead = !hasBook || gate.refreshWithBook;');
    expect(s.match(/loadStatus\(/g)).toHaveLength(1);
    expect(s).toContain('void loadStatus(client)');
    expect(s).not.toMatch(/\bawait\b/);
  });
});
