/// <reference types="node" />
/**
 * Moments tab shell (PRD 28 PR 6): dark behind EXPO_PUBLIC_MOMENTS_TAB, off by default. Read as source text. The screen
 * reads no library, calls no network and no native module, and draws from tokens and content only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOMENTS_TAB_ON, momentsTabLabel, momentsTabVisibility, tabPositionLabel, tabPositionOptions } from '../src/lib/nav/moments-tab';

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const screen = code(readFileSync(join(SRC, 'app/(tabs)/moments.tsx'), 'utf8'));
const flag = readFileSync(join(SRC, 'lib/nav/moments-tab.ts'), 'utf8');

describe('the Moments tab shell', () => {
  it('[F1] the flag is off unless the build says on, so the bar is unchanged by default', () => {
    expect(MOMENTS_TAB_ON).toBe(false);
    expect(flag).toMatch(/parseServerFeatures\(process\.env\.EXPO_PUBLIC_MOMENTS_TAB\)/);
    expect(Object.keys(momentsTabVisibility(false)).sort()).toEqual(['tabBarButton', 'tabBarItemStyle']);
  });

  it('the placeholder reads no library, no network, no native module and no storage', () => {
    const imports = [...screen.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
    expect(imports.sort()).toEqual(['@/components/ui/safe-area-view', '@/components/ui/text', '@/lib/copy', '@/lib/nav/moments-tab', 'expo-router', 'react-native'].sort());
    expect(screen).not.toMatch(/\bfetch\(|XMLHttpRequest|NativeModules|requireNativeModule|expo-media-library|PHAsset|AsyncStorage|sqlite|supabase/i);
  });

  it('the placeholder uses tokens only: no colour literal, no pixel size, no timing', () => {
    expect(screen).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|\b\d+px\b|fontSize|duration|withTiming|Animated/i);
  });

  it('the heading is a heading with an accessibility label, and flag off sends a link to Home', () => {
    expect(screen).toMatch(/asHeading/);
    expect(screen).toMatch(/accessibilityLabel=\{label\}/);
    expect(screen).toMatch(/if \(!MOMENTS_TAB_ON\) return <Redirect href="\/" \/>/);
  });

  it('the label reads the proposed tabs.moments key when content adds it, else an existing key', () => {
    expect(momentsTabLabel({ book: 'Book' })).toBe('Book');
    expect(momentsTabLabel({ book: 'Book', moments: 'Moments' })).toBe('Moments');
  });

  it('no Moments options object carries both href and tabBarButton (expo-router throws on iOS), and the hidden one has no button', () => {
    for (const on of [true, false]) {
      const opts = { tabBarButton: () => 'ios button', ...momentsTabVisibility(on) } as Record<string, unknown>;
      expect('href' in opts && 'tabBarButton' in opts).toBe(false);
    }
    expect((momentsTabVisibility(false).tabBarButton as () => null)()).toBeNull();
    expect(momentsTabVisibility(false).tabBarItemStyle).toEqual({ display: 'none' });
    expect(momentsTabVisibility(true)).toEqual({});
    const layoutText = readFileSync(join(SRC, 'app/(tabs)/_layout.tsx'), 'utf8');
    expect(layoutText.split("\n").find((l) => l.includes('name="moments"'))).not.toMatch(/\bhref\b/);
    expect(layoutText).toMatch(/tabBarButton: button\(momentsLabel\), \.\.\.momentsTabVisibility/);
  });

  it('the installed expo-router still throws on href with tabBarButton (the reason for the rule above)', () => {
    const src = readFileSync(join(require.resolve('expo-router/package.json'), '..', 'build/layouts/TabsClient.js'), 'utf8');
    expect(src).toMatch(/Cannot use `href` and `tabBarButton` together/);
  });

  it('VoiceOver positions count the visible tabs: 1 to 3 of 3 with the flag off, the library default with it on', () => {
    expect(tabPositionLabel('index', 'Home', false)).toBe('Home, tab, 1 of 3');
    expect(tabPositionLabel('book', 'Book', false)).toBe('Book, tab, 2 of 3');
    expect(tabPositionLabel('you', 'Me', false)).toBe('Me, tab, 3 of 3');
    expect(tabPositionLabel('moments', 'Moments', false)).toBeUndefined();
    for (const id of ['index', 'moments', 'book', 'you'] as const) expect(tabPositionLabel(id, 'X', true)).toBeUndefined();
    // On is the library's own: index + 1 of 4 in the order Home, Moments, Book, Me, with nothing set here.
    expect(tabPositionOptions('book', 'Book', true, true)).toEqual({});
    expect(tabPositionOptions('book', 'Book', false, true)).toEqual({ tabBarAccessibilityLabel: 'Book, tab, 2 of 3' });
    expect(tabPositionOptions('book', 'Book', false, false)).toEqual({});
  });

  it('the layout sets the position on the three tabs it always shows', () => {
    const layoutText = readFileSync(join(SRC, 'app/(tabs)/_layout.tsx'), 'utf8');
    for (const id of ['index', 'book', 'you']) expect(layoutText).toContain(`...position('${id}'`);
    const lib = readFileSync(join(require.resolve('expo-router/package.json'), '..', 'build/react-navigation/bottom-tabs/views/BottomTabBar.js'), 'utf8');
    expect(lib).toMatch(/\$\{label\}, tab, \$\{index \+ 1\} of \$\{routes\.length\}/);
  });
});
