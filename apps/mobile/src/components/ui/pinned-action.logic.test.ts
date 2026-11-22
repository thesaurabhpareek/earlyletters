/**
 * [BL-418] One primary action, pinned at the bottom (DESIGN_LANGUAGE bottom-action rule). The rule: pinned below
 * accessibility sizes; from AX1 up it scrolls with the content, last (A11Y-AND-TYPE-AUDIT rule 3, SCREEN-PATHS PATH-05).
 * Source scans for the screens read text only, like test/a11y-ax5.test.ts: nothing here loads React Native.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { FONT_SCALE } from '@/lib/a11y.logic';
import { PINNED_ACTION, isPinned } from './pinned-action.logic';

const SRC = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

describe('[BL-418] pinned action rule', () => {
  it('is pinned at the default size and through xxxLarge', () => {
    expect(isPinned(FONT_SCALE.large)).toBe(true);
    expect(isPinned(FONT_SCALE.xxxLarge)).toBe(true);
  });
  it('scrolls with the content from AX1 up, so a big size costs a scroll, not the screen', () => {
    expect(isPinned(FONT_SCALE.ax1)).toBe(false);
    expect(isPinned(FONT_SCALE.ax3)).toBe(false);
  });
  it('the footer is made of tokens: gutter 20, primary 56', () => {
    expect(PINNED_ACTION.gutter).toBe(tokens.space[5]);
    expect(PINNED_ACTION.minHeight).toBe(56);
    expect(PINNED_ACTION.minHeight).toBe(tokens.target.primary);
  });
});

describe('[BL-418] first slice: the screens use the one primitive', () => {
  const screens: Array<[string, string]> = [
    ['Book empty', 'app/(tabs)/book.tsx'],
    ['Export', 'app/settings/export.tsx'],
    ['End of book', 'app/read-together.tsx'],
  ];
  for (const [name, file] of screens) {
    it(`${name} pins its primary through PinnedActionLayout`, () => {
      expect(read(file)).toMatch(/<PinnedActionLayout[\s\S]*?action=/);
    });
  }
  it('the primitive reads the font scale and keeps tokens only', () => {
    const src = read('components/ui/pinned-action.tsx');
    expect(src).toMatch(/isPinned\(useFontScale\(\)\)/);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
