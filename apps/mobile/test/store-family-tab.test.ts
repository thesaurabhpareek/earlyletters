/// <reference types="node" />
/**
 * Founder, 11 Nov 2026: three tabs (Home, Book, Me) in every build; Family is never a tab; co-parent "coming soon" is
 * not a tab, not a row, not a screen. This replaces D-126's "hide it in a store build with servers off" and BL-882's
 * "one coming soon on every co-parent surface" with one rule: the co-parent surfaces exist only where the real flow
 * does, and everywhere else there is nothing and no way to reach nothing.
 *
 * Builds are tested from eas.json itself: each profile's env goes through the same parsers the bundle uses.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { isAlphaBuild } from '../src/lib/billing/alpha';
import { resolveAppEnv } from '../src/lib/build-env';
import { parseServerFeatures } from '../src/lib/capabilities';
import { bookRow } from '../src/components/child/child-settings.logic';
import { familySurfacesShown, INVITE_ENTRIES, inviteDestination, inviteHref, planIncomingLink, visibleCoParentDoors } from '../src/lib/family/entry.logic';

const APP = join(__dirname, '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');
const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string> }> };

/** What a build of this eas.json profile decides, through the bundle's own parsers. */
function profile(name: string, over: Record<string, string> = {}): { alpha: boolean; coParent: boolean; shown: boolean } {
  const env = eas.build[name]?.env;
  if (!env) throw new Error(`no eas.json profile ${name}`);
  const merged = { ...env, ...over };
  const appEnv = resolveAppEnv(merged.EXPO_PUBLIC_APP_ENV);
  if (!appEnv) throw new Error(`${name}: unknown APP_ENV`);
  const alpha = isAlphaBuild(appEnv);
  const coParent = parseServerFeatures(merged.EXPO_PUBLIC_SERVER_FEATURES);
  return { alpha, coParent, shown: familySurfacesShown({ alpha, coParent }) };
}

/** The tab names in the layout, in order. There is no guard, so this is the bar in every build. */
function bar(): string[] {
  const layout = read('src/app/(tabs)/_layout.tsx')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  return [...layout.matchAll(/<Tabs\.Screen\s+name="(\w+)"/g)].map((m) => m[1]);
}

describe('[11 Nov] three tabs in every build, Family is never one', () => {
  const layout = read('src/app/(tabs)/_layout.tsx');

  it('the bar is index, book, you, and the labels are Home, Book, Me', () => {
    expect(bar()).toEqual(['index', 'book', 'you']);
    expect([en.tabs.tonight, en.tabs.book, en.tabs.you]).toEqual(['Home', 'Book', 'Me']);
  });

  it('no guard and no build rule in the layout: servers on or off, alpha or store, the same bar', () => {
    expect(layout).not.toMatch(/Tabs\.Protected|FAMILY_TAB|familySurfacesShown|PLUS_ALPHA|capabilities|serverFeaturesEnabled/);
    expect(layout).not.toMatch(/name="family"|t\.family|UsersThree/);
    expect(layout).not.toMatch(/options=\{\{[^}]*\bhref:/);
  });

  it('the Family screen is a pushed route outside (tabs), and the tab folder has no family file', () => {
    expect(existsSync(join(APP, 'src/app/(tabs)/family.tsx'))).toBe(false);
    expect(existsSync(join(APP, 'src/app/family.tsx'))).toBe(true);
  });

  it('every eas.json profile gets that bar: nothing in the bar reads the profile', () => {
    for (const name of Object.keys(eas.build)) {
      if (!eas.build[name]?.env?.EXPO_PUBLIC_APP_ENV) continue;
      for (const servers of ['on', 'off']) expect(() => profile(name, { EXPO_PUBLIC_SERVER_FEATURES: servers }), `${name} ${servers}`).not.toThrow();
    }
    expect(bar()).toHaveLength(3);
  });
});

describe('[11 Nov] servers off changes nothing a person can see, against servers on without the flow (the no-op test)', () => {
  const STORE = false;
  it('a store build: servers off and servers on have the same surfaces, which are none', () => {
    expect(read('src/lib/family/entry.logic.ts')).not.toMatch(/CO_PARENT_IN_STORE_BUILD/);
    for (const serverFeatures of [false, true]) {
      for (const e of INVITE_ENTRIES) expect(inviteDestination(e, serverFeatures, STORE), `${e} ${serverFeatures}`).toBe('coming_soon');
      expect(bookRow({ serverFeatures, alpha: STORE, coParent: null, invite: inviteHref('settings_child', serverFeatures, STORE, 'c') }), `row ${serverFeatures}`).toBeNull();
      expect(visibleCoParentDoors(serverFeatures, STORE).joinButton).toBe(false);
      expect(familySurfacesShown({ alpha: STORE, coParent: serverFeatures })).toBe(false);
    }
  });

  it('an invite link in either store case opens Tonight and keeps no token; sign-in links still follow the switch', () => {
    const path = 'https://earlyletters.com/j#t=x';
    for (const serverFeatures of [false, true]) {
      expect(planIncomingLink({ kind: 'invite', token: 'x' } as never, { serverFeatures, gateStopped: false, alpha: STORE, path })).toEqual({ route: '/', keepInviteToken: false, keepAuthLink: false });
    }
    expect(planIncomingLink({ kind: 'auth-code' } as never, { serverFeatures: true, gateStopped: false, alpha: STORE, path: 'x' }).route).toBe('/sign-in/code');
  });

  it('no route in the app draws a coming-soon presentation: the old screens are gone and the routes redirect', () => {
    expect(existsSync(join(APP, 'src/components/family/coparent-soon.tsx'))).toBe(false);
    expect(existsSync(join(APP, 'src/components/family/invite-coming-soon.tsx'))).toBe(false);
    for (const f of ['src/app/invite/index.tsx', 'src/app/invite/new.tsx', 'src/app/invite/leave.tsx', 'src/app/family.tsx']) {
      const src = read(f);
      expect(src, f).toMatch(/<Redirect href="\/" \/>/);
      expect(src, f).not.toMatch(/CoParentSoon|InviteComingSoon/);
    }
  });

  it('the one mutation that matters: the Settings row reads the build rule, so a servers-on store build cannot show it by reading the switch alone', () => {
    const child = read('src/app/settings/children/[id].tsx');
    expect(child).toMatch(/inviteHref\('settings_child', serverFeaturesEnabled\(\), PLUS_ALPHA, child\.id\)/);
    expect(child).toMatch(/bookRow\(\{ serverFeatures: serverFeaturesEnabled\(\), alpha: PLUS_ALPHA,/);
    expect(child).toMatch(/\{row && \(\s*<ListSection>\s*<ListRow [^\n]*testID="child\.bookRow" \/>\s*<\/ListSection>\s*\)\}/);
    expect(child).not.toMatch(/familyCopy\.soon|row\.footer/);
  });

  it('the invite routes read the rule with PLUS_ALPHA', () => {
    for (const f of ['src/app/invite/index.tsx', 'src/app/invite/new.tsx', 'src/app/family.tsx']) expect(read(f), f).toMatch(/inviteDestination\('\w+', serverFeaturesEnabled\(\), PLUS_ALPHA\)/);
    expect(read('src/app/+native-intent.tsx')).toMatch(/alpha: PLUS_ALPHA/);
  });
});

describe('alpha builds keep the real flow, on routes and rows and not on a tab', () => {
  it('every alpha build with servers on: the flow, the join door, the row, a kept token', () => {
    for (const e of INVITE_ENTRIES) expect(inviteDestination(e, true, true), e).toBe(e === 'invite_leave' ? 'coming_soon' : 'flow');
    expect(visibleCoParentDoors(true, true).joinButton).toBe(true);
    expect(familySurfacesShown({ alpha: true, coParent: true })).toBe(true);
    expect(bookRow({ serverFeatures: true, alpha: true, coParent: null, invite: '/invite/new?childId=c' })).toEqual({ href: '/invite/new?childId=c' });
    expect(bookRow({ serverFeatures: true, alpha: true, coParent: 'Papa', invite: 'x' })).toEqual({ value: 'Papa', href: '/family' });
    const link = planIncomingLink({ kind: 'invite', token: 'x' } as never, { serverFeatures: true, gateStopped: false, alpha: true, path: 'x' });
    expect(link).toEqual({ route: '/invite', keepInviteToken: true, keepAuthLink: false });
  });

  it('an alpha build with servers off has no row and no flow, like a store build', () => {
    const p = profile('testflight');
    expect(p).toEqual({ alpha: true, coParent: false, shown: false });
    expect(bookRow({ serverFeatures: p.coParent, alpha: p.alpha, coParent: null, invite: '/invite' })).toBeNull();
  });

  it('the eas.json profiles: preview has the flow, testflight and production (servers off) do not', () => {
    expect(profile('preview')).toEqual({ alpha: true, coParent: true, shown: true });
    expect(profile('production', { EXPO_PUBLIC_SERVER_FEATURES: 'off' }).shown).toBe(false);
    expect(profile('production', { EXPO_PUBLIC_SERVER_FEATURES: 'on' })).toEqual({ alpha: false, coParent: true, shown: false });
  });

  it('one rule, no second flag: the store build has no co-parent flow, and every door reads servers on AND alpha (founder, 11 Nov 2026)', () => {
    const logic = read('src/lib/family/entry.logic.ts');
    expect(logic).not.toMatch(/export const CO_PARENT\w* =/);
    expect(logic).toMatch(/export function familySurfacesShown\(input: \{ alpha: boolean; coParent: boolean \}\): boolean \{\n\s*return input\.coParent && input\.alpha;\n\}/);
    for (const coParent of [true, false]) for (const alpha of [true, false]) {
      expect(visibleCoParentDoors(coParent, alpha).joinButton).toBe(coParent && alpha);
      expect(familySurfacesShown({ alpha, coParent })).toBe(coParent && alpha);
    }
  });
});
