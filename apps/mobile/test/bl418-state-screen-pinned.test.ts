/**
 * [BL-418] slice 4 (rulings E3 and E4): StateScreen adopts the pinned-action primitive, and its heading and sentence
 * start-align while the picture stays centred. Source scans, like test/a11y-ax5.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) => readFileSync(join(SRC, rel), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const view = () => {
  const f = code('components/ui/state-screen.tsx');
  return f.slice(f.indexOf('export function StateScreenView'), f.indexOf('export type InlineStateProps'));
};

describe('[BL-418][E3] StateScreen pins its action through PinnedActionLayout', () => {
  it('uses the primitive, centred, with the actions as its action; the SafeAreaView owns the bottom edge', () => {
    const v = view();
    expect(v).toMatch(/<PinnedActionLayout\s+center\s+insetBottom=\{false\}/);
    expect(v).toMatch(/action=\{hasActions\(kind, primary, quiet\) \? <Actions kind=\{kind\} primary=\{primary\} quiet=\{quiet\} \/> : null\}/);
  });
  it('keeps no ScrollView or footer of its own, and no gutter on the scroll (the footer carries its own)', () => {
    const f = code('components/ui/state-screen.tsx');
    expect(f).not.toMatch(/ScrollView/);
    expect(view()).not.toMatch(/contentContainerStyle=\{\{[^}]*paddingHorizontal/);
  });
  it('a screen with no action pins nothing (loading)', () => {
    expect(code('components/ui/state-screen.tsx')).toMatch(/Boolean\(layout\.primary\) \|\| layout\.quiet\.length > 0/);
  });
});

describe('[BL-418][E4] StateScreen: picture centred, heading and sentence on the start edge', () => {
  it('centres only the picture, from the layout constant', () => {
    expect(view()).toMatch(/<View style=\{\{ alignItems: L\.align\.picture \}\}>\{picture\}<\/View>/);
  });
  it('sets no centred text alignment on the title or the sentence', () => {
    const v = view();
    expect(v).not.toMatch(/textAlign/);
    expect(v).not.toMatch(/alignItems: 'center'/);
  });
});
