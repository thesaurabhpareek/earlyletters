/// <reference types="node" />
/**
 * Co-parent sharing follows one switch (capabilities.coParent, EXPO_PUBLIC_SERVER_FEATURES).
 * On (D-100, drafted as D-089; the TestFlight alpha of D-106): "I was invited" is back on
 * Welcome and every entry opens its real flow. Off (the kill path), and in a store build before a family release
 * (founder, 11 Nov 2026): nothing is shown. There is no coming-soon tab, row or screen; an entry point that is still
 * reached sends the person to Tonight, and deep links keep nothing they could not use.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { familyCopy } from '@scribe/content';
import { classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { existsSync } from 'node:fs';
import { isAlphaBuild } from '../src/lib/billing/alpha';
import { allowedLinkRoute, INVITE_ENTRIES, inviteDestination, inviteHref, LEAVE_BOOK_OFFERED, LINK_ROUTE_ALLOWLIST, planIncomingLink, visibleCoParentDoors } from '../src/lib/family/entry.logic';

const APP = join(__dirname, '..');
const src = (p: string) => readFileSync(join(APP, 'src', p), 'utf8');
const CFG = { origin: brand.web.origin, scheme: brand.scheme };
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';

describe('every invite entry point has no flow when server features are off (nothing is shown; the route sends the person to Tonight)', () => {
  it('covers the seven entry points', () => {
    expect([...INVITE_ENTRIES].sort()).toEqual(['family_tab', 'invite_join', 'invite_leave', 'invite_link', 'invite_new', 'onboarding_join', 'settings_child']);
  });

  it('off: coming soon, every one; on: the real flow (leave waits for D-113)', () => {
    for (const e of INVITE_ENTRIES) {
      expect(inviteDestination(e, false, true), e).toBe('coming_soon');
      expect(inviteDestination(e, true, true), e).toBe(e === 'invite_leave' ? 'coming_soon' : 'flow');
    }
  });

  it('buttons and rows that are still pushed go to /invite, which redirects to Tonight (never sign-in)', () => {
    expect(inviteHref('settings_child', false, true, 'child-1')).toBe('/invite?childId=child-1');
    expect(inviteHref('onboarding_join', false, true)).toBe('/invite');
    expect(inviteHref('family_tab', false, true, null)).toBe('/invite');
    for (const e of ['settings_child', 'onboarding_join', 'family_tab'] as const) expect(inviteHref(e, false, true, 'x')).not.toMatch(/sign-in|\/invite\/new/);
    // v1.1: the invite flow itself.
    expect(inviteHref('settings_child', true, true, 'child-1')).toBe('/invite/new?childId=child-1');
    expect(inviteHref('onboarding_join', true, true)).toBe('/invite');
  });

  it('the screens use the switch: the family route, both invite routes, the child row, first run', () => {
    expect(src('app/family.tsx')).toMatch(/inviteDestination\('family_tab', serverFeaturesEnabled\(\), PLUS_ALPHA\) === 'flow' \? <FamilyShared \/> : <Redirect href="\/" \/>/);
    expect(src('app/invite/index.tsx')).toMatch(/inviteDestination\('invite_join', serverFeaturesEnabled\(\), PLUS_ALPHA\) === 'flow' \? <JoinBook \/> : <Redirect href="\/" \/>/);
    expect(src('app/invite/new.tsx')).toMatch(/inviteDestination\('invite_new', serverFeaturesEnabled\(\), PLUS_ALPHA\) === 'flow' \? <InviteCoParent \/> : <Redirect href="\/" \/>/);
    expect(src('app/invite/leave.tsx')).toMatch(/inviteDestination\('invite_leave', serverFeaturesEnabled\(\), PLUS_ALPHA\) === 'flow' \? <LeaveBook \/> : serverFeaturesEnabled\(\) && PLUS_ALPHA \? <LeaveLater \/> : <Redirect href="\/" \/>/);
    expect(src('app/settings/children/[id].tsx')).toMatch(/inviteHref\('settings_child', serverFeaturesEnabled\(\), PLUS_ALPHA, child\.id\)/);
    expect(src('app/onboarding.tsx')).toMatch(/inviteHref\('onboarding_join', capabilities\.coParent, PLUS_ALPHA\)/);
  });

  it('sign-in is never offered with the switch off', () => {
    expect(src('app/(auth)/_layout.tsx')).toMatch(/capabilities\.signIn \? <AuthStack \/> : <Redirect href="\/" \/>/);
    expect(src('app/settings/account.tsx')).toMatch(/capabilities\.signIn \? <AccountSettings \/> : <Redirect href="\/settings" \/>/);
    // The Delete account page also needs its own switch (capabilities.accountDeletion, which includes this one); see account-deletion-switch.test.ts.
    expect(src('app/settings/delete-account.tsx')).toMatch(/capabilities\.accountDeletion \? <DeleteAccount \/> : <Redirect href="\/settings" \/>/);
    expect(src('app/onboarding.tsx')).toMatch(/capabilities\.signIn \? \(\s*<Button[^>]*signInButton/);
    // The Keep the book offer (lib/asks) reads `auth.configured`, which is false when no client exists.
    expect(src('app/review.tsx')).toMatch(/askAfterSave\(\{ firstLetter, signInOffered: auth\.configured && /);
  });
});

describe('deep links with server features off', () => {
  const off = { serverFeatures: false, gateStopped: false, alpha: true };
  const on = { serverFeatures: true, gateStopped: false, alpha: true };

  it('an invite link opens Tonight and keeps no token', () => {
    const path = `https://earlyletters.com/j#t=${TOKEN}`;
    const link = classifyIncomingUrl(path, CFG);
    expect(link.kind).toBe('invite');
    expect(planIncomingLink(link, { ...off, path })).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
    expect(planIncomingLink(link, { ...on, path })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });

  it('the 18+ stop still wins', () => {
    const path = `https://earlyletters.com/j#t=${TOKEN}`;
    const link = classifyIncomingUrl(path, CFG);
    expect(planIncomingLink(link, { serverFeatures: false, gateStopped: true, alpha: true, path }).route).toBe('/');
  });

  it('sign-in links open home and keep nothing', () => {
    const p1 = `https://earlyletters.com/auth/callback#token_hash=${HASH}&type=email`;
    const l1 = classifyIncomingUrl(p1, CFG);
    expect(l1.kind).toBe('auth-link');
    expect(planIncomingLink(l1, { ...off, path: p1 })).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
    expect(planIncomingLink(l1, { ...on, path: p1 })).toEqual({ route: '/sign-in/verify', keepInviteToken: false, keepAuthLink: true });
    const p2 = `${brand.scheme}://auth/callback`;
    const l2 = classifyIncomingUrl(p2, CFG);
    expect(l2.kind).toBe('auth-code');
    expect(planIncomingLink(l2, { ...off, path: p2 }).route).toBe('/');
    expect(planIncomingLink(l2, { ...on, path: p2 }).route).toBe('/sign-in/code');
  });

  it('unclassified links are an allowlist: home and the invite landing, everything else goes home (D-087)', () => {
    expect([...LINK_ROUTE_ALLOWLIST]).toEqual(['/', '/invite']);
    const other = (path: string) => planIncomingLink({ kind: 'other' }, { ...off, path });
    expect(other('/').route).toBe('/');
    expect(other('/invite').route).toBe('/invite');
    expect(other('scribe://invite').route).toBe('/invite');
    // Nothing that starts a recording, opens a draft, plays audio, deletes or does not exist.
    for (const p of [
      'scribe://listen',
      '/listen',
      'https://earlyletters.com/listen',
      '/review?draftId=x',
      'scribe://review?draftId=x',
      '/read-together',
      '/settings/delete-account',
      '/letter/abc',
      '/write',
      '/book',
      '/settings',
      '/not-a-screen',
      '/_sitemap',
      'https://earlyletters.com/privacy',
      '//listen',
      '/%6Cisten',
      '',
    ]) {
      expect(other(p).route, p).toBe('/');
    }
    expect(other('/invite?childId=x').route).toBe('/invite'); // the query is dropped: only the path is allowed
    expect(allowedLinkRoute('/Invite/')).toBe('/invite');
    expect(other('/letter/abc').keepInviteToken).toBe(false);
    expect(other('/letter/abc').keepAuthLink).toBe(false);
  });

  it('a provider redirect is still left alone', () => {
    expect(planIncomingLink({ kind: 'provider-redirect' }, { ...off, path: 'x' }).route).toBeNull();
  });

  it('with server features on the allowlist is the same (no screen is added by that switch)', () => {
    expect(planIncomingLink({ kind: 'other' }, { ...on, path: '/review?draftId=x' }).route).toBe('/');
    expect(planIncomingLink({ kind: 'other' }, { ...on, path: '/listen' }).route).toBe('/');
  });

  it('+native-intent follows the plan', () => {
    const intent = src('app/+native-intent.tsx');
    expect(intent).toMatch(/planIncomingLink\(link, \{ serverFeatures: serverFeaturesEnabled\(\)/);
    expect(intent).toMatch(/if \(plan\.keepInviteToken && link\.kind === 'invite'\) await savePendingInvite/);
  });
});

describe('the co-parent coming-soon presentation is gone (founder, 11 Nov 2026)', () => {
  it('no screen, no component, no local "tell me" flag and no analytics event is drawn for it', () => {
    for (const f of ['components/family/coparent-soon.tsx', 'components/family/invite-coming-soon.tsx', 'lib/family/coming-soon.logic.ts']) expect(existsSync(join(APP, 'src', f)), f).toBe(false);
    for (const f of ['app/family.tsx', 'app/invite/index.tsx', 'app/invite/new.tsx', 'app/invite/leave.tsx', 'app/(tabs)/_layout.tsx', 'app/settings/children/[id].tsx']) {
      expect(src(f), f).not.toMatch(/coparent_soon_opened|CoParentSoon|InviteComingSoon|familyCopy\.soon\.(settingsRow|storeBuild)/);
    }
  });
});

describe('the words of familyCopy.soon stay in packages/content for the later family release; nothing draws them now', () => {
  const s = familyCopy.soon;
  it('names the status plainly and promises no date', () => {
    expect(s.status).toBe('Coming soon');
    const all = JSON.stringify(s);
    expect(all).not.toMatch(/\b(January|February|March|April|May|June|July|August|September|October|November|December|20\d\d|weeks?|months?|days?|beta)\b/i);
  });

  it('personalises with {child} and never genders the child', () => {
    expect(s.lead).toContain('{child}');
    expect(JSON.stringify(s)).not.toMatch(/\b(she|he|her|him|his|hers)\b/i);
  });

  it('rewrite B (founder, 8 Nov 2026): a heading and one line, word for word; the quiet title matches', () => {
    expect(`${s.title} ${s.lead}`).toBe("For now, this book is yours. In a later update, {child}'s other parent can add letters too, from their own phone.");
    expect(s.quiet.title).toBe('For now, this book is yours.');
  });

  it('no badge, points or footer: the footer said letters stay on this phone, and recordings are also in the iPhone backup', () => {
    const soon = s as Record<string, unknown>;
    expect(soon.points).toBeUndefined();
    expect(soon.building).toBeUndefined();
    expect((s as Record<string, unknown>).storeBuild).toBeUndefined();
  });
});

describe('doors that would lead nowhere are hidden (D-087, amended by D-100; BL-391 rescoped)', () => {
  it('off: no "I was invited"; on in an alpha build: "I was invited" is back (D-100 amends D-087)', () => {
    expect(visibleCoParentDoors(false, true).joinButton).toBe(false);
    expect(visibleCoParentDoors(true, true).joinButton).toBe(true);
  });

  // B12-5. Mutation: make joinButton `coParent` alone (the old rule) and the store assertions below fail.
  it('[B12-5] the store build hides "I was invited" even with servers on; alpha, preview and testflight keep it', () => {
    for (const env of ['development', 'preview'] as const) expect(visibleCoParentDoors(true, isAlphaBuild(env)).joinButton, env).toBe(true);
    expect(visibleCoParentDoors(true, isAlphaBuild('production')).joinButton).toBe(false);
    expect(visibleCoParentDoors(false, isAlphaBuild('production')).joinButton).toBe(false);
    expect(visibleCoParentDoors(false, isAlphaBuild('preview')).joinButton).toBe(false);
  });

  it('[B12-5] both screens pass the build rule, not the bare switch', () => {
    expect(src('app/onboarding.tsx')).toMatch(/visibleCoParentDoors\(capabilities\.coParent, PLUS_ALPHA\)/);
    expect(src('app/settings/children/[id].tsx')).toMatch(/visibleCoParentDoors\(serverFeaturesEnabled\(\), PLUS_ALPHA\)/);
  });

  it('[F11-REQ-003] "Family can read" is the family-contributor switch: hidden in both builds (contributors are absent from v1.0, B1, D4)', () => {
    expect(visibleCoParentDoors(false, true).familyCanReadSwitch).toBe(false);
    expect(visibleCoParentDoors(true, true).familyCanReadSwitch).toBe(false);
  });

  it('first run and child settings render them only through that rule', () => {
    const onboarding = src('app/onboarding.tsx');
    expect(onboarding).toMatch(/visibleCoParentDoors\(capabilities\.coParent, PLUS_ALPHA\)/);
    expect(onboarding).toMatch(/doors\.joinButton \?/);
    const child = src('app/settings/children/[id].tsx');
    expect(child).toMatch(/doors\.familyCanReadSwitch &&/);
  });

  it('what stays: the family route, the Settings row and the invite landing have no flow; the row is absent and the landing redirects', () => {
    expect(inviteDestination('family_tab', false, true)).toBe('coming_soon');
    expect(inviteDestination('settings_child', false, true)).toBe('coming_soon');
    expect(inviteDestination('invite_link', false, true)).toBe('coming_soon');
    expect(src('app/settings/children/[id].tsx')).not.toMatch(/familyCopy\.soon/);
    expect(src('app/(tabs)/_layout.tsx')).not.toMatch(/name="family"|t\.family/);
  });
});

describe('server features on: the shared flows are live (D-100; option B for the alpha, D-106)', () => {
  it('Welcome shows "I was invited", and it opens the join sheet', () => {
    expect(visibleCoParentDoors(true, true).joinButton).toBe(true);
    expect(inviteHref('onboarding_join', true, true)).toBe('/invite');
    expect(familyCopy.accept.invitedTitle).toBe('You were invited to a book');
  });

  it('the Family tab is the live view: members, open invites and the invite card', () => {
    const tab = src('app/family.tsx');
    expect(tab).toMatch(/inviteDestination\('family_tab', serverFeaturesEnabled\(\), PLUS_ALPHA\) === 'flow' \? <FamilyShared \/> : <Redirect href="\/" \/>/);
    expect(tab).toMatch(/familyTabState\(/);
    expect(tab).toMatch(/state\.showInviteCard &&/);
  });

  it('the invite card opens the invite sheet signed in or not, like a child\'s settings row: one flow, its AccountGate signs in', () => {
    const tab = src('app/family.tsx');
    expect(tab).toMatch(/const invite = \(\) => \{[\s\S]*?router\.push\(\{ pathname: '\/invite\/new', params: \{ childId: active\.id \} \}\);\s*\};/);
    expect(tab).not.toMatch(/pathname: '\/sign-in'/);
    expect(src('app/invite/new.tsx')).toMatch(/<AccountGate trigger="invite_create"/);
  });

  it('[D-113] build 2 offers no Leave: no row on the Family tab or in a child\'s settings, and /invite/leave shows coming soon', () => {
    expect(LEAVE_BOOK_OFFERED).toBe(false);
    for (const serverFeatures of [false, true]) expect(inviteDestination('invite_leave', serverFeatures, true)).toBe('coming_soon');
    for (const screen of ['app/family.tsx', 'app/settings/children/[id].tsx']) {
      const code = src(screen).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(code, screen).not.toMatch(/\/invite\/leave|testID="family\.leave"|state\.canLeave|leave\.row/);
    }
    // The route stays, behind the same switch as every invite route, so the sheet returns with left books.
    // With sharing on it says only that leaving comes later: the co-parent teaser's "letters stay on this
    // phone" would not be true once a book is shared.
    const leave = src('app/invite/leave.tsx');
    expect(leave).toMatch(/inviteDestination\('invite_leave', serverFeaturesEnabled\(\), PLUS_ALPHA\) === 'flow' \? <LeaveBook \/> : serverFeaturesEnabled\(\) && PLUS_ALPHA \? <LeaveLater \/> : <Redirect href="\/" \/>/);
    expect(leave).toMatch(/familyCopy\.leave\.later/);
    expect(familyCopy.leave.later).toBe('Leaving a shared book is coming in a later update.');
    expect(leave).toMatch(/D-113/);
  });

  it('a child\'s settings row opens the invite itself, not a sign-in sheet or coming soon', () => {
    expect(inviteHref('settings_child', true, true, 'child-1')).toBe('/invite/new?childId=child-1');
    expect(inviteHref('family_tab', true, true, 'child-1')).toBe('/invite/new?childId=child-1');
  });

  it('[A-REQ-028] an invite link keeps its token for the join sheet; the 18+ stop still drops it', () => {
    const path = `https://earlyletters.com/j#t=${TOKEN}`;
    const link = classifyIncomingUrl(path, CFG);
    expect(planIncomingLink(link, { serverFeatures: true, gateStopped: false, alpha: true, path })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
    expect(planIncomingLink(link, { serverFeatures: true, gateStopped: true, alpha: true, path })).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
  });

  it('[D-087] no link opens the invite-making or leave screens, with the switch on or off', () => {
    for (const serverFeatures of [false, true]) {
      for (const p of ['/invite/new', '/invite/new?childId=x', '/invite/leave', '/invite/leave?childId=x', 'scribe://invite/leave', 'https://earlyletters.com/invite/new']) {
        expect(planIncomingLink({ kind: 'other' }, { serverFeatures, gateStopped: false, alpha: true, path: p }).route, p).toBe('/');
      }
    }
  });

  it('the pending-invite watcher opens the join sheet only where the build has the flow (the one rule), and drops a leftover token otherwise', () => {
    // Behaviour is in test/pending-invite-watcher.test.ts; this pins that the watcher asks the one rule, not the switch alone.
    const watcher = src('lib/family/pending-invite-watcher.tsx');
    expect(watcher).toMatch(/if \(inviteDestination\('invite_link', serverFeaturesEnabled\(\), PLUS_ALPHA\) !== 'flow'\) \{\s*void clearPendingInvite\(\);\s*return;\s*\}/);
    expect(watcher).not.toMatch(/if \(!serverFeaturesEnabled\(\)\) return;/);
  });
});
