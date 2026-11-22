/// <reference types="node" />
/**
 * Cross-account stores audit (docs/engineering/audits/2026-11-21-cross-account-stores.md, finding F1): the two one-shot
 * marks a family sheet leaves for the page under it (components/family/family-notice.ts) are module-level. The leave
 * line carries the child's name (`fill(l.done, { child })`), and the arrival mark says a joined book is waiting. A page
 * takes them once, but when none does before the session ends they would show to the next account. Same shape as
 * BL-1424 (join wait): every sign-out and every account switch passes publishAuth, so that is where they end.
 * Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getAuthSnapshot, publishAuth, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { authReducer, authUserId, initialAuthState, type AuthEvent, type AuthState, type SignOutReason } from '../src/lib/auth/machine.logic';
import { familyNotice, joinedArrival } from '../src/components/family/family-notice';
import { bookHandoff } from '../src/components/book/book.logic';
import type { Entry } from '../src/lib/store';

const run = (from: AuthState, events: AuthEvent[]): AuthState =>
  events.reduce((s, e) => {
    const n = authReducer(s, e);
    publishAuth(n);
    return n;
  }, from);

const signedInAs = (userId: string): AuthEvent[] => [
  { type: 'SIGNED_IN', userId, method: 'email' },
  { type: 'GATE_LOADED', gate: { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true }, sensitiveDeclined: false },
];

const drain = () => {
  familyNotice.take();
  joinedArrival.take();
  bookHandoff.take();
};

beforeEach(() => {
  resetAuthStoreForTests();
  drain();
});
afterEach(() => {
  drain();
  resetAuthStoreForTests();
});

describe('[X-ACCT-1] sign-out ends the family notice and the arrival mark', () => {
  const reasons: SignOutReason[] = ['user', 'apple_revoked', 'force_reauth', 'switch_account'];
  for (const reason of reasons) {
    it(`reason ${reason}: account B does not inherit account A's line or arrival`, () => {
      let s = run(initialAuthState, signedInAs('user-a'));
      expect(s.status).toBe('ready');
      familyNotice.leave('Asha left the book');
      joinedArrival.leave();

      s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason, pendingUploads: { kind: 'count', n: 0 } }, { type: 'SIGNED_OUT' }]);
      s = run(s, signedInAs('user-b'));
      expect(familyNotice.take()).toBeNull();
      expect(joinedArrival.waiting()).toBe(false);
    });
  }

  it('a line left after the sign-out, for the next account, is kept', () => {
    const s = run(initialAuthState, signedInAs('user-a'));
    const next = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: { kind: 'count', n: 0 } }, { type: 'SIGNED_OUT' }, ...signedInAs('user-b')]);
    familyNotice.leave('Invite is waiting');
    publishAuth(next);
    expect(familyNotice.take()).toBe('Invite is waiting');
  });

  it('the same account staying signed in keeps its line and arrival', () => {
    const s = run(initialAuthState, signedInAs('user-a'));
    familyNotice.leave('Invite is waiting');
    joinedArrival.leave();
    publishAuth(s);
    expect(familyNotice.take()).toBe('Invite is waiting');
    expect(joinedArrival.take()).toBe(true);
  });

  it('account A to account B with no sign-out between: B does not inherit the line, the arrival or the deleted letter', () => {
    const s = run(initialAuthState, signedInAs('user-a'));
    familyNotice.leave('Asha left the book');
    joinedArrival.leave();
    bookHandoff.deleted({ id: 'e1' } as unknown as Entry);
    publishAuth({ ...s, userId: 'user-b' } as AuthState);
    expect(familyNotice.take()).toBeNull();
    expect(joinedArrival.take()).toBe(false);
    expect(bookHandoff.get()).toBeNull();
  });

  it('a sheet that resumes after its await, once the session has ended, leaves nothing for the next account (RACE1)', () => {
    let s = run(initialAuthState, signedInAs('user-a'));
    s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason: 'force_reauth', pendingUploads: { kind: 'count', n: 0 } }, { type: 'SIGNED_OUT' }]);
    familyNotice.leave('Asha left the book'); // the late continuation
    joinedArrival.leave();
    run(s, signedInAs('user-b'));
    expect(familyNotice.take()).toBeNull();
    expect(joinedArrival.take()).toBe(false);
  });

  it('a line left by A and read by B without any clear is not shown (owner check)', () => {
    run(initialAuthState, signedInAs('user-a'));
    familyNotice.leave('Asha left the book');
    resetAuthStoreForTests();
    run(initialAuthState, signedInAs('user-b'));
    expect(familyNotice.take()).toBeNull();
  });
  it('[BL-1500] a sheet that resumes after A signed out and B signed in leaves nothing for B (owner captured before the await)', () => {
    let s = run(initialAuthState, signedInAs('user-a'));
    const owner = authUserId(getAuthSnapshot()); // read before the await, as the sheet does
    s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: { kind: 'count', n: 0 } }, { type: 'SIGNED_OUT' }]);
    run(s, signedInAs('user-b'));
    familyNotice.leave('Asha left the book', owner); // the continuation resumes now
    expect(familyNotice.take()).toBeNull();
  });

  it('[BL-1500] a line left with the owner that is still signed in is kept', () => {
    run(initialAuthState, signedInAs('user-a'));
    familyNotice.leave('Invite is waiting', authUserId(getAuthSnapshot()));
    expect(familyNotice.take()).toBe('Invite is waiting');
  });

  it('[BL-1501] A leaves a line and an arrival, signs out, A signs in again: both are gone (the clears, not the owner check)', () => {
    let s = run(initialAuthState, signedInAs('user-a'));
    familyNotice.leave('Asha left the book');
    joinedArrival.leave();
    s = run(s, [{ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: { kind: 'count', n: 0 } }, { type: 'SIGNED_OUT' }]);
    run(s, signedInAs('user-a'));
    expect(familyNotice.take()).toBeNull();
    expect(joinedArrival.waiting()).toBe(false);
    expect(joinedArrival.take()).toBe(false);
  });

  it('[BL-1501] an arrival A left is not read by B, with no clear in between (owner check)', () => {
    run(initialAuthState, signedInAs('user-a'));
    joinedArrival.leave();
    resetAuthStoreForTests();
    run(initialAuthState, signedInAs('user-b'));
    expect(joinedArrival.waiting()).toBe(false);
    expect(joinedArrival.take()).toBe(false);
  });
});
