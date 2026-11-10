/// <reference types="node" />
/**
 * D-126 (BL-604; store-listing BL-621): the store build with server features off shows no "coming soon" co-parent
 * door. The Family tab and the child Settings row "Write this book together" are hidden there, decided at bundle time
 * from the same APP_ENV switch as PLUS_ALPHA (lib/billing/alpha.ts) and the server switch (lib/capabilities.ts).
 * Every alpha build keeps both exactly as before.
 *
 * Both builds are tested from eas.json itself: each profile's env goes through the same parsers the bundle uses.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { isAlphaBuild } from '../src/lib/billing/alpha';
import { resolveAppEnv } from '../src/lib/build-env';
import { parseServerFeatures } from '../src/lib/capabilities';
import { bookRow } from '../src/components/child/child-settings.logic';
import { familyCopy } from '../src/lib/family/copy';
import { CO_PARENT_IN_STORE_BUILD, familySurfacesShown, INVITE_ENTRIES, inviteDestination, inviteHref, planIncomingLink, visibleCoParentDoors } from '../src/lib/family/entry.logic';

const APP = join(__dirname, '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');
const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string> }> };

/** What a build of this eas.json profile decides, through the bundle's own parsers. */
function profile(name: string): { alpha: boolean; coParent: boolean; shown: boolean } {
  const env = eas.build[name]?.env;
  if (!env) throw new Error(`no eas.json profile ${name}`);
  const appEnv = resolveAppEnv(env.EXPO_PUBLIC_APP_ENV);
  if (!appEnv) throw new Error(`${name}: unknown APP_ENV`);
  const alpha = isAlphaBuild(appEnv);
  const coParent = parseServerFeatures(env.EXPO_PUBLIC_SERVER_FEATURES);
  return { alpha, coParent, shown: familySurfacesShown({ alpha, coParent }) };
}

describe('familySurfacesShown', () => {
  it('BL-882: shows the Family tab in every build with server features on (store build: coming soon), hides it in a store build with them off', () => {
    expect(familySurfacesShown({ alpha: false, coParent: false })).toBe(false);
    // Build 12 (BL-882): servers on, store build. The tab is there and says coming soon (inviteDestination, below).
    expect(familySurfacesShown({ alpha: false, coParent: true })).toBe(true);
    expect(familySurfacesShown({ alpha: true, coParent: false })).toBe(true);
    expect(familySurfacesShown({ alpha: true, coParent: true })).toBe(true);
  });
});

describe('[BL-882] one coming soon state for every co-parent surface, decided by CO_PARENT_IN_STORE_BUILD', () => {
  const STORE = false;
  it('a store build with server features on and the constant false: every entry is coming soon, never the flow', () => {
    expect(CO_PARENT_IN_STORE_BUILD).toBe(false);
    for (const e of INVITE_ENTRIES) expect(inviteDestination(e, true, STORE), e).toBe('coming_soon');
  });

  it('the buttons and rows push the invite sheet, which shows coming soon, never /invite/new', () => {
    for (const e of ['settings_child', 'onboarding_join', 'family_tab'] as const) expect(inviteHref(e, true, STORE, 'child-1'), e).toBe('/invite?childId=child-1');
  });

  it('an opened invite link opens the calm page and keeps no token', () => {
    const path = 'https://earlyletters.com/j#t=x';
    expect(planIncomingLink({ kind: 'invite', token: 'x' } as never, { serverFeatures: true, gateStopped: false, alpha: STORE, path })).toEqual({ route: '/invite', keepInviteToken: false, keepAuthLink: false });
  });

  it('sign-in links still work in a store build with servers on (the account is Build 12)', () => {
    expect(planIncomingLink({ kind: 'auth-code' } as never, { serverFeatures: true, gateStopped: false, alpha: STORE, path: 'x' }).route).toBe('/sign-in/code');
  });

  it('"I was invited" stays hidden in the store build', () => {
    expect(visibleCoParentDoors(true, STORE).joinButton).toBe(false);
  });

  it('alpha builds are unchanged: the real flow, the join door and a kept token', () => {
    for (const e of INVITE_ENTRIES) expect(inviteDestination(e, true, true), e).toBe(e === 'invite_leave' ? 'coming_soon' : 'flow');
    expect(visibleCoParentDoors(true, true).joinButton).toBe(true);
  });

  it('servers off is coming soon whatever the build', () => {
    for (const alpha of [true, false]) for (const e of INVITE_ENTRIES) expect(inviteDestination(e, false, alpha), e).toBe('coming_soon');
  });

  it('the Settings row says coming soon with the store-build help line, and the screens read PLUS_ALPHA for it', () => {
    const row = bookRow({ serverFeatures: true, alpha: STORE, coParent: null, invite: inviteHref('settings_child', true, STORE, 'c') });
    expect(row).toEqual({ value: familyCopy.soon.status, footer: familyCopy.soon.storeBuild.settingsRowHelp, href: '/invite?childId=c' });
    const child = read('src/app/settings/children/[id].tsx');
    expect(child).toMatch(/inviteHref\('settings_child', serverFeaturesEnabled\(\), PLUS_ALPHA, child\.id\)/);
    for (const f of ['src/app/invite/index.tsx', 'src/app/invite/new.tsx']) expect(read(f), f).toMatch(/inviteDestination\('\w+', serverFeaturesEnabled\(\), PLUS_ALPHA\)/);
    expect(read('src/app/+native-intent.tsx')).toMatch(/alpha: PLUS_ALPHA/);
  });

  it('flipping the one constant is the only switch: no second flag exists', () => {
    const logic = read('src/lib/family/entry.logic.ts');
    expect(logic.match(/export const CO_PARENT\w* =/g)).toEqual(['export const CO_PARENT_IN_STORE_BUILD =']);
    expect(logic).toMatch(/export const CO_PARENT_IN_STORE_BUILD = false;/);
  });
});

describe('both builds, from eas.json', () => {
  // Founder ruling, 10 Nov 2026: Family shows in the servers-on store build. The production profile's switch is read from
  // eas.json (draft #698 flips it on), so this holds before and after that flip: shown exactly when co-parent is on.
  it('the store build (production) shows the Family tab and the Settings row exactly when its server switch is on', () => {
    const p = profile('production');
    expect(p.alpha).toBe(false);
    expect(p.shown).toBe(p.coParent);
  });

  it('the store build with servers off (the first-shipped case) hides both; with servers on shows both', () => {
    expect(familySurfacesShown({ alpha: false, coParent: parseServerFeatures('off') })).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: parseServerFeatures(undefined) })).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: parseServerFeatures('on') })).toBe(true);
  });

  it('the alpha builds keep them: testflight (servers off) shows coming soon, preview (servers on) the real flow', () => {
    expect(profile('testflight')).toEqual({ alpha: true, coParent: false, shown: true });
    expect(inviteDestination('family_tab', profile('testflight').coParent, true)).toBe('coming_soon');
    expect(profile('preview')).toEqual({ alpha: true, coParent: true, shown: true });
    expect(inviteDestination('family_tab', profile('preview').coParent, true)).toBe('flow');
  });

  it('development and e2e builds keep them too', () => {
    expect(profile('development').shown).toBe(true);
    expect(profile('e2e').shown).toBe(true);
  });
});

describe('the screens use the switch', () => {
  const tabs = read('src/app/(tabs)/_layout.tsx');

  it('the tabs layout guards Family with Tabs.Protected, decided at bundle time', () => {
    expect(tabs).toMatch(/const FAMILY_TAB = familySurfacesShown\(\{ alpha: PLUS_ALPHA, coParent: capabilities\.coParent \}\);/);
    expect(tabs).toMatch(/<Tabs\.Protected guard=\{FAMILY_TAB\}>\s*<Tabs\.Screen name="family"/);
    // Tonight and Book are never inside a guard.
    expect(tabs).toMatch(/<Tabs\.Screen name="index"[^\n]*\/>\n\s*<Tabs\.Screen name="book"[^\n]*\/>\n\s*<Tabs\.Protected/);
  });

  it('never uses href on a tab: expo-router throws when href and tabBarButton are set together', () => {
    expect(tabs).toMatch(/tabBarButton: button\(t\.family\)/);
    expect(tabs).not.toMatch(/options=\{\{[^}]*\bhref:/);
  });

  it('the child Settings row is drawn only when the surfaces are shown', () => {
    expect(read('src/app/settings/children/[id].tsx')).toMatch(
      /\{familySurfacesShown\(\{ alpha: PLUS_ALPHA, coParent: capabilities\.coParent \}\) && \(\s*<ListSection footer=\{row\.footer\}>\s*<ListRow [^\n]*testID="child\.bookRow" \/>\s*<\/ListSection>\s*\)\}/,
    );
  });

  it('the switch reads nothing a person can set: only the bundle-time APP_ENV and server switch', () => {
    const logic = read('src/lib/family/entry.logic.ts');
    expect(logic).toMatch(/export function familySurfacesShown\(input: \{ alpha: boolean; coParent: boolean \}\): boolean \{\n\s*return input\.alpha \|\| input\.coParent;\n\}/);
    // One named constant, off in Build 12; a family release flips it.
    expect(logic).toMatch(/export const CO_PARENT_IN_STORE_BUILD = false;/);
  });
});

describe('[NX-36-S0] the Family tab in a store build with server features on (BL-890, BL-882)', () => {
  /** The tab names in the layout, in order, without the Family tab when its guard is false (expo-router drops it). */
  function bar(shown: boolean): string[] {
    const layout = read('src/app/(tabs)/_layout.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    const names = [...layout.matchAll(/<Tabs\.Screen\s+name="(\w+)"/g)].map((m) => m[1]);
    return names.filter((n) => n !== 'family' || shown);
  }

  /** eas.json's production profile as Build 12 will run it: the same env, with server features switched on (#698). */
  function productionWithServersOn() {
    const env: Record<string, string> = { ...eas.build.production?.env, EXPO_PUBLIC_SERVER_FEATURES: 'on' };
    const alpha = isAlphaBuild(resolveAppEnv(env.EXPO_PUBLIC_APP_ENV)!);
    const coParent = parseServerFeatures(env.EXPO_PUBLIC_SERVER_FEATURES);
    return { alpha, coParent, shown: familySurfacesShown({ alpha, coParent }) };
  }

  it('[NX-36-S0] a servers-on production build shows Tonight, Book, Family and You, and Family says coming soon', () => {
    const p = productionWithServersOn();
    expect(p).toEqual({ alpha: false, coParent: true, shown: true });
    expect(bar(p.shown)).toEqual(['index', 'book', 'family', 'you']);
    expect(inviteDestination('family_tab', p.coParent, p.alpha)).toBe('coming_soon');
  });

  it('[NX-36-S0] the Family tab screen reads the same rule, so it shows the coming-soon presentation and no invite button', () => {
    const family = read('src/app/(tabs)/family.tsx');
    expect(family).toMatch(/inviteDestination\('family_tab', serverFeaturesEnabled\(\), PLUS_ALPHA\)/);
  });

  it('[NX-36-S0] every alpha build with servers on keeps four tabs, so the TestFlight family check still works', () => {
    expect(bar(profile('preview').shown)).toEqual(['index', 'book', 'family', 'you']);
  });
});
