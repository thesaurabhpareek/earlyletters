/// <reference types="node" />
/**
 * The one account reader (BL-961 PR 1; `[X4-R1]`, NS-10-R3, NS-10-R5; ruling D1; ADR 0031): who owns this phone's
 * book, and is it the account signed in now. Every case Karma's task names: no owner, same owner, different owner,
 * signed out, and an owner forgotten by `releaseEmptyOwner`. The last runs the real ownership code over node:sqlite with
 * the app's migrations. Fictional family "Asha" only; no names reach the reader.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bookVisibleTo } from '../src/lib/auth/account-scope.logic';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { authUserId, type AuthState } from '../src/lib/auth/machine.logic';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { SYNC_SETTING, readSetting } from '../src/lib/sync/outbox';
import { AccountMismatchError, releaseEmptyOwner, takeOwnership } from '../src/lib/sync/ownership';
import { nodeDb } from './helpers/node-db';
import { seedChild } from './helpers/store-fixture';

const A = '0192f0aa-0000-7000-8000-0000000000a1'; // the account that made the book on this phone
const B = '0192f0aa-0000-7000-8000-0000000000b2'; // a second account signing in on the same phone
const NOW = '2026-11-20T09:00:00.000Z';
let n = 0;
const ctx = { now: NOW, newId: () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}` };

function phone(): SqlDb {
  const { db } = nodeDb();
  migrate(db, ctx);
  return db;
}
const owner = (db: SqlDb) => readSetting(db, SYNC_SETTING.owner);
/** What the app asks: the stored owner against whoever the auth state says is signed in. */
const visibleOn = (db: SqlDb, s: AuthState) => bookVisibleTo({ owner: owner(db), sessionUser: authUserId(s) });

describe('[X4-R1] bookVisibleTo: the whole table', () => {
  it('no owner: visible to anyone (nothing on the phone belongs to another account)', () => {
    expect(bookVisibleTo({ owner: null, sessionUser: null })).toBe(true);
    expect(bookVisibleTo({ owner: null, sessionUser: A })).toBe(true);
    expect(bookVisibleTo({ owner: null, sessionUser: B })).toBe(true);
  });

  it('same owner: visible', () => {
    expect(bookVisibleTo({ owner: A, sessionUser: A })).toBe(true);
  });

  it('different owner: hidden (NS-10-R3)', () => {
    expect(bookVisibleTo({ owner: A, sessionUser: B })).toBe(false);
    expect(bookVisibleTo({ owner: B, sessionUser: A })).toBe(false);
  });

  it('signed out: visible to whoever holds the phone (D1: the book stays after sign-out)', () => {
    expect(bookVisibleTo({ owner: A, sessionUser: null })).toBe(true);
  });

  it('an empty owner value counts as no owner, never as a match for an empty session', () => {
    expect(bookVisibleTo({ owner: '', sessionUser: B })).toBe(true);
    expect(bookVisibleTo({ owner: A, sessionUser: '' })).toBe(true);
  });
});

describe('[X4-R1] the session user is the raw session, at every step of signing in', () => {
  const signedOutLike: AuthState[] = [
    { status: 'restoring' },
    { status: 'signedOut' },
    { status: 'signedOut', error: 'session_expired' },
    { status: 'signingIn', method: 'apple' },
    { status: 'awaitingCode', sentAt: 0 },
  ];
  const asB: AuthState[] = [
    { status: 'checkingConsent', userId: B, method: 'email' },
    { status: 'needsConsent', userId: B, method: 'email', steps: ['terms'] },
    { status: 'ready', userId: B, sync: 'on' },
    { status: 'ready', userId: B, sync: 'off' },
    { status: 'ready', userId: B, sync: 'unknown' },
    { status: 'signingOut', userId: B, reason: 'user', waitingForUploads: false, sync: 'on' },
  ];

  it('with no session the owner is shown its own book, whatever the auth state is doing', () => {
    for (const s of signedOutLike) expect(bookVisibleTo({ owner: A, sessionUser: authUserId(s) }), s.status).toBe(true);
  });

  it('a second account is hidden from the first moment of its session: before consent, after it, and while signing out', () => {
    for (const s of asB) expect(bookVisibleTo({ owner: A, sessionUser: authUserId(s) }), s.status).toBe(false);
  });

  it('the owner signed in again sees its book at every step', () => {
    for (const s of asB) {
      const own = { ...s, userId: A } as AuthState;
      expect(bookVisibleTo({ owner: A, sessionUser: authUserId(own) }), s.status).toBe(true);
    }
  });
});

describe('[X4-R1] on a real phone database (lib/sync/ownership.ts)', () => {
  const ready = (userId: string): AuthState => ({ status: 'ready', userId, sync: 'on' });

  it('a phone holding the first account\'s book: hidden from the second account, and nothing changes on the phone', () => {
    const db = phone();
    seedChild(db, 'child-asha');
    takeOwnership(db, A, ctx);
    expect(visibleOn(db, ready(A))).toBe(true);
    expect(() => takeOwnership(db, B, ctx)).toThrow(AccountMismatchError);
    expect(visibleOn(db, ready(B))).toBe(false);
    expect(owner(db)).toBe(A);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM children')!.n).toBe(1);
  });

  it('the second account signs out: the book is the phone holder\'s again (D1); the first signs in: it is theirs', () => {
    const db = phone();
    seedChild(db, 'child-asha');
    takeOwnership(db, A, ctx);
    expect(visibleOn(db, { status: 'signedOut' })).toBe(true);
    expect(visibleOn(db, ready(A))).toBe(true);
  });

  it('a phone that held nothing: releaseEmptyOwner forgets the owner, and the next account is not hidden from anything', () => {
    const db = phone();
    takeOwnership(db, A, ctx);
    expect(visibleOn(db, ready(B))).toBe(false); // before the release the stale owner would hide an empty phone
    expect(releaseEmptyOwner(db, phoneHoldsAnyRow)).toBe(true);
    expect(owner(db)).toBeNull();
    expect(visibleOn(db, ready(B))).toBe(true);
  });

  it('a phone that holds a book keeps its owner through releaseEmptyOwner, so the second account stays hidden', () => {
    const db = phone();
    seedChild(db, 'child-asha');
    takeOwnership(db, A, ctx);
    expect(releaseEmptyOwner(db, phoneHoldsAnyRow)).toBe(false);
    expect(visibleOn(db, ready(B))).toBe(false);
  });
});

describe('the reader stays pure', () => {
  it('imports nothing: no store, no React Native, no network', () => {
    const src = readFileSync(join(__dirname, '../src/lib/auth/account-scope.logic.ts'), 'utf8');
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/require\(/);
  });
});
