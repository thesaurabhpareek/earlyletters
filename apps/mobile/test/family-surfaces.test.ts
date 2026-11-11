/**
 * NX-38-R5 option A: a servers-on store build has no invite screen, no join link route and no join prompt. Its own flag,
 * `familySurfacesShown`, not the sign-in switch. A servers-off build is unchanged.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { familySurfacesFrom, inviteScreensBlocked, inviteScreensHiddenFrom, planIncomingLink, visibleCoParentDoors } from '../src/lib/family/entry.logic';
import { invitedDoorShown } from '../src/lib/first-run/welcome.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const INVITE = { kind: 'invite', token: 'T' } as never;

describe('[NX-38-R5] the Build 12 profile has no co-parent entry point', () => {
  it('a servers-on store build has no join door, no invite screen and sends an invite link to Tonight', () => {
    // develop's join-door rule (B12-5): servers on AND an alpha build. #720 adds the one constant that can open it in a store build.
    // Store build: servers on, not alpha.
    expect(visibleCoParentDoors(true, false).joinButton).toBe(false);
    expect(inviteScreensBlocked({ serverFeatures: true, surfacesShown: false })).toBe(true);
    expect(invitedDoorShown({ alpha: false, coParent: true })).toBe(false);
    const plan = planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, path: '/j', familySurfaces: false });
    expect(plan).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
  });
  it('an alpha build keeps every surface', () => {
    expect(visibleCoParentDoors(true, true).joinButton).toBe(true);
    expect(inviteScreensBlocked({ serverFeatures: true, surfacesShown: true })).toBe(false);
    expect(invitedDoorShown({ alpha: true, coParent: true })).toBe(true);
    expect(planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, path: '/j', familySurfaces: true })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });
  it('a servers-off build is unchanged: nothing is blocked, and an invite link still opens coming soon without a token', () => {
    expect(visibleCoParentDoors(false, false).joinButton).toBe(false);
    expect(inviteScreensBlocked({ serverFeatures: false, surfacesShown: false })).toBe(false);
    expect(planIncomingLink(INVITE, { serverFeatures: false, gateStopped: false, path: '/j' })).toEqual({ route: '/invite', keepInviteToken: false, keepAuthLink: false });
  });
  it('leaving familySurfaces out keeps every earlier caller as it was', () => {
    expect(planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, path: '/j' })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });
  it('familySurfacesFrom is true only with servers on and an alpha build', () => {
    expect(familySurfacesFrom({ coParent: true, alpha: true })).toBe(true);
    expect(familySurfacesFrom({ coParent: true, alpha: false })).toBe(false);
    expect(familySurfacesFrom({ coParent: false, alpha: true })).toBe(false);
    expect(familySurfacesFrom({ coParent: false, alpha: false })).toBe(false);
  });
  it('inviteScreensHiddenFrom hides only in a servers-on store build, and every other build keeps the screens', () => {
    const cases: Array<[boolean, boolean, boolean]> = [
      // serverFeatures, coParent, alpha -> hidden
      [true, true, false],
    ];
    for (const [serverFeatures, coParent, alpha] of cases) expect(inviteScreensHiddenFrom({ serverFeatures, coParent, alpha })).toBe(true);
    expect(inviteScreensHiddenFrom({ serverFeatures: true, coParent: true, alpha: true })).toBe(false);
    expect(inviteScreensHiddenFrom({ serverFeatures: false, coParent: false, alpha: false })).toBe(false);
    expect(inviteScreensHiddenFrom({ serverFeatures: false, coParent: false, alpha: true })).toBe(false);
  });
  it('inviteScreensHiddenFrom over all 8 rows of servers x coParent x alpha is serverFeatures && !(coParent && alpha)', () => {
    const rows: Array<[boolean, boolean, boolean, boolean]> = [
      // serverFeatures, coParent, alpha -> hidden
      [false, false, false, false],
      [false, false, true, false],
      [false, true, false, false],
      [false, true, true, false],
      [true, false, false, true],
      [true, false, true, true],
      [true, true, false, true],
      [true, true, true, false],
    ];
    for (const [serverFeatures, coParent, alpha, hidden] of rows) {
      expect(inviteScreensHiddenFrom({ serverFeatures, coParent, alpha }), `servers ${serverFeatures} coParent ${coParent} alpha ${alpha}`).toBe(hidden);
      expect(hidden).toBe(serverFeatures && !(coParent && alpha));
    }
  });
  it('the flag is its own: it is not the sign-in switch or the capability list', () => {
    const t = src('lib/family/surfaces.ts') + src('lib/family/entry.logic.ts');
    expect(t).not.toMatch(/signIn\b|signInEnabled/);
    expect(src('lib/family/surfaces.ts')).toMatch(/inviteScreensHiddenFrom\(\{ serverFeatures: serverFeaturesEnabled\(\), coParent: capabilities\.coParent, alpha: PLUS_ALPHA \}\)/);
    expect(src('lib/family/entry.logic.ts')).toMatch(/visibleCoParentDoors\(input\.coParent, input\.alpha\)\.joinButton/);
  });
  it('the invite screens, the link route and the saved-token prompt each ask the flag', () => {
    expect(src('app/invite/_layout.tsx')).toContain('inviteScreensHidden()');
    expect(src('app/+native-intent.tsx')).toContain('familySurfaces: !inviteScreensHidden()');
    expect(src('lib/family/pending-invite-watcher.tsx')).toContain('inviteScreensHidden()');
  });
});
