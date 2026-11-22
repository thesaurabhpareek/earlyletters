/// <reference types="node" />
/**
 * Moments tab shell (PRD 28 PR 6): dark behind EXPO_PUBLIC_MOMENTS_TAB, off by default. Read as source text. The screen
 * reads no library, calls no network and no native module, and draws from tokens and content only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOMENTS_TAB_ON, momentsTabLabel, momentsTabVisibility } from '../src/lib/nav/moments-tab';

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const screen = code(readFileSync(join(SRC, 'app/(tabs)/moments.tsx'), 'utf8'));
const flag = readFileSync(join(SRC, 'lib/nav/moments-tab.ts'), 'utf8');

describe('the Moments tab shell', () => {
  it('[F1] the flag is off unless the build says on, so the bar is unchanged by default', () => {
    expect(MOMENTS_TAB_ON).toBe(false);
    expect(flag).toMatch(/parseServerFeatures\(process\.env\.EXPO_PUBLIC_MOMENTS_TAB\)/);
    expect(momentsTabVisibility(false)).toEqual({ href: null });
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
});
