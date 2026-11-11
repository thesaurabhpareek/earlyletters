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
import { isAlphaBuild } from '../src/lib/billing/alpha';
import { resolveAppEnv } from '../src/lib/build-env';
import { parseServerFeatures } from '../src/lib/capabilities';
import { familySurfacesShown, inviteDestination } from '../src/lib/family/entry.logic';

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
  it('hides in every store build (servers on or off; #737 Review B)', () => {
    expect(familySurfacesShown({ alpha: false, coParent: false })).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: true })).toBe(false);
    expect(familySurfacesShown({ alpha: true, coParent: false })).toBe(true);
    expect(familySurfacesShown({ alpha: true, coParent: true })).toBe(true);
  });
});

describe('both builds, from eas.json', () => {
  // Founder ruling, 10 Nov 2026: Family shows in the servers-on store build. The production profile's switch is read from
  // eas.json (draft #698 flips it on), so this holds before and after that flip: shown exactly when co-parent is on.
  it('the store build (production) shows neither the Family tab nor the Settings row, whatever its server switch', () => {
    const p = profile('production');
    expect(p.alpha).toBe(false);
    expect(p.shown).toBe(false);
  });

  it('the store build with servers off (the first-shipped case) hides both; with servers on hides both too (the join door is closed)', () => {
    expect(familySurfacesShown({ alpha: false, coParent: parseServerFeatures('off') })).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: parseServerFeatures(undefined) })).toBe(false);
    expect(familySurfacesShown({ alpha: false, coParent: parseServerFeatures('on') })).toBe(false);
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
    expect(logic).toMatch(/export function familySurfacesShown\(input: \{ alpha: boolean; coParent: boolean \}\): boolean \{\n[^\n]*\n\s*return input\.alpha \|\| visibleCoParentDoors\(input\.coParent, input\.alpha\)\.joinButton;\n\}/);
  });
});
