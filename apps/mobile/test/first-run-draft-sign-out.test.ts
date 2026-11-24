/// <reference types="node" />
/**
 * [BL-2002] Every sign-out clears the first-run draft (a child name and date typed before the book is made), so the
 * next account does not open on the last person's answers. The shared step is forgetSignOutLeftovers
 * (lib/auth/sign-out-leftovers.ts); the provider calls it on each way a session ends, and only once the session is gone.
 * A sign-out that waits or is refused never reaches it, so its draft stays. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authReducer, initialAuthState, shouldFinishSignOut, type AuthEvent, type AuthState, type SyncGate } from '../src/lib/auth/machine.logic';
import { FIRST_RUN_DRAFT_SETTING, parseDraft, serializeDraft } from '../src/lib/first-run/draft.logic';

const h = vi.hoisted(() => ({ settings: new Map<string, string>(), calls: [] as string[], throwOnRead: false }));
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => {
    if (h.throwOnRead) throw new Error('store not open');
    return h.settings.get(k) ?? null;
  },
  deleteSetting: (k: string) => void h.settings.delete(k),
}));
vi.mock('../src/lib/auth/apple', () => ({ forgetAppleUser: async () => void h.calls.push('apple') }));
vi.mock('../src/lib/auth/pending', () => ({ clearPendingEmailRequest: async () => void h.calls.push('pending') }));

import { removeEverything } from '../src/lib/db/repos/wipe';
import { nodeDb } from './helpers/node-db';
import { forgetSignOutLeftovers } from '../src/lib/auth/sign-out-leftovers';
import { clearFirstRunDraft } from '../src/lib/first-run/draft';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const draft = serializeDraft({ step: 'child', names: ['Asha'], expecting: false, birthday: '2026-03-14', dueDate: null, signsAs: '' });

beforeEach(() => {
  h.settings.clear();
  h.calls.length = 0;
  h.throwOnRead = false;
  h.settings.set(FIRST_RUN_DRAFT_SETTING, draft);
});

describe('[BL-2002] the shared sign-out step', () => {
  it('clears the draft, the Apple user id and the pending email request', async () => {
    await forgetSignOutLeftovers();
    expect(h.settings.has(FIRST_RUN_DRAFT_SETTING)).toBe(false);
    expect(h.calls).toEqual(['apple', 'pending']);
  });

  it('the next account reads no draft', async () => {
    await forgetSignOutLeftovers();
    expect(parseDraft(h.settings.get(FIRST_RUN_DRAFT_SETTING) ?? null)).toBeNull();
  });

  it('touches no other setting (a book already made keeps its own)', async () => {
    h.settings.set('child.bornCardHidden.asha', '2026-03-01');
    await forgetSignOutLeftovers();
    expect([...h.settings.keys()]).toEqual(['child.bornCardHidden.asha']);
  });

  it('a store that cannot be read does not stop the Apple id and the pending request going', async () => {
    h.throwOnRead = true;
    await expect(forgetSignOutLeftovers()).resolves.toBeUndefined();
    expect(h.calls).toEqual(['apple', 'pending']);
  });

  it('clearing with no draft is a no-op', () => {
    h.settings.clear();
    expect(() => clearFirstRunDraft()).not.toThrow();
  });
});

describe('[BL-2002] a sign-out that has not finished keeps the draft', () => {
  const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
  const events: AuthEvent[] = [{ type: 'RESTORED', userId: 'u1' }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }];
  const signedIn: AuthState = events.reduce(authReducer, initialAuthState);

  it('letters still uploading: the machine waits, nothing finishes, so the shared step is never reached', () => {
    const waiting = authReducer(signedIn, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
    expect(shouldFinishSignOut(waiting)).toBe(false);
    expect(h.settings.get(FIRST_RUN_DRAFT_SETTING)).toBe(draft);
  });

  it('the provider only clears after the session is gone (the finishing effect awaits the Supabase sign-out first)', () => {
    const p = src('lib/auth/session-provider.tsx');
    const finishing = p.slice(p.indexOf('if (!finishing || !sb) return;'), p.indexOf('// An under-18 answer'));
    expect(finishing.indexOf("auth.signOut({ scope: 'local' })")).toBeGreaterThan(-1);
    expect(finishing.indexOf('forgetSignOutLeftovers')).toBeGreaterThan(finishing.indexOf("auth.signOut({ scope: 'local' })"));
  });
});

describe('[BL-2002] every way a session ends goes through the shared step', () => {
  const p = src('lib/auth/session-provider.tsx');

  it('no path forgets the Apple user id on its own any more', () => {
    expect(p).not.toMatch(/\bforgetAppleUser\(/);
  });

  it('Supabase ending the session, Settings, forced and "Try another way" (the finishing effect), and under-18 each call it', () => {
    expect(p.match(/forgetSignOutLeftovers\(\)/g)?.length).toBe(3);
  });

  it('every SIGNED_OUT dispatch follows the shared step', () => {
    const lines = p.split('\n');
    lines.forEach((l, i) => {
      if (l.includes("dispatch({ type: 'SIGNED_OUT' })")) expect(lines.slice(Math.max(0, i - 3), i).join('\n')).toContain('forgetSignOutLeftovers()');
    });
  });

  it('"Try another way" signs out through the provider, and onboarding keeps no delete of its own', () => {
    const o = src('app/onboarding.tsx');
    expect(o).toMatch(/signOut\(\)\.catch\(\(\) => undefined\)/);
    expect(o).not.toMatch(/deleteSetting\(/);
  });
});

describe('[BL-2002] Erase everything takes the draft with every other setting', () => {
  it('the rows step of the erase leaves no firstRun.draft (the pending mark and an active 18+ stop are all it keeps)', () => {
    const { db, close } = nodeDb();
    db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    for (const [k, v] of [[FIRST_RUN_DRAFT_SETTING, draft], ['appearance', 'dark'], ['erase.everything.pending', 'x']]) db.run('INSERT INTO settings (key, value) VALUES (?, ?)', k, v);
    removeEverything({ db } as never);
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key).sort()).toEqual(['erase.everything.pending']);
    close();
  });
});
