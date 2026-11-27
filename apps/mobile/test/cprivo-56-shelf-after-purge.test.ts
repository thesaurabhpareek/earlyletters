/// <reference types="node" />
/**
 * CPrivO-56 (BL-494 point 4): after the day-30 purge the phone never learns the server's copies are gone (PR #2090), so
 * the letters the account held stay in Recently deleted. One block per point of the ruling, then the sole parent after
 * the purge on the real store and the real merge (the only book closed by closeBook, its deleted letter there, signed
 * out). Screens cannot run in Node, so their wiring is pinned from source. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountDeletionCopy, en } from '@scribe/content';
import { keptUntilPassed, shelfActions, shelfBookDays, shelfCanRestore, shelfDateLine, shelfHelpShown, shelfRow } from '../src/components/book/shelf.logic';
import { phoneLine } from '../src/components/settings/delete-account.logic';
import { recentlyDeletedRowShown } from '../src/lib/first-run/recently-deleted-row.logic';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';
import type { Entry } from '../src/lib/store';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native open must not be used in tests'); } }));

const store = await import('../src/lib/store');
const { applyPullPage } = await import('../src/lib/sync/merge');
const { getAuthSnapshot } = await import('../src/lib/auth/auth-store');
const { authUserId } = await import('../src/lib/auth/machine.logic');

const src = (f: string) => readFileSync(join(__dirname, '..', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');
const d = en.settings.delete;
const RULED = 'On this phone, your letters stay. The ones already saved to your account move to Recently deleted. After your account is deleted, they stay there until you erase them.';
const FALLBACK = 'On this phone, your letters stay. The ones already saved to your account move to Recently deleted. After your account is deleted, they stay on this phone.';
// Noon UTC, so the days below are the same in every time zone from UTC-11 to UTC+11. Kept until November 12.
const DELETED_AT = '2026-10-13T12:00:00.000Z';
const deleted = { id: 'e1', occurredOn: '2026-09-29', captureMode: 'typed', finalText: 'You laughed.', deletedAt: DELETED_AT } as unknown as Entry & { deletedAt: string };
const shelf = src('src/app/settings/recently-deleted.tsx');

describe('[CPrivO-56] the ruling, point by point', () => {
  it('[1] step 1 says "until you erase them" only where the shelf shows Erase now, decided by the shelf\'s own capability', () => {
    expect([accountDeletionCopy.what.onThisPhone, accountDeletionCopy.what.onThisPhoneNoErase]).toEqual([RULED, FALLBACK]);
    expect([phoneLine(true), phoneLine(false)]).toEqual([RULED, FALLBACK]);
    const page = src('src/app/settings/delete-account.tsx');
    expect(page).toMatch(/phoneLine\(shelfActions\(\{ sync: capabilities\.sync, serverErase: capabilities\.serverErase \}\)\.eraseNow\)/);
    expect(page).not.toMatch(/c\.what\.onThisPhone\b/);
  });

  it('[1] no eas.json profile sets EXPO_PUBLIC_SERVER_ERASE, so every profile that can draw step 1 draws the fallback', () => {
    const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    const drawn: Record<string, string> = {};
    for (const [name, { env = {} }] of Object.entries(eas.build)) {
      expect(env.EXPO_PUBLIC_SERVER_ERASE, name).toBeUndefined();
      const sync = env.EXPO_PUBLIC_SERVER_FEATURES === 'on';
      // Step 1 needs servers and EXPO_PUBLIC_ACCOUNT_DELETION; preview leaves the latter to its EAS environment.
      const page = sync && env.EXPO_PUBLIC_ACCOUNT_DELETION !== 'off';
      const eraseNow = shelfActions({ sync, serverErase: sync && env.EXPO_PUBLIC_SERVER_ERASE === 'on' }).eraseNow;
      drawn[name] = page ? (phoneLine(eraseNow) === RULED ? 'ruled' : 'fallback') : 'no page';
    }
    expect(drawn).toEqual({ development: 'no page', e2e: 'no page', preview: 'fallback', production: 'fallback', testflight: 'no page' });
  });

  it('[2] a card keeps "Kept here until {date}" through that day and drops it after, letter and book cards alike', () => {
    const [nov12, nov13] = [Date.parse('2026-11-12T18:00:00.000Z'), Date.parse('2026-11-13T12:00:00.000Z')];
    expect([keptUntilPassed(DELETED_AT, nov12), keptUntilPassed(DELETED_AT, nov13)]).toEqual([false, true]);
    expect(shelfDateLine(shelfRow(deleted, 'en-US'), d, keptUntilPassed(DELETED_AT, nov12))).toBe('Deleted October 13. Kept here until November 12.');
    expect(shelfDateLine(shelfRow(deleted, 'en-US'), d, keptUntilPassed(DELETED_AT, nov13))).toBe('Deleted October 13.');
    expect(shelfDateLine(shelfBookDays(DELETED_AT, 'en-US'), d, true)).toBe('Deleted October 13.');
    expect(shelf).toMatch(/past=\{keptUntilPassed\(e\.deletedAt, now\)\}/);
    expect(shelf).toMatch(/const dates = shelfDateLine\(v, d, past\);/);
    expect(shelf).toMatch(/shelfDateLine\(shelfBookDays\(b\.deletedAt\), d, keptUntilPassed\(b\.deletedAt, now\)\)/);
  });

  it('[3] shelfHelp is not drawn while anything on the shelf is past its 30 days: shelf, Settings row, first-run row', () => {
    const now = Date.parse('2026-11-13T12:00:00.000Z');
    expect(shelfHelpShown([], now)).toBe(true);
    expect(shelfHelpShown([{ deletedAt: '2026-11-01T12:00:00.000Z' }], now)).toBe(true);
    expect(shelfHelpShown([{ deletedAt: '2026-11-01T12:00:00.000Z' }, { deletedAt: DELETED_AT }], now)).toBe(false);
    expect(shelf).toMatch(/\{shelfHelpShown\(\[\.\.\.books, \.\.\.rows\], now\) \? \(\s*<Text variant="subhead" tone="muted">\s*\{d\.shelfHelp\}/);
    const settings = src('src/app/settings/index.tsx');
    expect(settings).toMatch(/shelfHelp: shelfHelpShown\(\[\.\.\.listDeletedBooks\(\), \.\.\.listDeleted\(\)\], Date\.now\(\)\)/);
    expect(settings).toMatch(/title=\{copy\.settings\.delete\.recentlyDeleted\} subtitle=\{s\.shelfHelp \? copy\.settings\.delete\.shelfHelp : undefined\}/);
    const onboarding = src('src/app/onboarding.tsx');
    expect(onboarding).toMatch(/title=\{copy\.settings\.delete\.recentlyDeleted\}\s*subtitle=\{shelf\.help \? copy\.settings\.delete\.shelfHelp : undefined\}/);
    // One draw of the line in each, the guarded one.
    for (const s of [shelf, settings, onboarding]) expect(s.match(/\b(?:d|copy\.settings\.delete)\.shelfHelp\b/g)).toHaveLength(1);
  });

  it('[4] the first-run row is drawn while the shelf lists any letter, on the welcome only', () => {
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: 0, deletedLetterCount: 1 })).toBe(true);
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: 0, deletedLetterCount: 0 })).toBe(false);
    expect(recentlyDeletedRowShown({ step: 'child', deletedBookCount: 0, deletedLetterCount: 1 })).toBe(false);
  });

  it('[5] no Restore for a letter whose book the pull closed (as for a left book); Erase now does not depend on it', () => {
    expect([shelfCanRestore({ left: false, closed: false }), shelfCanRestore({ left: false, closed: true }), shelfCanRestore({ left: true, closed: false })]).toEqual([true, false, false]);
    expect(shelf).toMatch(/canRestore=\{shelfCanRestore\(\{ left: !!e\.childId && isBookLeft\(e\.childId\), closed: !!e\.childId && isBookClosed\(e\.childId\) \}\)\}/);
    expect(shelf).toMatch(/eraseNow=\{actions\.eraseNow\}/);
  });
});

// The sole parent after the purge: real store, real merge, signed out (no session, as every pull after the Auth delete).
const ME = '11111111-1111-1111-1111-111111111111';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';
const MINE = '0199a5b0-0000-7000-8000-0000000000b1';
const NOW = '2026-11-27T12:00:00.000Z';
const row = (deletedAt: string | null, v: string) => ({
  id: MINE, child_id: ASHA, author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-09-29', captured_at: NOW,
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'You laughed at the rain.',
  machine_edits: [], final_text: 'You laughed at the rain.', in_book: true, sounds_like_me: null, approval: 'approved',
  audio_kept_on_device: false, language: 'en', created_at: NOW, updated_at: NOW, deleted_at: deletedAt, own: true, v,
}) as PulledRow;
const meta = { role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
  created_by_me: true, my_signs_as: 'Mama', include_in_reminders: true, members: [{ profile_id: ME, role: 'parent', is_me: true, joined_at: NOW, signs_as: null }] };
const cursor = (n: number) => `${n}:00000000-0000-0000-0000-000000000000`;
const page = (r: PulledRow, n: number) => ({ reset: false, epoch: 1, epoch_started_at: NOW, gone: [],
  books: [{ id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', cursor: cursor(n), more: false, rows: [r], meta }] }) as unknown as PullResponse;
const closed = { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [{ id: ASHA, reason: 'deleted', rows: [], cursor: cursor(300), more: false }] } as PullResponse;

describe('[CPrivO-56] the sole parent after the purge: the only book closed by the pull, its deleted letter on the shelf, signed out', () => {
  let close: () => void = () => {};
  let seq = 0;
  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}` }).ok).toBe(true);
    const db = store.localSqlDb();
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    // The letter arrives; the deletion request tombstones it; the next pull closes the only book (closeBook).
    for (const res of [page(row(null, '100'), 100), page(row(DELETED_AT, '200'), 200), closed]) db.transaction(() => applyPullPage(db, res, NOW));
  });
  afterEach(() => (store.closeStore(), close()));

  it('first run lists no book and no deleted book, yet draws the Recently deleted row for the letter', () => {
    expect(authUserId(getAuthSnapshot())).toBeNull(); // signed out
    expect(store.listChildren()).toEqual([]);
    expect(store.isBookClosed(ASHA)).toBe(true);
    expect(store.listDeletedBooks()).toEqual([]);
    expect(store.listDeleted().map((e) => e.id)).toEqual([MINE]);
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: store.listDeletedBooks().length, deletedLetterCount: store.listDeleted().length })).toBe(true);
  });

  it('the shelf lists the letter with no Restore (the store refuses it too) and no help line or past date; step 1 says the fallback here', () => {
    const now = Date.parse(NOW);
    const [e] = store.listDeleted();
    expect(shelfCanRestore({ left: store.isBookLeft(ASHA), closed: store.isBookClosed(ASHA) })).toBe(false);
    expect(store.undeleteEntry(MINE)).toBe(false);
    expect(store.listDeleted().map((x) => x.id)).toEqual([MINE]);
    expect(shelfHelpShown([...store.listDeletedBooks(), ...store.listDeleted()], now)).toBe(false);
    expect(shelfDateLine(shelfRow(e!, 'en-US'), d, keptUntilPassed(e!.deletedAt, now))).toBe('Deleted October 13.');
    // A store build (servers on, no EXPO_PUBLIC_SERVER_ERASE) shows no Erase now, so step 1 never promised erasing.
    expect(shelfActions({ sync: true, serverErase: false }).eraseNow).toBe(false);
    expect(phoneLine(shelfActions({ sync: true, serverErase: false }).eraseNow)).toBe(FALLBACK);
  });

  it('where the build has Erase now it is on the card and erases the letter from this phone', () => {
    expect(shelfActions({ sync: true, serverErase: true }).eraseNow).toBe(true);
    expect(phoneLine(shelfActions({ sync: true, serverErase: true }).eraseNow)).toBe(RULED);
    expect(store.eraseEntry(MINE, () => {})).toBe(true);
    expect(store.listDeleted()).toEqual([]);
    expect(recentlyDeletedRowShown({ step: 'welcome', deletedBookCount: 0, deletedLetterCount: store.listDeleted().length })).toBe(false);
  });
});
