/// <reference types="node" />
/**
 * Co-parent sharing is coming soon in v1.0 (founder decision, 3 Oct 2026):
 * every invite entry point leads to the coming-soon presentation, deep links
 * keep nothing they could not use, and "Tell me when it's here" is a local flag.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { familyCopy } from '@scribe/content';
import { classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { COPARENT_NOTIFY_KEY, coParentNotifyRequestedOn, hasRequestedCoParentNotify, requestCoParentNotify } from '../src/lib/family/coming-soon.logic';
import { allowedLinkRoute, INVITE_ENTRIES, inviteDestination, inviteHref, LINK_ROUTE_ALLOWLIST, planIncomingLink, visibleCoParentDoors } from '../src/lib/family/entry.logic';

const APP = join(__dirname, '..');
const src = (p: string) => readFileSync(join(APP, 'src', p), 'utf8');
const CFG = { origin: brand.web.origin, scheme: brand.scheme };
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';

describe('every invite entry point leads to coming soon when server features are off', () => {
  it('covers the six entry points', () => {
    expect([...INVITE_ENTRIES].sort()).toEqual(['family_tab', 'invite_join', 'invite_link', 'invite_new', 'onboarding_join', 'settings_child']);
  });

  it('off: coming soon, every one; on: the real flow', () => {
    for (const e of INVITE_ENTRIES) {
      expect(inviteDestination(e, false), e).toBe('coming_soon');
      expect(inviteDestination(e, true), e).toBe('flow');
    }
  });

  it('buttons and rows push the invite modal, which presents coming soon (never sign-in)', () => {
    expect(inviteHref('settings_child', false, 'child-1')).toBe('/invite?childId=child-1');
    expect(inviteHref('onboarding_join', false)).toBe('/invite');
    expect(inviteHref('family_tab', false, null)).toBe('/invite');
    for (const e of ['settings_child', 'onboarding_join', 'family_tab'] as const) expect(inviteHref(e, false, 'x')).not.toMatch(/sign-in|\/invite\/new/);
    // v1.1: the invite flow itself.
    expect(inviteHref('settings_child', true, 'child-1')).toBe('/invite/new?childId=child-1');
    expect(inviteHref('onboarding_join', true)).toBe('/invite');
  });

  it('the screens use the switch: Family tab, both invite routes, the child row, first run', () => {
    expect(src('app/(tabs)/family.tsx')).toMatch(/capabilities\.coParent \? <FamilyShared \/> : <FamilySoon \/>/);
    expect(src('app/invite/index.tsx')).toMatch(/inviteDestination\('invite_join', serverFeaturesEnabled\(\)\) === 'flow' \? <JoinBook \/> : <InviteComingSoon \/>/);
    expect(src('app/invite/new.tsx')).toMatch(/inviteDestination\('invite_new', serverFeaturesEnabled\(\)\) === 'flow' \? <InviteCoParent \/> : <InviteComingSoon \/>/);
    expect(src('app/settings/children/[id].tsx')).toMatch(/inviteHref\('settings_child', serverFeaturesEnabled\(\), child\.id\)/);
    expect(src('app/onboarding.tsx')).toMatch(/inviteHref\('onboarding_join', capabilities\.coParent\)/);
  });

  it('sign-in is never offered with the switch off', () => {
    expect(src('app/(auth)/_layout.tsx')).toMatch(/capabilities\.signIn \? <AuthStack \/> : <Redirect href="\/" \/>/);
    expect(src('app/settings/account.tsx')).toMatch(/capabilities\.signIn \? <AccountSettings \/> : <Redirect href="\/settings" \/>/);
    expect(src('app/settings/delete-account.tsx')).toMatch(/capabilities\.signIn \? <DeleteAccount \/> : <Redirect href="\/settings" \/>/);
    expect(src('app/onboarding.tsx')).toMatch(/capabilities\.signIn \? \(\s*<Button[^>]*signInButton/);
    // The first-letter offer reads `auth.configured`, which is false when no client exists.
    expect(src('app/review.tsx')).toMatch(/offerSignIn\.current = firstLetter && auth\.configured/);
  });
});

describe('deep links with server features off', () => {
  const off = { serverFeatures: false, gateStopped: false };
  const on = { serverFeatures: true, gateStopped: false };

  it('an invite link opens coming soon and keeps no token', () => {
    const path = `https://earlyletters.com/i/${TOKEN}`;
    const link = classifyIncomingUrl(path, CFG);
    expect(link.kind).toBe('invite');
    expect(planIncomingLink(link, { ...off, path })).toEqual({ route: '/invite', keepInviteToken: false, keepAuthLink: false });
    expect(planIncomingLink(link, { ...on, path })).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });

  it('the 18+ stop still wins', () => {
    const path = `https://earlyletters.com/i/${TOKEN}`;
    const link = classifyIncomingUrl(path, CFG);
    expect(planIncomingLink(link, { serverFeatures: false, gateStopped: true, path }).route).toBe('/');
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

describe('"Tell me when it\'s here": a local flag only', () => {
  const store = () => {
    const m = new Map<string, string>();
    return { m, getSetting: (k: string) => m.get(k) ?? null, setSetting: (k: string, v: string) => void m.set(k, v) };
  };

  it('starts unset, stores the day once, and stays set', () => {
    const s = store();
    expect(hasRequestedCoParentNotify(s)).toBe(false);
    expect(requestCoParentNotify(s, new Date('2026-10-03T21:15:00Z'))).toBe('2026-10-03');
    expect(s.m.get(COPARENT_NOTIFY_KEY)).toBe('2026-10-03');
    expect(hasRequestedCoParentNotify(s)).toBe(true);
    expect(requestCoParentNotify(s, new Date('2026-11-01T08:00:00Z'))).toBe('2026-10-03');
    expect([...s.m.keys()]).toEqual([COPARENT_NOTIFY_KEY]);
  });

  it('keeps a day, never a time, and ignores anything else', () => {
    const s = store();
    s.m.set(COPARENT_NOTIFY_KEY, 'yes');
    expect(coParentNotifyRequestedOn(s)).toBeNull();
    s.m.set(COPARENT_NOTIFY_KEY, '2026-10-03T21:15:00Z');
    expect(coParentNotifyRequestedOn(s)).toBeNull();
  });

  it('touches no network or account; counts only two content-free taps (the logic and the component)', () => {
    const logic = src('lib/family/coming-soon.logic.ts');
    expect(logic).not.toMatch(/^import /m);
    const ui = src('components/family/coparent-soon.tsx');
    const imports = ui.split('\n').filter((l) => l.startsWith('import ')).join('\n');
    expect(imports).not.toMatch(/supabase|lib\/auth|lib\/sync/);
    expect(ui).not.toMatch(/fetch\(|capture\(/);
    const tracked = [...ui.matchAll(/track\('([a-z_]+)'(.*)\)/g)];
    expect(tracked.map((m) => m[1]).sort()).toEqual(['coparent_soon_notify', 'coparent_soon_opened']);
    // No child name, book name, text or date in the properties.
    expect(tracked.map((m) => m[2]).join(' ')).not.toMatch(/child|name|text|date|body/i);
  });

  it('the notify line says only what is true today', () => {
    expect(familyCopy.soon.notify.done).toBe('Noted on this phone. When the update arrives, you will see it here.');
    expect(familyCopy.soon.notify.done).not.toMatch(/let you know|email|notification|we will|we'll/i);
  });
});

describe('coming-soon copy', () => {
  const s = familyCopy.soon;
  it('names the status plainly and promises no date', () => {
    expect(s.status).toBe('Coming soon');
    const all = JSON.stringify(s);
    expect(all).not.toMatch(/\b(January|February|March|April|May|June|July|August|September|October|November|December|20\d\d|weeks?|months?|days?|beta)\b/i);
  });

  it('personalises with {child} and never genders the child', () => {
    expect(s.title).toContain('{child}');
    expect(s.lead).toContain('{child}');
    expect(JSON.stringify(s)).not.toMatch(/\b(she|he|her|him|his|hers)\b/i);
  });

  it('is true about today: letters stay on this phone; three points', () => {
    expect(s.building).toMatch(/stays on this phone/);
    expect(s.points).toHaveLength(3);
  });
});

describe('doors that lead nowhere in v1.0 are hidden (D-087)', () => {
  it('off: no "I was invited" and no disabled "Family can read" switch; on: both come back', () => {
    expect(visibleCoParentDoors(false)).toEqual({ joinButton: false, familyCanReadSwitch: false });
    expect(visibleCoParentDoors(true)).toEqual({ joinButton: true, familyCanReadSwitch: true });
  });

  it('first run and child settings render them only through that rule', () => {
    const onboarding = src('app/onboarding.tsx');
    expect(onboarding).toMatch(/visibleCoParentDoors\(capabilities\.coParent\)/);
    expect(onboarding).toMatch(/doors\.joinButton \?/);
    const child = src('app/settings/children/[id].tsx');
    expect(child).toMatch(/doors\.familyCanReadSwitch &&/);
  });

  it('what stays: the Family tab, the Settings row and the invite landing still lead to coming soon', () => {
    expect(inviteDestination('family_tab', false)).toBe('coming_soon');
    expect(inviteDestination('settings_child', false)).toBe('coming_soon');
    expect(inviteDestination('invite_link', false)).toBe('coming_soon');
    expect(src('app/settings/children/[id].tsx')).toMatch(/familyCopy\.soon\.settingsRow\b/);
    expect(src('app/(tabs)/_layout.tsx')).toMatch(/family/);
  });
});
