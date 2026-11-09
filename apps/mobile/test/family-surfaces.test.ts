/**
 * NX-38-R5 option A: a servers-on store build has no invite screen, no join link route and no join prompt. Its own flag,
 * `familySurfacesShown`, not the sign-in switch. A servers-off build is unchanged.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CO_PARENT_IN_STORE_BUILD, familySurfacesShown, inviteScreensBlocked } from '../src/lib/family/surfaces.logic';
import { planIncomingLink } from '../src/lib/family/entry.logic';
import { invitedDoorShown } from '../src/lib/first-run/welcome.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const INVITE = { kind: 'invite', token: 'T' } as never;

describe('[NX-38-R5] the Build 12 profile has no co-parent entry point', () => {
  it('[NX-38-R5] the Build 12 profile has no co-parent entry point', () => {
    expect(CO_PARENT_IN_STORE_BUILD).toBe(false);
    // Store build: servers on, not alpha.
    expect(familySurfacesShown({ alpha: false, coParent: true })).toBe(false);
    expect(inviteScreensBlocked({ serverFeatures: true, surfacesShown: false })).toBe(true);
    expect(invitedDoorShown({ alpha: false, coParent: true })).toBe(false);
    const plan = planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, path: '/j', familySurfaces: false });
    expect(plan).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
  });
  it('an alpha build keeps every surface', () => {
    expect(familySurfacesShown({ alpha: true, coParent: true })).toBe(true);
    expect(inviteScreensBlocked({ serverFeatures: true, surfacesShown: true })).toBe(false);
    expect(invitedDoorShown({ alpha: true, coParent: true })).toBe(true);
    expect(planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, path: '/j', familySurfaces: true })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });
  it('a servers-off build is unchanged: nothing is blocked, and an invite link still opens coming soon without a token', () => {
    expect(familySurfacesShown({ alpha: false, coParent: false })).toBe(false);
    expect(inviteScreensBlocked({ serverFeatures: false, surfacesShown: false })).toBe(false);
    expect(planIncomingLink(INVITE, { serverFeatures: false, gateStopped: false, path: '/j' })).toEqual({ route: '/invite', keepInviteToken: false, keepAuthLink: false });
  });
  it('leaving familySurfaces out keeps every earlier caller as it was', () => {
    expect(planIncomingLink(INVITE, { serverFeatures: true, gateStopped: false, path: '/j' })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });
  it('the flag is its own: it is not the sign-in switch or the capability list', () => {
    const t = src('lib/family/surfaces.logic.ts');
    expect(t).not.toMatch(/signIn|serverFeaturesEnabled|capabilities/);
  });
  it('the invite screens, the link route and the saved-token prompt each ask the flag', () => {
    expect(src('app/invite/_layout.tsx')).toContain('inviteScreensHidden()');
    expect(src('app/+native-intent.tsx')).toContain('familySurfaces: !inviteScreensHidden()');
    expect(src('lib/family/pending-invite-watcher.tsx')).toContain('inviteScreensHidden()');
  });
});
