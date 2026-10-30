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
  CANCELLED_WAIT_MS, chooseScreen, deletionView, liveNote, noteAfterCancel, noteAfterRead, noteWithBook, OPEN_REQUEST_KEY,
  openRequestOf, parseOpenRequest, readOpenRequest, writeOpenRequest, type OpenRequest, type PhoneScreen,
} from '../src/lib/account-deletion/open-request';
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
const CANCELLED: OpenRequest = { state: 'cancelled', at: NOW };

function memoryFlags(): FlagStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, get: (k) => map.get(k) ?? null, set: (k, v) => void map.set(k, v), remove: (k) => void map.delete(k) };
}

describe('the note: what the phone remembers of an open request', () => {
  it('round-trips each shape, and reads nothing else', () => {
    for (const n of [SCHEDULED, HELD, EXECUTING, CANCELLED]) expect(parseOpenRequest(JSON.stringify(n))).toEqual(n);
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
    const phone = { hasBook: false, nowIso: NOW };
    const open = { state: 'scheduled' as const, requestId: 'req-2', scheduledFor: WHEN };
    expect(openRequestOf({ state: 'none' })).toBeNull();
    expect(openRequestOf(open)).toEqual({ state: 'scheduled', requestId: 'req-2', scheduledFor: WHEN });
    expect(openRequestOf({ state: 'executing', requestId: 'req-2' })).toEqual({ state: 'executing', requestId: 'req-2' });
    // A request found replaces whatever was remembered (a second phone, a sign-in again).
    expect(noteAfterRead(null, open, phone)).toEqual({ state: 'scheduled', requestId: 'req-2', scheduledFor: WHEN });
    expect(noteAfterRead(CANCELLED, open, phone)).toEqual({ state: 'scheduled', requestId: 'req-2', scheduledFor: WHEN });
    // None found: nothing was open, nothing is remembered; a cancelled wait is left to be the wait it is.
    expect(noteAfterRead(null, { state: 'none' }, phone)).toBeNull();
    expect(noteAfterRead(CANCELLED, { state: 'none' }, phone)).toEqual(CANCELLED);
  });

  it('a request that was open and is gone (cancelled on another phone) leaves a phone with no book waiting for it, and never the welcome', () => {
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, { hasBook: false, nowIso: NOW })).toEqual({ state: 'cancelled', at: NOW });
    expect(noteAfterRead(HELD, { state: 'none' }, { hasBook: false, nowIso: NOW })).toEqual({ state: 'cancelled', at: NOW });
    // A phone that still lists a book has nothing to wait for.
    expect(noteAfterRead(SCHEDULED, { state: 'none' }, { hasBook: true, nowIso: NOW })).toBeNull();
  });

  it('a cancel leaves a sole parent waiting for her book and a co-parent with nothing', () => {
    expect(noteAfterCancel({ hasBook: false }, NOW)).toEqual({ state: 'cancelled', at: NOW });
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
    for (const note of [SCHEDULED, HELD, EXECUTING, CANCELLED]) {
      for (const signedIn of [true, false]) {
        for (const hasDeletedBook of [true, false]) {
          for (const checked of [true, false]) {
            answers.add(chooseScreen({ hasBook: false, note, nowMs: NOW_MS, signedIn, hasDeletedBook, checked }));
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

  it('executing: it only explains (nothing can be cancelled any more), and signed in may sign out', () => {
    expect(deletionView(EXECUTING, o)).toMatchObject({ title: c.open.executingTitle, body: c.executing, actions: ['signOut'] });
    expect(deletionView(EXECUTING, { ...o, signedIn: false }).actions).toEqual([]);
  });

  it('cancelled: it says the book is coming back and offers Try again (a pull), or Sign in when signed out', () => {
    expect(deletionView(CANCELLED, o)).toMatchObject({ title: c.open.restoringTitle, body: c.open.restoringBody, actions: ['retry'] });
    expect(deletionView(CANCELLED, { ...o, signedIn: false }).actions).toEqual(['signIn']);
  });

  it('never offers a way to a book, Settings or the welcome, and its words obey the content rules', () => {
    for (const note of [SCHEDULED, HELD, EXECUTING, CANCELLED]) {
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
    writeOpenRequest(flags, noteAfterRead(readOpenRequest(flags), { state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN }, { hasBook: false, nowIso: NOW }));
    expect(screen({ checked: true })).toBe('deletion');
    f.close();
  });

  it('a phone whose server read finds nothing open (the book was deleted on its own, not with the account) goes on to the welcome', () => {
    const { f, flags, L1, L2, screen } = mamasPhone();
    f.db.transaction(() => applyPullPage(f.db, gonePage([ownRow(L1, NOW), ownRow(L2, NOW)]), NOW));
    writeOpenRequest(flags, noteAfterRead(readOpenRequest(flags), { state: 'none' }, { hasBook: false, nowIso: NOW }));
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

// ── The screens' source ───────────────────────────────────────────────────────────────────────────────────────────

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const read = (...p: string[]) => code(readFileSync(join(SRC, ...p), 'utf8'));

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
    expect(s).toContain('signOut: () => confirmSignOut(date, () => void d.signOut()),');
    expect(s).toContain("signIn: () => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } }),");
    expect(s).not.toMatch(/'\/settings|addChild|\/onboarding|\/book'/);
    expect(s).toContain('<StateScreen');
  });

  it('the gate hook is quiet at launch: one read of the open request, only signed in with no book, never awaited by a screen', () => {
    const s = read('lib', 'account-deletion', 'use-first-run-gate.ts');
    expect(s).toContain('if (!client || hasBook) return;');
    expect(s.match(/loadStatus\(/g)).toHaveLength(1);
    expect(s).toContain('void loadStatus(client)');
    expect(s).not.toMatch(/\bawait\b/);
  });
});
