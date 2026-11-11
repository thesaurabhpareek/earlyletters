/// <reference types="node" />
/**
 * NX-30a (docs/roadmap/next, 9 Nov 2026), the You tab: Settings home as a tab root, last in the bar. Read as source text
 * (nothing here loads React Native), like family-tab.test.ts and store-family-tab.test.ts.
 *
 * Rows covered: R1, R4, R6, R7, R8. Not covered here: R2 and R3 (a cold launch and tap counts are Maestro or device rows),
 * R5 (the selected label in SemiBold needs a custom tab label, more than the one-line token change NX-30a allowed, so it
 * is not built), R9 (packages/content/test/tab-labels.test.ts), R10 (tokens.test.ts glyph pairs already pin the colours).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
/** Source without comments. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const layout = code(read('app/(tabs)/_layout.tsx'));
const you = code(read('app/(tabs)/you.tsx'));
const home = read('app/settings/index.tsx');
const SCREENS = [...layout.matchAll(/<Tabs\.Screen\s+name="(\w+)"/g)].map((m) => m[1]);

describe('the You tab', () => {
  it('[NX-30a-R1] the last tab is You and it opens Settings home', () => {
    expect(SCREENS).toEqual(['index', 'book', 'you']);
    expect(layout).toMatch(/<Tabs\.Screen\s+name="you"[\s\S]*?title: t\.you,/);
    expect(en.tabs.you).toBe('Me');
    // The route is Settings home itself, re-exported: one component, not a copy.
    expect(you.trim()).toBe("export { default } from '../settings/index';");
    expect(home).toMatch(/export default function Settings\(\)/);
    // The Back-from-Settings label names this tab when a Settings page is opened from it.
    expect(code(read('app/settings/_layout.tsx'))).toMatch(/you: copy\.tabs\.you/);
  });

  it('[NX-30a-R4] every tab sets the Large Content Viewer title and fixed label size', () => {
    for (const name of SCREENS) {
      const line = layout.split('\n').find((l) => l.includes(`name="${name}"`)) ?? '';
      const block = name === 'you' ? layout.slice(layout.indexOf('name="you"')) : line;
      expect(block, name).toMatch(/tabBarButton: button\(t\.\w+\)/);
    }
    // The iOS wrapper spreads the library's own props (role "tab", selected state, label) and only adds the viewer title.
    expect(layout).toMatch(/<Pressable \{\.\.\.\(rest as PressableProps\)\} \{\.\.\.LARGE_CONTENT\(title\)\} \/>/);
    expect(layout).toMatch(/tabBarAllowFontScaling: false/);
    expect(layout).toMatch(/fontSize: tokens\.minFontSize/);
    expect(layout).not.toMatch(/options=\{\{[^}]*\bhref:/);
  });

  it('[NX-30a-R6] no tab is guarded and Family is not a tab: the bar is the same in every build', () => {
    expect(layout).not.toMatch(/Tabs\.Protected|FAMILY_TAB|name="family"/);
    expect(layout.indexOf('name="you"')).toBeGreaterThan(layout.indexOf('name="book"'));
  });

  it('[NX-30a-R7] the You tab draws no lamp and has one level 1 heading', () => {
    expect(home).not.toMatch(/Lamp/);
    expect(you).not.toMatch(/Lamp/);
    // One title, in the tab's own header, and no Back: the tab group draws none and the screen sets no headerLeft.
    const block = layout.slice(layout.indexOf('name="you"'));
    expect(block).toMatch(/headerShown: true/);
    expect(block).toMatch(/headerTitle: copy\.settings\.title/);
    expect(block).not.toMatch(/headerLeft/);
  });

  it('[NX-30a-R8] four tabs at 320 pt and 375 pt keep 44 pt targets and whole labels', () => {
    const BAR = Number(/const BAR = (\d+);/.exec(layout)?.[1]);
    for (const width of [320, 375]) {
      expect(width / SCREENS.length).toBeGreaterThanOrEqual(tokens.target.min);
      // A generous bound for 13 pt Mukta Medium: 0.62 em per letter. The widest title is "Tonight".
      const widest = Math.max(...Object.values(en.tabs).map((l) => l.length)) * tokens.minFontSize * 0.62;
      expect(widest).toBeLessThan(width / SCREENS.length);
    }
    expect(tokens.minFontSize).toBe(13);
    // The item: 5 pt padding + 25 pt icon + 18 pt label line + 5 pt, inside BAR with 4 pt above.
    expect(BAR - 4).toBeGreaterThanOrEqual(53);
    expect(BAR).toBeGreaterThanOrEqual(tokens.target.min);
  });
});
