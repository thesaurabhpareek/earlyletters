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
import { CO_PARENT_IN_STORE_BUILD, familySurfacesShown, inviteDestination } from '../src/lib/family/entry.logic';

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
  it('hides in a store build whatever the server switch says, and shows in every alpha build', () => {
    expect(familySurfacesShown({ alpha: false, coParent: false })).toBe(false);
    // BL-776: Build 12 turns server features on in the store build, and the Family tab still stays out (was `true` in #665).
    expect(familySurfacesShown({ alpha: false, coParent: true })).toBe(false);
    expect(familySurfacesShown({ alpha: true, coParent: false })).toBe(true);
    expect(familySurfacesShown({ alpha: true, coParent: true })).toBe(true);
  });
});

describe('both builds, from eas.json', () => {
  it('the store build (production, servers off) hides the Family tab and the Settings row', () => {
    expect(profile('production')).toEqual({ alpha: false, coParent: false, shown: false });
  });

  it('the alpha builds keep them: testflight (servers off) shows coming soon, preview (servers on) the real flow', () => {
    expect(profile('testflight')).toEqual({ alpha: true, coParent: false, shown: true });
    expect(inviteDestination('family_tab', profile('testflight').coParent)).toBe('coming_soon');
    expect(profile('preview')).toEqual({ alpha: true, coParent: true, shown: true });
    expect(inviteDestination('family_tab', profile('preview').coParent)).toBe('flow');
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
    expect(logic).toMatch(
      /export function familySurfacesShown\(input: \{ alpha: boolean; coParent: boolean \}\): boolean \{\n\s*return input\.alpha \|\| \(input\.coParent && CO_PARENT_IN_STORE_BUILD\);\n\}/,
    );
    // One named constant, off in Build 12; a family release flips it.
    expect(logic).toMatch(/export const CO_PARENT_IN_STORE_BUILD = false;/);
  });
});

describe('[NX-36-S0] the store build keeps three tabs when server features are on (BL-776)', () => {
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

  it('[NX-36-S0] a servers-on production build still shows exactly Tonight, Book and You', () => {
    const p = productionWithServersOn();
    expect(p).toEqual({ alpha: false, coParent: true, shown: false });
    expect(bar(p.shown)).toEqual(['index', 'book', 'you']);
    expect(bar(p.shown).map((n) => ({ index: en.tabs.tonight, book: en.tabs.book, you: en.tabs.you })[n])).toEqual(['Tonight', 'Book', 'You']);
  });

  it('[NX-36-S0] the same build shows no Write this book together row either, and flipping the one constant is what would bring both back', () => {
    expect(CO_PARENT_IN_STORE_BUILD).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: true })).toBe(CO_PARENT_IN_STORE_BUILD);
    // The row is drawn by the same predicate (see the screens test above).
    expect(read('src/app/settings/children/[id].tsx')).toMatch(/familySurfacesShown\(\{ alpha: PLUS_ALPHA, coParent: capabilities\.coParent \}\) && \(/);
  });

  it('[NX-36-S0] every alpha build with servers on keeps four tabs, so the TestFlight family check still works', () => {
    expect(bar(profile('preview').shown)).toEqual(['index', 'book', 'family', 'you']);
  });
});
