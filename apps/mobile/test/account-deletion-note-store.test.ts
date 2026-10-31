/// <reference types="node" />
/**
 * The writers of the open-request note (lib/account-deletion/note-store.ts), run in Node with the three modules they
 * need replaced by a few lines each: the device settings and the book list (lib/store), the sync engine (lib/sync) and
 * the auth snapshot (lib/auth/auth-store). Until now the pure model was tested and the hand-written notes in the other
 * files stood in for these functions; so removing a call to one of them broke nothing. These tests are what fails then
 * (the fix round on PR #393, lens B S-2, and lens A S-A).
 *
 * The account a note is written for is the session's own user, known from the moment a session exists, not
 * `currentAuthUserId()`, which is null while consent or the claim is pending (auth-store.ts): the race in S-A.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  books: [] as unknown[],
  closedBook: false,
  syncNow: vi.fn(() => Promise.resolve(null)),
  snapshot: { status: 'signedOut' } as Record<string, unknown>,
  /** What auth-store's currentAuthUserId() would answer: null until consent is complete. It is not what the note uses. */
  releasedUserId: null as string | null,
}));

vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
  listChildren: () => h.books,
  localSqlDb: () => ({ get: () => (h.closedBook ? { x: 1 } : null) }),
}));
vi.mock('@/lib/sync', () => ({ syncNow: h.syncNow }));
vi.mock('@/lib/auth/auth-store', () => ({
  getAuthSnapshot: () => h.snapshot,
  currentAuthUserId: () => h.releasedUserId,
}));

import { clearDeadNote, deviceFlags, phoneHasDeletedBook, recordBookBack, recordCancelled, recordRequested, recordStatus, signedInUserId } from '../src/lib/account-deletion/note-store';
import { OPEN_REQUEST_KEY, readOpenRequest, type OpenRequest } from '../src/lib/account-deletion/open-request';

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const WHEN = new Date(Date.now() + 29 * 86_400_000).toISOString();
const REQ = { requestId: 'req-1', scheduledFor: WHEN };
const note = (): OpenRequest | null => readOpenRequest(deviceFlags);
const put = (n: OpenRequest) => void h.settings.set(OPEN_REQUEST_KEY, JSON.stringify(n));
const signIn = (userId: string, status: 'ready' | 'checkingConsent' | 'needsConsent' = 'ready') => {
  h.snapshot = status === 'ready' ? { status, userId, sync: 'on' } : { status, userId, method: null, steps: [] };
};
const asha = { id: 'asha' };

beforeEach(() => {
  h.settings.clear();
  h.books = [];
  h.closedBook = false;
  h.snapshot = { status: 'signedOut' };
  h.releasedUserId = null;
  h.syncNow.mockClear();
});

describe('whose note it is: the session user, even while consent or the claim is pending', () => {
  it('reads the user from the auth snapshot (checkingConsent and needsConsent included), null when signed out', () => {
    expect(signedInUserId()).toBeNull();
    signIn(MAMA, 'checkingConsent');
    expect(signedInUserId()).toBe(MAMA);
    signIn(PAPA, 'needsConsent');
    expect(signedInUserId()).toBe(PAPA);
    signIn(MAMA);
    expect(signedInUserId()).toBe(MAMA);
  });

  it('the request is noted for the account that asked, though currentAuthUserId() is still null', () => {
    signIn(MAMA, 'checkingConsent'); // the claim or consent is pending: released() is null
    recordRequested(REQ);
    expect(note()).toEqual({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
  });
});

describe('[S-2] recordRequested', () => {
  it('writes a scheduled note with the server\'s id and date, and nothing else (no name, letter or child)', () => {
    signIn(MAMA);
    recordRequested(REQ);
    expect(JSON.parse(h.settings.get(OPEN_REQUEST_KEY)!)).toEqual({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
  });
});

describe('[S-2] recordStatus: a read of the open request that succeeded', () => {
  it('a request found replaces the note, for the account that asked', () => {
    signIn(MAMA);
    put({ state: 'scheduled', requestId: 'old', scheduledFor: WHEN, userId: MAMA });
    recordStatus({ state: 'held', requestId: 'req-2', scheduledFor: WHEN }, MAMA);
    expect(note()).toEqual({ state: 'held', requestId: 'req-2', scheduledFor: WHEN, userId: MAMA });
    expect(h.syncNow).not.toHaveBeenCalled();
  });

  it('none found, a phone whose book the server closed: the cancelled wait, and the phone pulls at once', () => {
    signIn(MAMA);
    h.closedBook = true;
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    recordStatus({ state: 'none' }, MAMA);
    expect(note()).toMatchObject({ state: 'cancelled', userId: MAMA });
    expect(h.syncNow).toHaveBeenCalledTimes(1);
  });

  it('[S-B] none found, a phone with no closed book to restore: the note is cleared, nothing "on its way back", no pull', () => {
    signIn(MAMA);
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    recordStatus({ state: 'none' }, MAMA);
    expect(note()).toBeNull();
    expect(h.settings.has(OPEN_REQUEST_KEY)).toBe(false);
    expect(h.syncNow).not.toHaveBeenCalled();
  });

  it('[S-B] none found, a phone with a book listed (the book came back through a plain sync): the note is cleared', () => {
    signIn(MAMA);
    h.books = [asha];
    h.closedBook = true;
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    recordStatus({ state: 'none' }, MAMA);
    expect(note()).toBeNull();
    expect(h.syncNow).not.toHaveBeenCalled();
  });

  it('[M-A] none found for a note whose date passed more than the grace ago: cleared, even with a closed book on the phone', () => {
    signIn(MAMA);
    h.closedBook = true;
    const long = new Date(Date.now() - 3 * 86_400_000).toISOString();
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: long, userId: MAMA });
    recordStatus({ state: 'none' }, MAMA);
    expect(note()).toBeNull();
    expect(h.syncNow).not.toHaveBeenCalled();
  });

  it('[S-A] THE RACE: A asked and signed out; B signs in and the status answer lands while consent is pending (currentAuthUserId() is null): A\'s note is gone, B is not told her book is on its way back', () => {
    h.closedBook = true; // A's book is closed on this phone
    put({ state: 'scheduled', requestId: 'req-A', scheduledFor: WHEN, userId: MAMA });
    signIn(PAPA, 'checkingConsent');
    expect(h.releasedUserId).toBeNull();
    recordStatus({ state: 'none' }, PAPA);
    expect(note()).toBeNull();
    expect(h.syncNow).not.toHaveBeenCalled();
  });

  it('[S-A] the same race, with the note a cancelled wait of A\'s: gone as well', () => {
    put({ state: 'cancelled', at: new Date().toISOString(), userId: MAMA });
    signIn(PAPA, 'checkingConsent');
    recordStatus({ state: 'none' }, PAPA);
    expect(note()).toBeNull();
  });

  it('[S-A] an answer that lands after another account has signed in is not that account\'s and is dropped', () => {
    signIn(PAPA);
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: PAPA });
    recordStatus({ state: 'none' }, MAMA); // asked as Mama; Papa is signed in now
    expect(note()).toMatchObject({ state: 'scheduled', userId: PAPA });
    recordStatus({ state: 'held', requestId: 'req-9', scheduledFor: WHEN }, MAMA);
    expect(note()).toMatchObject({ requestId: 'req-1', userId: PAPA });
  });
});

describe('[S-2] recordCancelled: a cancel went through', () => {
  it('a sole parent (no book listed) waits for her book as a cancelled note for her account, and the phone pulls at once', () => {
    signIn(MAMA);
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    recordCancelled();
    expect(note()).toMatchObject({ state: 'cancelled', userId: MAMA });
    expect(h.syncNow).toHaveBeenCalledTimes(1);
  });

  it('a co-parent (her book never left) has nothing to wait for: the note goes', () => {
    signIn(MAMA);
    h.books = [asha];
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    recordCancelled();
    expect(note()).toBeNull();
    expect(h.syncNow).not.toHaveBeenCalled();
  });
});

describe('[S-2] recordBookBack and clearDeadNote', () => {
  it('a listed book ends a cancelled wait and leaves an open request alone', () => {
    put({ state: 'cancelled', at: new Date().toISOString(), userId: MAMA });
    recordBookBack();
    expect(note()).toBeNull();
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    recordBookBack();
    expect(note()).toMatchObject({ state: 'scheduled' });
  });

  it('removes the note that was judged dead, and leaves it if it changed in between (an answer landed)', () => {
    put({ state: 'scheduled', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    const judged = h.settings.get(OPEN_REQUEST_KEY)!;
    put({ state: 'held', requestId: 'req-1', scheduledFor: WHEN, userId: MAMA });
    clearDeadNote(judged);
    expect(note()).toMatchObject({ state: 'held' });
    clearDeadNote(h.settings.get(OPEN_REQUEST_KEY)!);
    expect(note()).toBeNull();
    clearDeadNote(null); // nothing stored: nothing to do
    expect(note()).toBeNull();
  });

  it('knows whether the server has closed a book on this phone', () => {
    expect(phoneHasDeletedBook()).toBe(false);
    h.closedBook = true;
    expect(phoneHasDeletedBook()).toBe(true);
  });
});
