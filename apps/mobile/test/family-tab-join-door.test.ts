/// <reference types="node" />
/**
 * Review B on #737: the Family tab and the child Settings row "Write this book together" are co-parent doors. They follow the
 * one join-door rule (entry.logic.ts visibleCoParentDoors), so a store build shows neither, servers on or off. Alpha builds keep both.
 * Review A on #737: inviteScreensHidden() must read the real server switch (surfaces.ts), run here with the capability list and
 * the alpha flag mocked.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familySurfacesShown, visibleCoParentDoors } from '../src/lib/family/entry.logic';
import { useAnotherBusy } from '../src/lib/first-run/account-books.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

describe('the Family tab and the Settings row follow the join-door rule', () => {
  it('a store build shows neither, with servers on or off', () => {
    expect(familySurfacesShown({ alpha: false, coParent: true })).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: false })).toBe(false);
  });
  it('every alpha build keeps both, servers on or off', () => {
    expect(familySurfacesShown({ alpha: true, coParent: true })).toBe(true);
    expect(familySurfacesShown({ alpha: true, coParent: false })).toBe(true);
  });
  it('a store build would show them only if the join door opened', () => {
    for (const coParent of [true, false]) expect(familySurfacesShown({ alpha: false, coParent })).toBe(visibleCoParentDoors(coParent, false).joinButton);
  });
  it('the tab and the row both ask familySurfacesShown, and there is no second rule', () => {
    expect(src('app/(tabs)/_layout.tsx')).toContain('familySurfacesShown({ alpha: PLUS_ALPHA, coParent: capabilities.coParent })');
    expect(src('app/settings/children/[id].tsx')).toContain('familySurfacesShown({ alpha: PLUS_ALPHA, coParent: capabilities.coParent })');
    expect(src('lib/family/entry.logic.ts')).toMatch(/visibleCoParentDoors\(input\.coParent, input\.alpha\)\.joinButton/);
  });
});

describe('"Use another account" is busy while a press or a waiting sign-out is in flight', () => {
  it('is free on a ready session, busy while pressing or signing out', () => {
    expect(useAnotherBusy({ pressing: false, authStatus: 'ready' })).toBe(false);
    expect(useAnotherBusy({ pressing: true, authStatus: 'ready' })).toBe(true);
    expect(useAnotherBusy({ pressing: false, authStatus: 'signingOut' })).toBe(true);
    expect(useAnotherBusy({ pressing: false, authStatus: 'signedOut' })).toBe(false);
  });
  it('the screen no longer drops the sign-out result', () => {
    expect(src('app/onboarding.tsx')).not.toContain('void signOut()');
    expect(src('app/onboarding.tsx')).toContain('.catch(');
  });
});

describe('inviteScreensHidden() reads the server switch (surfaces.ts wiring)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/capabilities');
    vi.doUnmock('@/lib/billing/alpha');
  });
  async function load(o: { servers: boolean; alpha: boolean }) {
    vi.resetModules();
    vi.doMock('@/lib/capabilities', () => ({ capabilities: { coParent: o.servers }, serverFeaturesEnabled: () => o.servers }));
    vi.doMock('@/lib/billing/alpha', () => ({ PLUS_ALPHA: o.alpha }));
    return import('../src/lib/family/surfaces');
  }
  it('hides only in a servers-on store build', async () => {
    expect((await load({ servers: true, alpha: false })).inviteScreensHidden()).toBe(true);
    expect((await load({ servers: false, alpha: false })).inviteScreensHidden()).toBe(false);
    expect((await load({ servers: true, alpha: true })).inviteScreensHidden()).toBe(false);
    expect((await load({ servers: false, alpha: true })).inviteScreensHidden()).toBe(false);
  });
  it('there is ONE reader of the switch: surfaces.ts exports inviteScreensHidden only, and passes the build flag as it is (review A mutant)', async () => {
    expect(Object.keys(await load({ servers: true, alpha: false })).sort()).toEqual(['inviteScreensHidden']);
    const t = src('lib/family/surfaces.ts');
    expect(t).toContain('coParent: capabilities.coParent, alpha: PLUS_ALPHA }');
    expect(t).not.toMatch(/alpha: (true|false)|familySurfacesOn/);
  });
});
