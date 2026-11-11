/**
 * NX-38-R5 option A: a servers-on store build has no invite screen, no join link route and no join prompt. Its own flag,
 * `familySurfacesShown`, not the sign-in switch. A servers-off build is unchanged.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inviteScreensBlocked, planIncomingLink, visibleCoParentDoors } from '../src/lib/family/entry.logic';
import { invitedDoorShown } from '../src/lib/first-run/welcome.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const INVITE = { kind: 'invite', token: 'T' } as never;

describe('[NX-38-R5] the Build 12 profile has no co-parent entry point', () => {
  it('[NX-38-R5] the Build 12 profile has no co-parent entry point', () => {
    // develop's join-door rule (B12-5): servers on AND an alpha build. there is no constant that opens it in a store build (Karma ruling, 11 Nov 2026).
    // Store build: servers on, not alpha.
    expect(visibleCoParentDoors(true, false).joinButton).toBe(false);
    expect(inviteScreensBlocked({ serverFeatures: true, surfacesShown: false })).toBe(true);
    expect(invitedDoorShown({ alpha: false, coParent: true })).toBe(false);
    const plan = planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, alpha: false, path: '/j' });
    expect(plan).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
  });
  it('an alpha build keeps every surface', () => {
    expect(visibleCoParentDoors(true, true).joinButton).toBe(true);
    expect(inviteScreensBlocked({ serverFeatures: true, surfacesShown: true })).toBe(false);
    expect(invitedDoorShown({ alpha: true, coParent: true })).toBe(true);
    expect(planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, alpha: true, path: '/j' })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });
  it('a servers-off build is unchanged: nothing is blocked, and an invite link opens Home without a token (no coming-soon screen, 11 Nov 2026)', () => {
    expect(visibleCoParentDoors(false, false).joinButton).toBe(false);
    expect(inviteScreensBlocked({ serverFeatures: false, surfacesShown: false })).toBe(false);
    expect(planIncomingLink(INVITE, { serverFeatures: false, gateStopped: false, alpha: false, path: '/j' })).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
  });
  it('the link plan takes the build rule itself (alpha), so there is no second flag to forget', () => {
    expect(planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, alpha: true, path: '/j' })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });
  it('the flag is its own: it is not the sign-in switch or the capability list', () => {
    const t = src('lib/family/surfaces.ts');
    expect(t).not.toMatch(/signIn\b|signInEnabled/);
    expect(t).toMatch(/visibleCoParentDoors\(capabilities\.coParent, PLUS_ALPHA\)\.joinButton/);
  });
  it('the invite screens, the link route and the saved-token prompt each ask the flag', () => {
    expect(src('app/invite/_layout.tsx')).toContain('inviteScreensHidden()');
    expect(src('app/+native-intent.tsx')).toContain('alpha: PLUS_ALPHA');
    expect(src('lib/family/pending-invite-watcher.tsx')).toContain('inviteScreensHidden()');
  });
});
